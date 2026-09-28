import { MaterialCommunityIcons } from '@expo/vector-icons';
import { jalaaliMonthLength, toJalaali } from 'jalaali-js';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Button, Card, Menu, Snackbar } from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { DailyWorkTimeField, getDailyWorkMinutes } from '@/components/daily-work-time-field';
import { DateInputField } from '@/components/date-input-field';
import { PersianDatePickerModal } from '@/components/persian-date-picker-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { fetchJobGroups, fetchPeriodsByYearId, fetchSeniorityBaseByGroup, fetchYears, seedFromJsonAsset } from '@/database';
import { useTheme } from '@/hooks/use-theme';
import { getDailyWorkRatio, scaleWageCalculationResult } from '@/utils/daily-work-ratio';
import {
    calculateAvailableFridaysByYear,
    calculateFridayWorkFromPeriodData,
    parseDateInput,
    type EntitledSeniorityWorkshopType,
    type FridayWorkCalculationResult,
    type SalaryPeriodBucket,
} from '@/utils/salary-calculation';

export default function FridayWorkScreen() {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const currentJalaliDate = useMemo(() => {
        const today = new Date();
        return toJalaali(today.getFullYear(), today.getMonth() + 1, today.getDate());
    }, []);

    const currentPersianYear = currentJalaliDate.jy;
    const defaultStartDate = `${currentPersianYear}/01/01`;
    const defaultEndDate = `${currentPersianYear}/12/${jalaaliMonthLength(currentPersianYear, 12)}`;
    const defaultEmploymentDate = `${currentPersianYear - 1}/01/01`;

    const [startDate, setStartDate] = useState(defaultStartDate);
    const [endDate, setEndDate] = useState(defaultEndDate);
    const [employmentDate, setEmploymentDate] = useState(defaultEmploymentDate);
    const [workshopType, setWorkshopType] = useState<EntitledSeniorityWorkshopType>('unclassified');
    const [settledThrough1391, setSettledThrough1391] = useState(false);
    const [jobGroups, setJobGroups] = useState<{ id: number; group_number: number; sort_order: number }[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
    const [groupMenuVisible, setGroupMenuVisible] = useState(false);
    const [fridayWorkDaysByYear, setFridayWorkDaysByYear] = useState<Record<number, string>>({});
    const [pickerTarget, setPickerTarget] = useState<'start' | 'end' | 'employment' | null>(null);
    const [pickerVisible, setPickerVisible] = useState(false);
    const [periodBuckets, setPeriodBuckets] = useState<SalaryPeriodBucket[]>([]);
    const [availableYears, setAvailableYears] = useState<number[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [result, setResult] = useState<FridayWorkCalculationResult | null>(null);
    const [dailyWorkTime, setDailyWorkTime] = useState('07:20');
    const [showDetailedBreakdown, setShowDetailedBreakdown] = useState(false);
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    useEffect(() => {
        let isMounted = true;

        const loadData = async () => {
            try {
                setIsLoadingData(true);
                await seedFromJsonAsset();

                const [years, groups] = await Promise.all([fetchYears(), fetchJobGroups()]);
                const buckets: SalaryPeriodBucket[] = [];

                for (const year of years) {
                    const periods = await fetchPeriodsByYearId(year.id);
                    if (periods.length === 0) {
                        continue;
                    }

                    const mappedPeriods = await Promise.all(periods.map(async (period) => ({
                        period_index: period.period_index,
                        month_count: period.month_count,
                        daily_minimum_wage: period.daily_minimum_wage,
                        percent_increase: period.percent_increase,
                        seniority_base: period.seniority_base,
                        seniority_base_by_group: Object.fromEntries(
                            (await fetchSeniorityBaseByGroup(period.id)).map((row) => {
                                const group = groups.find((item) => item.id === row.job_group_id);
                                return [group?.group_number ?? row.job_group_id, Number(row.base_value)];
                            }),
                        ),
                    })));

                    buckets.push({
                        year: year.year,
                        periods: mappedPeriods,
                    });
                }

                if (isMounted) {
                    setPeriodBuckets(buckets);
                    setAvailableYears(years.map((year) => year.year));
                    setJobGroups(groups);
                    setSelectedGroup(groups[0]?.group_number ?? null);
                }
            } catch {
                if (isMounted) {
                    setSnackbarMessage('خطا در بارگذاری داده‌ها. لطفاً دوباره تلاش کنید.');
                    setSnackbarVisible(true);
                }
            } finally {
                if (isMounted) {
                    setIsLoadingData(false);
                }
            }
        };

        void loadData();

        return () => {
            isMounted = false;
        };
    }, []);

    const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
    const latinDigits = '0123456789';

    const normalizeDigits = (value: string) => value.replace(/[۰-۹]/g, (digit) => latinDigits[persianDigits.indexOf(digit)]);
    const toPersianDigits = (value: string | number) => String(value).replace(/\d/g, (digit) => persianDigits[Number(digit)]);
    const filterFridayWorkDaysInput = (value: string) => value.replace(/[^0-9۰-۹]/g, '');
    const formatCurrency = (value: number) => `${new Intl.NumberFormat('fa-IR').format(Math.round(value))} ریال`;

    const formatDisplayedDate = (value: string) => {
        const parsed = parseDateInput(value);

        if (!parsed) {
            return '';
        }

        return `${toPersianDigits(String(parsed.year))}/${toPersianDigits(String(parsed.month).padStart(2, '0'))}/${toPersianDigits(String(parsed.day).padStart(2, '0'))}`;
    };

    const compareDates = (left: string, right: string) => {
        const parsedLeft = parseDateInput(left);
        const parsedRight = parseDateInput(right);

        if (!parsedLeft || !parsedRight) {
            return 0;
        }

        const leftValue = parsedLeft.year * 10000 + parsedLeft.month * 100 + parsedLeft.day;
        const rightValue = parsedRight.year * 10000 + parsedRight.month * 100 + parsedRight.day;
        return leftValue < rightValue ? -1 : leftValue > rightValue ? 1 : 0;
    };

    const openPicker = (target: 'start' | 'end' | 'employment') => {
        setPickerTarget(target);
        setPickerVisible(true);
    };

    const closePicker = () => {
        setPickerVisible(false);
        setPickerTarget(null);
    };

    const handleDateSelect = (value: string) => {
        if (pickerTarget === 'employment') {
            if (compareDates(value, startDate) > 0) {
                setSnackbarMessage('تاریخ استخدام باید برابر یا قبل از تاریخ شروع جمعه‌کاری باشد.');
                setSnackbarVisible(true);
                closePicker();
                return;
            }
            setEmploymentDate(value);
            if ((parseDateInput(value)?.year ?? 0) > 1391) {
                setSettledThrough1391(false);
            }
        } else if (pickerTarget === 'start') {
            setStartDate(value);
            if (compareDates(value, endDate) > 0) {
                setEndDate(value);
            }
        } else if (pickerTarget === 'end') {
            if (compareDates(value, startDate) < 0) {
                setEndDate(startDate);
                setSnackbarMessage('تاریخ پایان باید برابر یا بزرگتر از تاریخ شروع باشد.');
                setSnackbarVisible(true);
                closePicker();
                return;
            }

            setEndDate(value);
        }
        closePicker();
    };

    const selectedYears = (() => {
        const parsedStartDate = parseDateInput(startDate);
        const parsedEndDate = parseDateInput(endDate);
        if (!parsedStartDate || !parsedEndDate || compareDates(startDate, endDate) > 0) {
            return [];
        }

        return Array.from(
            { length: parsedEndDate.year - parsedStartDate.year + 1 },
            (_, index) => parsedStartDate.year + index,
        );
    })();
    const availableFridaysByYear = (() => {
        const parsedStartDate = parseDateInput(startDate);
        const parsedEndDate = parseDateInput(endDate);
        if (!parsedStartDate || !parsedEndDate) {
            return {};
        }

        return calculateAvailableFridaysByYear(parsedStartDate, parsedEndDate);
    })();
    const canUseSettlementPath = (parseDateInput(employmentDate)?.year ?? 0) <= 1391;

    const updateFridayWorkDays = (year: number, value: string) => {
        setFridayWorkDaysByYear((currentValues) => ({
            ...currentValues,
            [year]: filterFridayWorkDaysInput(value),
        }));
    };

    const changeFridayWorkDays = (year: number, amount: number) => {
        const currentValue = Number(normalizeDigits(
            fridayWorkDaysByYear[year] ?? String(availableFridaysByYear[year] ?? 0),
        )) || 0;
        const available = availableFridaysByYear[year] ?? 0;
        const nextValue = Math.min(available, Math.max(0, currentValue + amount));

        setFridayWorkDaysByYear((currentValues) => ({
            ...currentValues,
            [year]: toPersianDigits(String(nextValue)),
        }));
    };

    const validateFridayWorkDays = (year: number) => {
        const value = Number(normalizeDigits((fridayWorkDaysByYear[year] ?? '').trim()));
        const available = availableFridaysByYear[year] ?? 0;

        if (Number.isInteger(value) && value > available) {
            setFridayWorkDaysByYear((currentValues) => ({
                ...currentValues,
                [year]: toPersianDigits(String(available)),
            }));
            setSnackbarMessage(`تعداد جمعه کاری وارده در سال ${toPersianDigits(year)} بیش تر از تعداد جمعه کاری موجود است`);
            setSnackbarVisible(true);
        }
    };

    const handleCalculate = () => {
        const parsedStart = parseDateInput(startDate);
        const parsedEnd = parseDateInput(endDate);

        const parsedEmployment = parseDateInput(employmentDate);
        if (!parsedStart || !parsedEnd || !parsedEmployment || compareDates(startDate, endDate) > 0 || compareDates(employmentDate, startDate) > 0) {
            setResult(null);
            setSnackbarMessage('بازهٔ زمانی یا تاریخ استخدام واردشده معتبر نیست.');
            setSnackbarVisible(true);
            return;
        }

        if (periodBuckets.length === 0) {
            setResult(null);
            return;
        }

        if (workshopType === 'classified' && selectedGroup == null) {
            setResult(null);
            setSnackbarMessage('گروه شغلی را انتخاب کنید.');
            setSnackbarVisible(true);
            return;
        }

        const parsedFridayWorkDaysByYear: Record<number, number> = {};
        for (const year of selectedYears) {
            const displayedValue = fridayWorkDaysByYear[year] ?? toPersianDigits(availableFridaysByYear[year] ?? 0);
            const normalizedValue = normalizeDigits(displayedValue.trim());
            const value = Number(normalizedValue);
            const available = availableFridaysByYear[year] ?? 0;

            if (!/^\d+$/.test(normalizedValue) || !Number.isInteger(value) || value < 0) {
                setResult(null);
                setSnackbarMessage(`تعداد جمعه کاری سال ${toPersianDigits(year)} باید یک عدد صحیح صفر یا بزرگ‌تر باشد.`);
                setSnackbarVisible(true);
                return;
            }

            if (value > available) {
                setResult(null);
                setSnackbarMessage(`تعداد جمعه کاری وارده در سال ${toPersianDigits(year)} بیش تر از تعداد جمعه کاری موجود است`);
                setSnackbarVisible(true);
                return;
            }

            parsedFridayWorkDaysByYear[year] = value;
        }

        const calculation = calculateFridayWorkFromPeriodData(
            parsedStart,
            parsedEnd,
            parsedEmployment,
            periodBuckets,
            parsedFridayWorkDaysByYear,
            workshopType,
            selectedGroup ?? undefined,
            settledThrough1391,
        );

        if (calculation.breakdown.length === 0) {
            setResult(null);
            setSnackbarMessage('برای بازهٔ انتخابی مبلغ جمعه کاری ثبت‌شده‌ای پیدا نشد.');
            setSnackbarVisible(true);
            return;
        }

        setResult(scaleWageCalculationResult(calculation, getDailyWorkRatio(getDailyWorkMinutes(dailyWorkTime))));
        setShowDetailedBreakdown(false);
    };

    const handleReset = () => {
        setStartDate(defaultStartDate);
        setEndDate(defaultEndDate);
        setEmploymentDate(defaultEmploymentDate);
        setWorkshopType('unclassified');
        setSettledThrough1391(false);
        setSelectedGroup(jobGroups[0]?.group_number ?? null);
        setFridayWorkDaysByYear(
            Object.fromEntries(selectedYears.map((year) => [year, toPersianDigits(String(availableFridaysByYear[year] ?? 0))])),
        );
        setResult(null);
        setShowDetailedBreakdown(false);
    };

    const formattedResult = useMemo(() => (
        result ? toPersianDigits(formatCurrency(result.totalAmount)) : '۰ ریال'
    ), [result]);
    const totalFridaysInRange = Object.values(availableFridaysByYear).reduce((sum, value) => sum + value, 0);

    return (
        <ThemedView style={styles.container}>
            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + Spacing.three, paddingBottom: insets.bottom + Spacing.four }]}
                showsVerticalScrollIndicator={false}
            >
                <SafeAreaView style={styles.safeArea}>
                    <Card elevation={1} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <Card.Content style={styles.cardContent}>
                            <View style={styles.headerRow}>
                                <View style={styles.headerText}>
                                    <ThemedText type="bodyBold" style={[styles.pageTitle, { color: theme.text }]}>محاسبه جمعه کاری</ThemedText>
                                    <ThemedText type="small" style={[styles.pageDescription, { color: theme.textSecondary }]}>محاسبه مزد جمعه‌کاری‌های انجام‌شده براساس ماده ۶۲ قانون کار</ThemedText>
                                </View>
                            </View>

                            <View style={[styles.formulaBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                                <ThemedText type="small" style={[styles.formulaLabel, { color: theme.textSecondary }]}>فرمول محاسبه</ThemedText>
                                <ThemedText type="small" style={[styles.formulaValue, { color: theme.text }]}>مبلغ کل جمعه‌کاری = مجموعِ (تعداد جمعه‌کاری کارگر در هر دوره × ۰٫۴۰ × (حداقل مزد مصوب روزانه + پایه سنوات استحقاقی همان دوره))</ThemedText>
                            </View>

                            <View style={styles.metricsRow}>
                                <DateInputField
                                    label="از تاریخ"
                                    value={startDate}
                                    placeholder="۱۴۰۳/۰۱/۰۱"
                                    onPress={() => openPicker('start')}
                                    formatValue={formatDisplayedDate}
                                />
                                <DateInputField
                                    label="تا تاریخ"
                                    value={endDate}
                                    placeholder="۱۴۰۳/۱۲/۲۹"
                                    onPress={() => openPicker('end')}
                                    formatValue={formatDisplayedDate}
                                />
                            </View>

                            <DateInputField
                                label="تاریخ استخدام"
                                value={employmentDate}
                                onPress={() => {
                                    setPickerTarget('employment');
                                    setPickerVisible(true);
                                }}
                                formatValue={formatDisplayedDate}
                                iconName="calendar-account-outline"
                                helperText="جهت محاسبه پایه سنوات استحقاقی و اعمال آن در محاسبات"
                            />

                            <View style={styles.optionSection}>
                                <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary }]}>نوع کارگاه</ThemedText>
                                <View style={styles.optionsRow}>
                                    {([['unclassified', 'فاقد طرح طبقه‌بندی'], ['classified', 'دارای طرح طبقه‌بندی']] as const).map(([value, label]) => (
                                        <Pressable key={value} onPress={() => setWorkshopType(value)} style={[styles.optionButton, { backgroundColor: workshopType === value ? theme.primary : theme.surface, borderColor: workshopType === value ? theme.primary : theme.border }]}>
                                            <ThemedText type="smallBold" style={{ color: workshopType === value ? theme.surface : theme.text }}>{label}</ThemedText>
                                        </Pressable>
                                    ))}
                                </View>
                            </View>

                            {workshopType === 'classified' ? <View style={[styles.metricBox, { backgroundColor: theme.surfaceVariant }]}>
                                <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary }]}>گروه شغلی</ThemedText>
                                <Menu visible={groupMenuVisible} onDismiss={() => setGroupMenuVisible(false)} anchor={<Pressable onPress={() => setGroupMenuVisible(true)} style={[styles.dateInput, { backgroundColor: theme.surface, borderColor: theme.border }]}><ThemedText type="small" style={[styles.fieldValue, { color: theme.text }]}>{selectedGroup == null ? 'انتخاب گروه شغلی' : `گروه ${toPersianDigits(String(selectedGroup))}`}</ThemedText><MaterialCommunityIcons name="briefcase-outline" size={18} color={theme.primary} /></Pressable>} contentStyle={{ borderRadius: 16, backgroundColor: theme.surface }}>
                                    {jobGroups.map((group) => <Menu.Item key={group.id} onPress={() => { setSelectedGroup(group.group_number); setGroupMenuVisible(false); }} title={`گروه ${toPersianDigits(String(group.group_number))}`} titleStyle={{ fontFamily: 'Vazirmatn-Regular', color: theme.text }} />)}
                                </Menu>
                            </View> : null}

                            <Pressable onPress={() => canUseSettlementPath && setSettledThrough1391((value) => !value)} style={[styles.checkRow, { backgroundColor: theme.surfaceVariant, borderColor: theme.border, opacity: canUseSettlementPath ? 1 : 0.55 }]}>
                                <MaterialCommunityIcons name={settledThrough1391 ? 'checkbox-marked' : 'checkbox-blank-outline'} size={22} color={settledThrough1391 ? theme.primary : theme.textSecondary} />
                                <View style={styles.checkText}>
                                    <ThemedText type="smallBold" style={[styles.optionTitle, { color: theme.text }]}>تصفیه حساب تا پایان سال ۱۳۹۱ انجام شده است</ThemedText>
                                    <ThemedText type="small" style={[styles.optionDescription, { color: theme.textSecondary }]}>{canUseSettlementPath ? 'در این حالت شروع محاسبه از سال ۱۳۹۲ خواهد بود.' : 'این گزینه برای استخدام‌های سال ۱۳۹۲ و بعد از آن کاربرد ندارد.'}</ThemedText>
                                </View>
                            </Pressable>

                            <View style={styles.yearFieldsGroup}>
                                <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary }]}>تعداد جمعه کاری کارگر در هر سال</ThemedText>
                                {selectedYears.map((year) => {
                                    const availableFridays = availableFridaysByYear[year] ?? 0;
                                    return (
                                        <View key={year} style={[styles.yearField, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                                            <View style={styles.yearFieldHeader}>
                                                <ThemedText type="smallBold" style={{ color: theme.text }}>
                                                    تعداد جمعه کاری کارگر در سال {toPersianDigits(year)}
                                                </ThemedText>
                                                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                                                    موجود: {toPersianDigits(availableFridays)} جمعه
                                                </ThemedText>
                                            </View>
                                            <View style={[styles.stepper, { backgroundColor: theme.surface, borderColor: theme.border, direction: 'ltr' }]}>
                                                <Pressable
                                                    onPress={() => changeFridayWorkDays(year, -1)}
                                                    disabled={Number(normalizeDigits(fridayWorkDaysByYear[year] ?? String(availableFridays))) <= 0}
                                                    style={({ pressed }) => [
                                                        styles.stepperButton,
                                                        { backgroundColor: pressed ? theme.primaryContainer : theme.surfaceVariant },
                                                        Number(normalizeDigits(fridayWorkDaysByYear[year] ?? String(availableFridays))) <= 0 && styles.stepperButtonDisabled,
                                                    ]}
                                                    accessibilityRole="button"
                                                    accessibilityLabel={`کاهش تعداد جمعه کاری سال ${year}`}
                                                >
                                                    <MaterialCommunityIcons name="minus" size={20} color={theme.primary} />
                                                </Pressable>
                                                <TextInput
                                                    value={fridayWorkDaysByYear[year] ?? toPersianDigits(availableFridays)}
                                                    onChangeText={(value) => updateFridayWorkDays(year, value)}
                                                    onBlur={() => validateFridayWorkDays(year)}
                                                    keyboardType="number-pad"
                                                    placeholder={toPersianDigits(availableFridays)}
                                                    placeholderTextColor={theme.textMuted}
                                                    style={[styles.textInput, { color: theme.text, direction: 'ltr' }]}
                                                    textAlign="center"
                                                    accessibilityLabel={`تعداد جمعه کاری کارگر در سال ${year}`}
                                                />
                                                <Pressable
                                                    onPress={() => changeFridayWorkDays(year, 1)}
                                                    disabled={Number(normalizeDigits(fridayWorkDaysByYear[year] ?? String(availableFridays))) >= availableFridays}
                                                    style={({ pressed }) => [
                                                        styles.stepperButton,
                                                        { backgroundColor: pressed ? theme.primaryContainer : theme.surfaceVariant },
                                                        Number(normalizeDigits(fridayWorkDaysByYear[year] ?? String(availableFridays))) >= availableFridays && styles.stepperButtonDisabled,
                                                    ]}
                                                    accessibilityRole="button"
                                                    accessibilityLabel={`افزایش تعداد جمعه کاری سال ${year}`}
                                                >
                                                    <MaterialCommunityIcons name="plus" size={20} color={theme.primary} />
                                                </Pressable>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>

                            <DailyWorkTimeField value={dailyWorkTime} onChange={setDailyWorkTime} />
                            <View style={styles.actionsGroup}>
                                <Button mode="contained" onPress={handleCalculate} icon="calendar-star" style={styles.actionButton} labelStyle={styles.actionLabel} buttonColor={theme.primary} textColor={theme.surface} loading={isLoadingData} disabled={isLoadingData}>محاسبه</Button>
                                {result ? <Button mode="outlined" onPress={handleReset} icon="refresh" style={[styles.actionButton, styles.resetButton]} labelStyle={styles.actionLabel} textColor={theme.primary} disabled={isLoadingData}>بازنشانی</Button> : null}
                            </View>

                            {result ? (
                                <Card style={[styles.breakdownCard, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                                    <Card.Content style={styles.breakdownContent}>
                                        <View style={[styles.summaryBoxContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                            <ThemedText type="small" style={[styles.summaryLabel, { color: theme.textSecondary }]}>مبلغ کل جمعه کاری</ThemedText>
                                            <ThemedText type="largeTitle" style={[styles.amountValue, { color: theme.primary }]}>{formattedResult}</ThemedText>
                                        </View>
                                        <View style={[styles.totalFridaysBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                            <ThemedText type="small" style={[styles.summaryLabel, { color: theme.textSecondary }]}>مجموع جمعه‌های موجود در بازه انتخاب‌شده</ThemedText>
                                            <ThemedText type="bodyBold" style={[styles.totalFridaysValue, { color: theme.text }]}>{toPersianDigits(String(totalFridaysInRange))} روز</ThemedText>
                                        </View>
                                        <View style={styles.breakdownSectionHeader}>
                                            <ThemedText type="smallBold" style={[styles.breakdownSectionTitle, { color: theme.text }]}>جزئیات دوره‌ها</ThemedText>
                                            <Pressable onPress={() => setShowDetailedBreakdown((value) => !value)} style={[styles.toggleButton, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                                <ThemedText type="smallBold" style={[styles.toggleButtonLabel, { color: theme.primary }]}>{showDetailedBreakdown ? 'عدم نمایش' : 'نمایش جزئیات'}</ThemedText>
                                                <MaterialCommunityIcons name={showDetailedBreakdown ? 'chevron-up' : 'chevron-down'} size={18} color={theme.primary} />
                                            </Pressable>
                                        </View>
                                        {showDetailedBreakdown ? (
                                            <View style={styles.breakdownGrid}>
                                                {result.breakdown.map((item, index) => (
                                                    <View key={`${item.year}-${item.periodIndex}-${index}`} style={[styles.breakdownItemCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                                        <View style={[styles.breakdownItemHeaderRow, { borderBottomColor: theme.border }]}>
                                                            <ThemedText type="smallBold" style={[styles.breakdownItemTitle, { color: theme.text }]}>{`سال ${toPersianDigits(String(item.year))} · دوره ${toPersianDigits(String(item.periodIndex))}`}</ThemedText>
                                                        </View>
                                                        <View style={styles.breakdownDetailGrid}>
                                                            <View style={[styles.breakdownDetailBox, { backgroundColor: theme.primaryContainer, borderColor: theme.primary }]}><ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>بازهٔ زمانی</ThemedText><ThemedText type="smallBold" style={[styles.detailValue, { color: theme.primary }]}>{`${formatDisplayedDate(`${item.startDate.year}/${item.startDate.month}/${item.startDate.day}`)} تا ${formatDisplayedDate(`${item.endDate.year}/${item.endDate.month}/${item.endDate.day}`)}`}</ThemedText></View>
                                                            <View style={[styles.breakdownDetailBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}><ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>نوع بازه</ThemedText><ThemedText type="smallBold" style={[styles.detailValue, { color: theme.text }]}>{item.phase === 'before-anniversary' ? 'پیش از سالگرد استخدام' : 'بعد از سالگرد استخدام'}</ThemedText></View>
                                                            <View style={[styles.breakdownDetailBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}><ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>جمعه‌های موجود در این دوره</ThemedText><ThemedText type="smallBold" style={[styles.detailValue, { color: theme.text }]}>{toPersianDigits(String(item.fridaysInPeriod))} روز</ThemedText></View>
                                                            <View style={[styles.breakdownDetailBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}><ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>جمعه‌کاری واردشده</ThemedText><ThemedText type="smallBold" style={[styles.detailValue, { color: theme.text }]}>{toPersianDigits(String(item.fridayWorkDays))} روز</ThemedText></View>
                                                            <View style={[styles.breakdownDetailBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}><ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>حداقل مزد روزانه</ThemedText><ThemedText type="smallBold" style={[styles.detailValue, { color: theme.text }]}>{toPersianDigits(formatCurrency(item.dailyMinimumWage))}</ThemedText></View>
                                                            <View style={[styles.breakdownDetailBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}><ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>{workshopType === 'classified' ? 'پایه سنوات استحقاقی روزانه گروه شغلی' : 'پایه سنوات استحقاقی روزانه'}</ThemedText><ThemedText type="smallBold" style={[styles.detailValue, { color: theme.text }]}>{toPersianDigits(formatCurrency(item.dailySeniority))}</ThemedText></View>
                                                            <View style={[styles.breakdownDetailBox, { backgroundColor: theme.primaryContainer, borderColor: theme.primary }]}><ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>مبلغ یک روز جمعه کاری</ThemedText><ThemedText type="smallBold" style={[styles.detailValue, { color: theme.primary }]}>{item.fridayWorkRate != null ? toPersianDigits(formatCurrency(item.fridayWorkRate)) : '-'}</ThemedText></View>
                                                            <View style={[styles.breakdownDetailBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}><ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>مبلغ این دوره</ThemedText><ThemedText type="smallBold" style={[styles.detailValue, { color: theme.primary }]}>{toPersianDigits(formatCurrency(item.amount))}</ThemedText></View>
                                                        </View>
                                                    </View>
                                                ))}
                                            </View>
                                        ) : null}
                                    </Card.Content>
                                </Card>
                            ) : null}
                        </Card.Content>
                    </Card>
                </SafeAreaView>
            </ScrollView>

            <PersianDatePickerModal visible={pickerVisible} value={pickerTarget === 'start' ? startDate : pickerTarget === 'end' ? endDate : employmentDate} title={pickerTarget === 'start' ? 'انتخاب تاریخ شروع' : pickerTarget === 'end' ? 'انتخاب تاریخ پایان' : 'انتخاب تاریخ استخدام'} onClose={closePicker} onSelect={handleDateSelect} availableYears={availableYears} />

            <Snackbar visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)} duration={3000} style={{ backgroundColor: theme.error, borderRadius: Radius.md }} action={{ label: 'بستن', onPress: () => setSnackbarVisible(false), labelStyle: { color: theme.surface } }}>
                <ThemedText type="small" style={{ color: theme.surface }}>{snackbarMessage}</ThemedText>
            </Snackbar>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { flexGrow: 1 },
    safeArea: { flex: 1, justifyContent: 'center', paddingHorizontal: Spacing.four },
    card: { borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
    cardContent: { gap: Spacing.three, paddingVertical: Spacing.four, paddingHorizontal: Spacing.three },
    headerRow: { alignItems: 'flex-start' },
    headerText: { flex: 1, gap: Spacing.one },
    pageTitle: { display: 'none', fontSize: 16, lineHeight: 22, fontFamily: 'Vazirmatn-Bold' },
    pageDescription: { lineHeight: 20, fontSize: 13 },
    formulaBox: { borderRadius: Radius.md, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: Spacing.two, paddingVertical: Spacing.two, gap: Spacing.one },
    formulaLabel: { fontSize: 11 },
    formulaValue: { lineHeight: 20, fontSize: 12 },
    metricsRow: { flexDirection: 'row', gap: Spacing.two },
    metricBox: { flex: 1, borderRadius: 14, paddingHorizontal: Spacing.two, paddingVertical: Spacing.two, gap: Spacing.one },
    yearFieldsGroup: { gap: Spacing.two },
    yearField: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: Spacing.two, gap: Spacing.one },
    yearFieldHeader: { gap: Spacing.half },
    sectionLabel: { fontSize: 11 },
    dateInput: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.one, paddingHorizontal: Spacing.two, paddingVertical: Spacing.two, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth },
    stepper: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, padding: Spacing.one, gap: Spacing.one },
    stepperButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
    stepperButtonDisabled: { opacity: 0.4 },
    textInput: { flex: 1, minHeight: 42, fontFamily: 'Vazirmatn-Bold', fontSize: 14, paddingVertical: 0 },
    fieldValue: { fontSize: 13, flex: 1 },
    helpText: { fontSize: 11, lineHeight: 20, fontFamily: 'Vazirmatn-Regular' },
    optionSection: { gap: Spacing.two },
    optionsRow: { flexDirection: 'row', gap: Spacing.two },
    optionButton: { flex: 1, minHeight: 44, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.two },
    checkRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, padding: Spacing.two },
    checkText: { flex: 1, gap: Spacing.one },
    optionTitle: { fontSize: 13, lineHeight: 19, fontFamily: 'Vazirmatn-Bold' },
    optionDescription: { fontSize: 11, lineHeight: 20, fontFamily: 'Vazirmatn-Regular' },
    actionsGroup: { flexDirection: 'row', gap: Spacing.two },
    actionButton: { flex: 1, borderRadius: 12 },
    resetButton: { borderWidth: 1 },
    actionLabel: { fontFamily: 'Vazirmatn-Bold', fontSize: 12 },
    breakdownCard: { borderRadius: 12, borderWidth: 1, marginTop: Spacing.two, overflow: 'hidden' },
    breakdownContent: { gap: Spacing.two, paddingVertical: Spacing.three, paddingHorizontal: Spacing.two },
    summaryBoxContent: { width: '100%', borderRadius: 12, borderWidth: 1, padding: Spacing.two, gap: Spacing.one, alignItems: 'center' },
    summaryLabel: { fontSize: 11 },
    amountValue: { fontSize: 18 },
    totalFridaysBox: { width: '100%', borderRadius: 12, borderWidth: 1, padding: Spacing.two, gap: Spacing.one, alignItems: 'center' },
    totalFridaysValue: { fontSize: 16 },
    breakdownSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.one, paddingVertical: Spacing.one, gap: Spacing.one },
    breakdownSectionTitle: { fontSize: 13 },
    toggleButton: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: Spacing.two, paddingVertical: Spacing.one },
    toggleButtonLabel: { fontSize: 11 },
    breakdownGrid: { gap: Spacing.two },
    breakdownItemCard: { borderRadius: 12, borderWidth: 1, padding: Spacing.two, gap: Spacing.one },
    breakdownItemHeaderRow: { paddingTop: 2, paddingBottom: 2, marginBottom: 2, borderBottomWidth: StyleSheet.hairlineWidth },
    breakdownItemTitle: { fontSize: 12, fontFamily: 'Vazirmatn-Bold' },
    breakdownDetailGrid: { gap: Spacing.one },
    breakdownDetailBox: { borderRadius: 8, borderWidth: 1, padding: Spacing.one, gap: Spacing.half, alignItems: 'center' },
    detailLabel: { fontSize: 10 },
    detailValue: { fontSize: 12 },
});