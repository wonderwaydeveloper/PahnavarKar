import { MaterialCommunityIcons } from '@expo/vector-icons';
import { jalaaliMonthLength, toJalaali } from 'jalaali-js';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Menu, Snackbar } from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { DailyWorkTimeField, getDailyWorkMinutes } from '@/components/daily-work-time-field';
import { PersianDatePickerModal } from '@/components/persian-date-picker-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { fetchJobGroups, fetchPeriodsByYearId, fetchSeniorityBaseByGroup, fetchYears, seedFromJsonAsset } from '@/database';
import { useTheme } from '@/hooks/use-theme';
import { getDailyWorkRatio, scaleWageCalculationResult } from '@/utils/daily-work-ratio';
import {
    calculateMonthlyShiftWorkFromPeriodData,
    parseDateInput,
    type EntitledSeniorityWorkshopType,
    type MonthlyShiftWorkCalculationResult,
    type MonthlyShiftWorkType,
    type SalaryPeriodBucket,
} from '@/utils/salary-calculation';

const shiftTypeOptions: { value: MonthlyShiftWorkType; label: string; percentage: string }[] = [
    { value: 'morning-evening', label: 'صبح و عصر', percentage: '۱۰٪' },
    { value: 'morning-evening-night', label: 'صبح و عصر و شب', percentage: '۱۵٪' },
    { value: 'morning-night-or-evening-night', label: 'صبح و شب یا عصر و شب', percentage: '۲۲.۵٪' },
];

export default function MonthlyShiftWorkScreen() {
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
    const [pickerTarget, setPickerTarget] = useState<'start' | 'end' | 'employment' | null>(null);
    const [pickerVisible, setPickerVisible] = useState(false);
    const [selectedShiftType, setSelectedShiftType] = useState<MonthlyShiftWorkType>('morning-evening');
    const [workshopType, setWorkshopType] = useState<EntitledSeniorityWorkshopType>('unclassified');
    const [settledThrough1391, setSettledThrough1391] = useState(false);
    const [jobGroups, setJobGroups] = useState<{ id: number; group_number: number; sort_order: number }[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
    const [groupMenuVisible, setGroupMenuVisible] = useState(false);
    const [periodBuckets, setPeriodBuckets] = useState<SalaryPeriodBucket[]>([]);
    const [availableYears, setAvailableYears] = useState<number[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [result, setResult] = useState<MonthlyShiftWorkCalculationResult | null>(null);
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
                            (await fetchSeniorityBaseByGroup(period.id)).map((row) => [
                                groups.find((group) => group.id === row.job_group_id)?.group_number ?? row.job_group_id,
                                Number(row.base_value),
                            ]),
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

    const toPersianDigits = (value: string | number) =>
        String(value).replace(/\d/g, (digit) => persianDigits[Number(digit)]);

    const formatCurrency = (value: number) =>
        `${new Intl.NumberFormat('fa-IR').format(Math.round(value))} ریال`;

    const formatDisplayedDate = (value: string) => {
        const parsed = parseDateInput(value);

        if (!parsed) {
            return '';
        }

        return `${toPersianDigits(String(parsed.year))}/${toPersianDigits(String(parsed.month).padStart(2, '0'))}/${toPersianDigits(String(parsed.day).padStart(2, '0'))}`;
    };

    const openPicker = (target: 'start' | 'end' | 'employment') => {
        setPickerTarget(target);
        setPickerVisible(true);
    };

    const closePicker = () => {
        setPickerVisible(false);
        setPickerTarget(null);
    };

    const compareDates = (left: string, right: string) => {
        const parsedLeft = parseDateInput(left);
        const parsedRight = parseDateInput(right);

        if (!parsedLeft || !parsedRight) {
            return 0;
        }

        const leftValue = parsedLeft.year * 10000 + parsedLeft.month * 100 + parsedLeft.day;
        const rightValue = parsedRight.year * 10000 + parsedRight.month * 100 + parsedRight.day;

        if (leftValue < rightValue) {
            return -1;
        }

        if (leftValue > rightValue) {
            return 1;
        }

        return 0;
    };

    const handleDateSelect = (value: string) => {
        if (pickerTarget === 'start') {
            setStartDate(value);

            if (endDate) {
                const comparison = compareDates(value, endDate);
                if (comparison > 0) {
                    setEndDate(value);
                }
            }

            return;
        }

        if (pickerTarget === 'employment') {
            if (compareDates(value, startDate) > 0) {
                setSnackbarMessage('تاریخ استخدام باید برابر یا قبل از تاریخ شروع باشد.');
                setSnackbarVisible(true);
                return;
            }

            setEmploymentDate(value);
            if ((parseDateInput(value)?.year ?? 0) > 1391) {
                setSettledThrough1391(false);
            }
            return;
        }

        if (pickerTarget === 'end') {
            if (startDate) {
                const comparison = compareDates(value, startDate);
                if (comparison < 0) {
                    setEndDate(startDate);
                    setSnackbarMessage('تاریخ پایان باید برابر یا بزرگتر از تاریخ شروع باشد.');
                    setSnackbarVisible(true);
                    return;
                }
            }

            setEndDate(value);
        }
    };

    const handleCalculate = () => {
        const parsedStart = parseDateInput(startDate);
        const parsedEnd = parseDateInput(endDate);
        const parsedEmployment = parseDateInput(employmentDate);

        if (!parsedStart || !parsedEnd || !parsedEmployment || compareDates(employmentDate, startDate) > 0) {
            setResult(null);
            return;
        }

        if (
            parsedStart.year > parsedEnd.year ||
            (parsedStart.year === parsedEnd.year && parsedStart.month > parsedEnd.month) ||
            (parsedStart.year === parsedEnd.year && parsedStart.month === parsedEnd.month && parsedStart.day > parsedEnd.day)
        ) {
            setResult(null);
            return;
        }

        if (periodBuckets.length === 0) {
            setResult(null);
            return;
        }

        if (workshopType === 'classified' && selectedGroup == null) {
            setSnackbarMessage('گروه شغلی را انتخاب کنید.');
            setSnackbarVisible(true);
            return;
        }

        const calculation = calculateMonthlyShiftWorkFromPeriodData(
            parsedStart,
            parsedEnd,
            parsedEmployment,
            periodBuckets,
            selectedShiftType,
            workshopType,
            selectedGroup ?? undefined,
            settledThrough1391,
        );

        if (calculation.breakdown.length === 0) {
            setResult(null);
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
        setSelectedShiftType('morning-evening');
        setResult(null);
        setShowDetailedBreakdown(false);
    };

    const formattedResult = useMemo(() => {
        if (!result) {
            return '۰ ریال';
        }

        return toPersianDigits(formatCurrency(result.totalAmount));
    }, [result]);

    const selectedShiftLabel =
        shiftTypeOptions.find((option) => option.value === selectedShiftType)?.label ?? 'صبح و عصر';
    const canUseSettlementPath = (parseDateInput(employmentDate)?.year ?? 0) <= 1391;

    return (
        <ThemedView style={styles.container}>
            <ScrollView
                contentContainerStyle={[
                    styles.scrollContent,
                    {
                        paddingTop: insets.top + Spacing.three,
                        paddingBottom: insets.bottom + Spacing.four,
                    },
                ]}
                showsVerticalScrollIndicator={false}
            >
                <SafeAreaView style={styles.safeArea}>
                    <Card elevation={1} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <Card.Content style={styles.cardContent}>
                            <View style={styles.headerRow}>
                                <View style={styles.headerText}>
                                    <ThemedText type="bodyBold" style={[styles.pageTitle, { color: theme.text }]}>
                                        محاسبه نوبت کاری ماهیانه
                                    </ThemedText>
                                    <ThemedText type="small" style={[styles.pageDescription, { color: theme.textSecondary }]}>
                                        محاسبه نوبت‌کاری موضوع ماده ۵۵ قانون کار بر اساس ماده ۵۶ قانون کار
                                    </ThemedText>
                                </View>
                            </View>

                            <View style={[styles.formulaBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                                <ThemedText type="small" style={[styles.formulaLabel, { color: theme.textSecondary }]}>
                                    فرمول محاسبه
                                </ThemedText>
                                <ThemedText type="small" style={[styles.formulaValue, { color: theme.text }]}>
                                    مبلغ نوبت‌کاری هر دوره = ضریب نوع نوبت × تعداد روزهای کارکرد کارگر در همان دوره × (حداقل مزد روزانه مصوب + پایه سنوات استحقاقی همان دوره)
                                </ThemedText>
                            </View>

                            <View style={styles.metricsRow}>
                                <View style={[styles.metricBox, { backgroundColor: theme.surfaceVariant }]}>
                                    <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                                        از تاریخ
                                    </ThemedText>
                                    <Pressable onPress={() => openPicker('start')}>
                                        <View style={[styles.dateInput, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                            <ThemedText type="small" style={[styles.fieldValue, { color: startDate ? theme.text : theme.textSecondary }]}>
                                                {formatDisplayedDate(startDate) || '۱۴۰۳/۰۱/۰۱'}
                                            </ThemedText>
                                            <MaterialCommunityIcons name="calendar-month-outline" size={18} color={theme.primary} />
                                        </View>
                                    </Pressable>
                                </View>

                                <View style={[styles.metricBox, { backgroundColor: theme.surfaceVariant }]}>
                                    <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                                        تا تاریخ
                                    </ThemedText>
                                    <Pressable onPress={() => openPicker('end')}>
                                        <View style={[styles.dateInput, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                            <ThemedText type="small" style={[styles.fieldValue, { color: endDate ? theme.text : theme.textSecondary }]}>
                                                {formatDisplayedDate(endDate) || '۱۴۰۳/۱۲/۲۹'}
                                            </ThemedText>
                                            <MaterialCommunityIcons name="calendar-month-outline" size={18} color={theme.primary} />
                                        </View>
                                    </Pressable>
                                </View>
                            </View>

                            <View style={[styles.metricBox, { backgroundColor: theme.surfaceVariant }]}>
                                <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary }]}>تاریخ استخدام</ThemedText>
                                <Pressable onPress={() => openPicker('employment')}>
                                    <View style={[styles.dateInput, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                        <ThemedText type="smallBold" style={[styles.fieldValue, { color: theme.text }]}>{formatDisplayedDate(employmentDate)}</ThemedText>
                                        <MaterialCommunityIcons name="calendar-account-outline" size={18} color={theme.primary} />
                                    </View>
                                </Pressable>
                                <ThemedText type="small" style={[styles.helpText, { color: theme.textSecondary }]}>برای محاسبه پایه سنوات استحقاقی در هر دوره</ThemedText>
                            </View>

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

                            {workshopType === 'classified' ? (
                                <View style={[styles.metricBox, { backgroundColor: theme.surfaceVariant }]}>
                                    <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary }]}>گروه شغلی</ThemedText>
                                    <Menu visible={groupMenuVisible} onDismiss={() => setGroupMenuVisible(false)} anchor={<Pressable onPress={() => setGroupMenuVisible(true)} style={[styles.dateInput, { backgroundColor: theme.surface, borderColor: theme.border }]}><ThemedText type="smallBold" style={{ color: theme.text }}>{selectedGroup == null ? 'انتخاب گروه' : `گروه ${toPersianDigits(selectedGroup)}`}</ThemedText><MaterialCommunityIcons name="briefcase-outline" size={18} color={theme.primary} /></Pressable>}>
                                        {jobGroups.map((group) => <Menu.Item key={group.id} title={`گروه ${toPersianDigits(group.group_number)}`} onPress={() => { setSelectedGroup(group.group_number); setGroupMenuVisible(false); }} />)}
                                    </Menu>
                                </View>
                            ) : null}

                            <Pressable onPress={() => canUseSettlementPath && setSettledThrough1391((value) => !value)} style={[styles.checkRow, { backgroundColor: theme.surfaceVariant, borderColor: theme.border, opacity: canUseSettlementPath ? 1 : 0.55 }]}>
                                <MaterialCommunityIcons name={settledThrough1391 ? 'checkbox-marked' : 'checkbox-blank-outline'} size={22} color={settledThrough1391 ? theme.primary : theme.textSecondary} />
                                <View style={styles.checkText}>
                                    <ThemedText type="smallBold" style={[styles.optionTitle, { color: theme.text }]}>تصفیه حساب تا پایان سال ۱۳۹۱ انجام شده است</ThemedText>
                                    <ThemedText type="small" style={[styles.optionDescription, { color: theme.textSecondary }]}>{canUseSettlementPath ? 'در این حالت شروع محاسبه از سال ۱۳۹۲ خواهد بود.' : 'این گزینه برای استخدام‌های سال ۱۳۹۲ و بعد از آن کاربرد ندارد.'}</ThemedText>
                                </View>
                            </Pressable>

                            <View style={[styles.metricBox, { backgroundColor: theme.surfaceVariant }]}>
                                <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                                    نوع نوبت کاری
                                </ThemedText>
                                <View style={styles.shiftOptionsGroup}>
                                    {shiftTypeOptions.map((option) => {
                                        const isSelected = option.value === selectedShiftType;

                                        return (
                                            <Pressable
                                                key={option.value}
                                                onPress={() => setSelectedShiftType(option.value)}
                                                style={[
                                                    styles.shiftOption,
                                                    {
                                                        backgroundColor: isSelected ? theme.primary : theme.surface,
                                                        borderColor: isSelected ? theme.primary : theme.border,
                                                    },
                                                ]}
                                            >
                                                <ThemedText
                                                    type="smallBold"
                                                    style={{
                                                        color: isSelected ? theme.surface : theme.text,
                                                    }}
                                                >
                                                    {option.label}
                                                </ThemedText>
                                                <ThemedText
                                                    type="small"
                                                    style={{
                                                        color: isSelected ? theme.surface : theme.textSecondary,
                                                    }}
                                                >
                                                    {option.percentage}
                                                </ThemedText>
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            </View>
                            <DailyWorkTimeField value={dailyWorkTime} onChange={setDailyWorkTime} />

                            <View style={styles.actionsGroup}>
                                <Button
                                    mode="contained"
                                    onPress={handleCalculate}
                                    icon="calendar-clock"
                                    style={styles.actionButton}
                                    labelStyle={styles.actionLabel}
                                    buttonColor={theme.primary}
                                    textColor={theme.surface}
                                    loading={isLoadingData}
                                    disabled={isLoadingData}
                                >
                                    محاسبه
                                </Button>

                                {result ? (
                                    <Button
                                        mode="outlined"
                                        onPress={handleReset}
                                        icon="refresh"
                                        style={[styles.actionButton, styles.resetButton]}
                                        labelStyle={styles.actionLabel}
                                        textColor={theme.primary}
                                        disabled={isLoadingData}
                                    >
                                        بازنشانی
                                    </Button>
                                ) : null}
                            </View>

                            {result ? (
                                <Card style={[styles.breakdownCard, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                                    <Card.Content style={styles.breakdownContent}>
                                        <View style={styles.summaryBoxHeader}>
                                            <View style={[styles.summaryBoxContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                                <ThemedText type="small" style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                                                    مبلغ کل نوبت کاری در بازه زمانی انتخاب شده ({selectedShiftLabel})
                                                </ThemedText>
                                                <ThemedText type="largeTitle" style={[styles.amountValue, { color: theme.primary }]}>
                                                    {formattedResult}
                                                </ThemedText>
                                            </View>
                                        </View>

                                        <View style={styles.breakdownSectionHeader}>
                                            <ThemedText type="smallBold" style={[styles.breakdownSectionTitle, { color: theme.text }]}>
                                                جزئیات دوره‌ها
                                            </ThemedText>
                                            <Pressable
                                                onPress={() => setShowDetailedBreakdown((value) => !value)}
                                                style={[
                                                    styles.toggleButton,
                                                    {
                                                        backgroundColor: theme.surface,
                                                        borderColor: theme.border,
                                                    },
                                                ]}
                                            >
                                                <ThemedText type="smallBold" style={[styles.toggleButtonLabel, { color: theme.primary }]}>
                                                    {showDetailedBreakdown ? 'عدم نمایش' : 'نمایش جزئیات'}
                                                </ThemedText>
                                                <MaterialCommunityIcons
                                                    name={showDetailedBreakdown ? 'chevron-up' : 'chevron-down'}
                                                    size={18}
                                                    color={theme.primary}
                                                />
                                            </Pressable>
                                        </View>

                                        {showDetailedBreakdown ? (
                                            <View style={styles.breakdownGrid}>
                                                {result.breakdown.map((item, index) => (
                                                    <View
                                                        key={`${item.year}-${item.periodIndex}-${index}`}
                                                        style={[
                                                            styles.breakdownItemCard,
                                                            {
                                                                backgroundColor: theme.surface,
                                                                borderColor: theme.border,
                                                            },
                                                        ]}
                                                    >
                                                        <View style={styles.breakdownItemHeaderRow}>
                                                            <ThemedText type="smallBold" style={[styles.breakdownItemTitle, { color: theme.text }]}>
                                                                {`سال ${toPersianDigits(String(item.year))} · دوره ${toPersianDigits(String(item.periodIndex))}`}
                                                            </ThemedText>
                                                        </View>

                                                        <View style={styles.breakdownDetailGrid}>
                                                            <View style={[styles.breakdownDetailBox, { backgroundColor: theme.primaryContainer, borderColor: theme.primary }]}>
                                                                <ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>بازهٔ زمانی</ThemedText>
                                                                <ThemedText type="smallBold" style={[styles.detailValue, { color: theme.primary }]}>
                                                                    {`${formatDisplayedDate(`${item.startDate.year}/${item.startDate.month}/${item.startDate.day}`)} تا ${formatDisplayedDate(`${item.endDate.year}/${item.endDate.month}/${item.endDate.day}`)}`}
                                                                </ThemedText>
                                                            </View>
                                                            <View style={[styles.breakdownDetailBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                                                                <ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>
                                                                    تعداد روزهای شمول
                                                                </ThemedText>
                                                                <ThemedText type="smallBold" style={[styles.detailValue, { color: theme.text }]}>
                                                                    {toPersianDigits(String(item.daysCovered))} روز
                                                                </ThemedText>
                                                            </View>
                                                            <View style={[styles.breakdownDetailBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                                                                <ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>{workshopType === 'classified' ? 'پایه سنوات استحقاقی روزانه گروه شغلی' : 'پایه سنوات استحقاقی روزانه'}</ThemedText>
                                                                <ThemedText type="smallBold" style={[styles.detailValue, { color: theme.text }]}>
                                                                    {toPersianDigits(formatCurrency(item.dailySeniority))}
                                                                </ThemedText>
                                                            </View>
                                                            <View style={[styles.breakdownDetailBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                                                                <ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>
                                                                    ضریب نوبت
                                                                </ThemedText>
                                                                <ThemedText type="smallBold" style={[styles.detailValue, { color: theme.text }]}>
                                                                    {toPersianDigits(String((item.coefficient * 100).toFixed(1)))}٪
                                                                </ThemedText>
                                                            </View>
                                                            <View style={[styles.breakdownDetailBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                                                                <ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>
                                                                    حداقل مزد روزانه
                                                                </ThemedText>
                                                                <ThemedText type="smallBold" style={[styles.detailValue, { color: theme.text }]}>
                                                                    {item.dailyBase != null ? toPersianDigits(formatCurrency(item.dailyBase)) : '-'}
                                                                </ThemedText>
                                                            </View>
                                                            <View style={[styles.breakdownDetailBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                                                                <ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>
                                                                    مبلغ این دوره
                                                                </ThemedText>
                                                                <ThemedText type="smallBold" style={[styles.detailValue, { color: theme.primary }]}>
                                                                    {toPersianDigits(formatCurrency(item.amount))}
                                                                </ThemedText>
                                                            </View>
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

            <PersianDatePickerModal
                visible={pickerVisible}
                value={pickerTarget === 'start' ? startDate : pickerTarget === 'employment' ? employmentDate : endDate}
                title={pickerTarget === 'start' ? 'انتخاب تاریخ شروع' : pickerTarget === 'employment' ? 'انتخاب تاریخ استخدام' : 'انتخاب تاریخ پایان'}
                onClose={closePicker}
                onSelect={handleDateSelect}
                availableYears={availableYears}
            />

            <Snackbar
                visible={snackbarVisible}
                onDismiss={() => setSnackbarVisible(false)}
                duration={3000}
                style={{ backgroundColor: theme.error, borderRadius: Radius.md }}
                action={{
                    label: 'بستن',
                    onPress: () => setSnackbarVisible(false),
                    labelStyle: { color: theme.surface },
                }}
            >
                <ThemedText type="small" style={{ color: theme.surface }}>
                    {snackbarMessage}
                </ThemedText>
            </Snackbar>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    safeArea: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: Spacing.four,
    },
    card: {
        borderRadius: 20,
        borderWidth: StyleSheet.hairlineWidth,
        overflow: 'hidden',
    },
    cardContent: {
        gap: Spacing.three,
        paddingVertical: Spacing.four,
        paddingHorizontal: Spacing.three,
    },
    headerRow: {
        alignItems: 'flex-start',
    },
    headerText: {
        flex: 1,
        gap: Spacing.one,
    },
    pageTitle: {
        fontSize: 16,
        lineHeight: 22,
        fontFamily: 'Vazirmatn-Bold',
    },
    pageDescription: {
        lineHeight: 20,
        fontSize: 12,
    },
    formulaBox: {
        borderRadius: Radius.md,
        borderWidth: StyleSheet.hairlineWidth,
        paddingHorizontal: Spacing.two,
        paddingVertical: Spacing.two,
        gap: Spacing.one,
    },
    formulaLabel: {
        fontSize: 11,
    },
    formulaValue: {
        lineHeight: 20,
        fontSize: 12,
    },
    metricsRow: {
        flexDirection: 'row',
        gap: Spacing.two,
    },
    metricBox: {
        flex: 1,
        borderRadius: 14,
        paddingHorizontal: Spacing.two,
        paddingVertical: Spacing.two,
        gap: Spacing.one,
    },
    sectionLabel: {
        fontSize: 11,
    },
    helpText: {
        fontSize: 11,
        lineHeight: 20,
        fontFamily: 'Vazirmatn-Regular',
    },
    dateInput: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: Spacing.one,
        paddingHorizontal: Spacing.two,
        paddingVertical: Spacing.two,
        borderRadius: 12,
        borderWidth: StyleSheet.hairlineWidth,
    },
    fieldValue: {
        fontSize: 13,
        flex: 1,
    },
    shiftOptionsGroup: {
        flexDirection: 'column',
        gap: Spacing.one,
    },
    shiftOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.two,
        paddingVertical: Spacing.two,
        borderRadius: 12,
        borderWidth: 1,
    },
    optionSection: {
        gap: Spacing.two,
    },
    optionsRow: {
        flexDirection: 'row',
        gap: Spacing.two,
    },
    optionButton: {
        flex: 1,
        minHeight: 44,
        borderRadius: 12,
        borderWidth: StyleSheet.hairlineWidth,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.two,
    },
    checkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.two,
        borderRadius: 12,
        borderWidth: StyleSheet.hairlineWidth,
        padding: Spacing.two,
    },
    checkText: {
        flex: 1,
        gap: Spacing.one,
    },
    optionTitle: {
        fontSize: 13,
        lineHeight: 19,
        fontFamily: 'Vazirmatn-Bold',
    },
    optionDescription: {
        fontSize: 11,
        lineHeight: 20,
        fontFamily: 'Vazirmatn-Regular',
    },
    actionsGroup: {
        flexDirection: 'row',
        gap: Spacing.two,
    },
    actionButton: {
        flex: 1,
        borderRadius: 12,
    },
    actionLabel: {
        fontFamily: 'Vazirmatn-Bold',
        fontSize: 12,
    },
    resetButton: {
        borderWidth: 1,
    },
    breakdownCard: {
        borderRadius: 12,
        borderWidth: 1,
        marginTop: Spacing.two,
        overflow: 'hidden',
    },
    breakdownContent: {
        gap: Spacing.two,
        paddingVertical: Spacing.three,
        paddingHorizontal: Spacing.two,
    },
    summaryBoxHeader: {
        alignItems: 'center',
        marginBottom: Spacing.one,
    },
    summaryBoxContent: {
        width: '100%',
        borderRadius: 12,
        borderWidth: 1,
        padding: Spacing.two,
        gap: Spacing.one,
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: 11,
    },
    amountValue: {
        fontSize: 18,
    },
    breakdownSectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.one,
        paddingVertical: Spacing.one,
        gap: Spacing.one,
    },
    breakdownSectionTitle: {
        fontSize: 13,
    },
    toggleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.one,
        borderRadius: 12,
        borderWidth: StyleSheet.hairlineWidth,
        paddingHorizontal: Spacing.two,
        paddingVertical: Spacing.one,
    },
    toggleButtonLabel: {
        fontSize: 11,
    },
    breakdownGrid: {
        gap: Spacing.two,
    },
    breakdownItemCard: {
        borderRadius: 12,
        borderWidth: 1,
        padding: Spacing.two,
        gap: Spacing.one,
    },
    breakdownItemHeaderRow: {
        paddingTop: 2,
        paddingBottom: 2,
        marginBottom: 2,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(0, 0, 0, 0.12)',
    },
    breakdownItemTitle: {
        fontSize: 12,
    },
    breakdownDetailGrid: {
        gap: Spacing.one,
    },
    breakdownDetailBox: {
        borderRadius: 8,
        borderWidth: 1,
        padding: Spacing.one,
        gap: Spacing.half,
        alignItems: 'center',
    },
    detailLabel: {
        fontSize: 10,
    },
    detailValue: {
        fontSize: 12,
    },
});
