import { MaterialCommunityIcons } from '@expo/vector-icons';
import { jalaaliMonthLength, toJalaali } from 'jalaali-js';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Button, Card, Menu, Snackbar } from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { PersianDatePickerModal } from '@/components/persian-date-picker-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { fetchJobGroups, fetchPeriodsByYearId, fetchSeniorityBaseByGroup, fetchYears, seedFromJsonAsset } from '@/database';
import { useTheme } from '@/hooks/use-theme';
import {
    calculateEntitledSeniorityFromPeriodData,
    calculateUnusedLeaveEntitlement,
    calculateUnusedLeaveMonths,
    calculateUnusedLeaveWageFromPeriodData,
    parseDateInput,
    type EntitledSeniorityWorkshopType,
    type SalaryPeriodBucket,
    type UnusedLeaveWageCalculationResult,
    type UnusedLeaveWageMaritalStatus,
} from '@/utils/salary-calculation';

type PickerTarget = 'start' | 'end' | 'employment';
const CHILDREN_OPTIONS = Array.from({ length: 13 }, (_, index) => index);

export default function UnusedLeaveWageScreen() {
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
    const [maritalStatus, setMaritalStatus] = useState<UnusedLeaveWageMaritalStatus>('single');
    const [childrenCount, setChildrenCount] = useState(0);
    const [childrenMenuVisible, setChildrenMenuVisible] = useState(false);
    const [usedLeaveDaysBySegment, setUsedLeaveDaysBySegment] = useState<Record<number, string>>({});
    const [initialSavedLeaveDays, setInitialSavedLeaveDays] = useState('۰');
    const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);
    const [periodBuckets, setPeriodBuckets] = useState<SalaryPeriodBucket[]>([]);
    const [availableYears, setAvailableYears] = useState<number[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [result, setResult] = useState<UnusedLeaveWageCalculationResult | null>(null);
    const [showDetails, setShowDetails] = useState(false);
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    useEffect(() => {
        let isMounted = true;
        const loadData = async () => {
            try {
                await seedFromJsonAsset();
                const [years, groups] = await Promise.all([fetchYears(), fetchJobGroups()]);
                const buckets: SalaryPeriodBucket[] = [];

                for (const year of years) {
                    const periods = await fetchPeriodsByYearId(year.id);
                    if (periods.length === 0) continue;
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
                        monthly_housing_single: period.monthly_housing_single,
                        monthly_housing_married: period.monthly_housing_married,
                        monthly_single_allowance: period.monthly_single_allowance,
                        monthly_married_allowance: period.monthly_married_allowance,
                        child_allowance: period.child_allowance,
                        marital_allowance: period.marital_allowance,
                    })));
                    buckets.push({
                        year: year.year,
                        periods: mappedPeriods,
                    });
                }

                if (isMounted) {
                    setPeriodBuckets(buckets);
                    setJobGroups(groups);
                    setSelectedGroup(groups[0]?.group_number ?? null);
                    setAvailableYears(years.map((year) => year.year));
                }
            } catch {
                if (isMounted) {
                    setSnackbarMessage('خطا در بارگذاری داده‌ها. لطفاً دوباره تلاش کنید.');
                    setSnackbarVisible(true);
                }
            } finally {
                if (isMounted) setIsLoadingData(false);
            }
        };
        void loadData();
        return () => { isMounted = false; };
    }, []);

    const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
    const toPersianDigits = (value: string | number) => String(value).replace(/\d/g, (digit) => persianDigits[Number(digit)]);
    const formatNumber = (value: number) => toPersianDigits(Number.isInteger(value) ? value.toFixed(0) : value.toFixed(2));
    const formatCurrency = (value: number) => `${new Intl.NumberFormat('fa-IR').format(Math.round(value))} ریال`;
    const formatDate = (value: string) => {
        const parsed = parseDateInput(value);
        return parsed ? `${toPersianDigits(String(parsed.year))}/${toPersianDigits(String(parsed.month).padStart(2, '0'))}/${toPersianDigits(String(parsed.day).padStart(2, '0'))}` : '';
    };
    const compareDates = (left: string, right: string) => {
        const parsedLeft = parseDateInput(left);
        const parsedRight = parseDateInput(right);
        if (!parsedLeft || !parsedRight) return 0;
        return parsedLeft.year * 10000 + parsedLeft.month * 100 + parsedLeft.day - (parsedRight.year * 10000 + parsedRight.month * 100 + parsedRight.day);
    };
    const canUseSettlementPath = (parseDateInput(employmentDate)?.year ?? 0) <= 1391;
    const totalMonthsWorked = (() => {
        const parsedStart = parseDateInput(startDate);
        const parsedEnd = parseDateInput(endDate);
        return parsedStart && parsedEnd ? calculateUnusedLeaveMonths(parsedStart, parsedEnd) : null;
    })();
    const fullYears = totalMonthsWorked == null || totalMonthsWorked <= 12 ? 0 : Math.floor(totalMonthsWorked / 12);
    const remainingMonths = totalMonthsWorked == null ? 0 : totalMonthsWorked > 12 ? totalMonthsWorked % 12 : totalMonthsWorked;
    const segmentCount = fullYears + (remainingMonths > 0 ? 1 : 0);

    const updateUsedLeaveDays = (segmentIndex: number, value: string) => {
        setUsedLeaveDaysBySegment((current) => ({
            ...current,
            [segmentIndex]: value.replace(/[^0-9۰-۹.]/g, ''),
        }));
    };

    const changeInitialSavedLeaveDays = (delta: number) => {
        const normalized = initialSavedLeaveDays.replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)));
        const currentValue = Number(normalized) || 0;
        const nextValue = Math.max(0, currentValue + delta);
        setInitialSavedLeaveDays(toPersianDigits(nextValue.toFixed(2).replace(/\.00$/, '')));
    };

    const changeUsedLeaveDays = (segmentIndex: number, delta: number) => {
        const currentValue = Number(String(usedLeaveDaysBySegment[segmentIndex] ?? '0').replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))) || 0;
        const nextValue = Math.max(0, currentValue + delta);
        updateUsedLeaveDays(segmentIndex, toPersianDigits(nextValue.toFixed(2).replace(/\.00$/, '')));
    };

    const handleDateSelect = (value: string) => {
        if (pickerTarget === 'employment') {
            setEmploymentDate(value);
            if (compareDates(value, endDate) > 0) setEndDate(value);
        } else if (pickerTarget === 'start') {
            setStartDate(value);
            if (compareDates(value, endDate) > 0) setEndDate(value);
        } else if (pickerTarget === 'end') {
            if (compareDates(value, startDate) < 0) {
                setSnackbarMessage('تاریخ پایان باید برابر یا بزرگتر از تاریخ شروع باشد.');
                setSnackbarVisible(true);
            } else {
                setEndDate(value);
            }
        }
        setPickerTarget(null);
    };

    const handleCalculate = () => {
        const start = parseDateInput(startDate);
        const end = parseDateInput(endDate);
        const employment = parseDateInput(employmentDate);
        if (!start || !end || !employment || compareDates(employmentDate, endDate) > 0) {
            setResult(null);
            setSnackbarMessage('تاریخ‌های واردشده معتبر نیستند.');
            setSnackbarVisible(true);
            return;
        }
        if (workshopType === 'classified' && selectedGroup == null) {
            setResult(null);
            setSnackbarMessage('گروه شغلی را انتخاب کنید.');
            setSnackbarVisible(true);
            return;
        }

        const usedLeaveDays = Array.from({ length: segmentCount }, (_, index) =>
            Number(String(usedLeaveDaysBySegment[index] ?? '0').replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))),
        );
        const initialSavedDays = Number(initialSavedLeaveDays.replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit))));
        if (usedLeaveDays.some((value) => !Number.isFinite(value) || value < 0) || !Number.isFinite(initialSavedDays) || initialSavedDays < 0) {
            setResult(null);
            setSnackbarMessage('مقادیر مرخصی استفاده‌شده و ذخیره انتقالی باید صفر یا بیشتر باشند.');
            setSnackbarVisible(true);
            return;
        }

        const leaveCalculation = calculateUnusedLeaveEntitlement(start, end, usedLeaveDays, initialSavedDays);
        if (!leaveCalculation) {
            setResult(null);
            setSnackbarMessage('محاسبه میزان مرخصی ذخیره‌شده امکان‌پذیر نیست.');
            setSnackbarVisible(true);
            return;
        }

        const seniority = calculateEntitledSeniorityFromPeriodData(
            employment,
            end,
            periodBuckets,
            workshopType,
            selectedGroup ?? undefined,
            settledThrough1391,
        );
        const calculation = calculateUnusedLeaveWageFromPeriodData(
            start,
            end,
            periodBuckets,
            maritalStatus,
            childrenCount,
            seniority.finalEntitlement,
            leaveCalculation.totalSavedLeaveDays,
        );
        if (!calculation) {
            setResult(null);
            setSnackbarMessage('برای تاریخ پایان، داده‌ی حقوقی معتبری پیدا نشد.');
            setSnackbarVisible(true);
            return;
        }
        setResult(calculation);
        setShowDetails(false);
    };

    const handleReset = () => {
        setStartDate(defaultStartDate);
        setEndDate(defaultEndDate);
        setEmploymentDate(defaultEmploymentDate);
        setMaritalStatus('single');
        setChildrenCount(0);
        setUsedLeaveDaysBySegment({});
        setInitialSavedLeaveDays('۰');
        setWorkshopType('unclassified');
        setSettledThrough1391(false);
        setGroupMenuVisible(false);
        setChildrenMenuVisible(false);
        setResult(null);
        setShowDetails(false);
    };

    const components = result ? [
        ['حداقل مزد روزانه', result.dailyMinimumWage],
        [workshopType === 'classified' ? 'پایه سنوات استحقاقی روزانه گروه شغلی' : 'پایه سنوات استحقاقی روزانه', result.dailySeniority],
        ['حق مسکن روزانه', result.dailyHousingAllowance],
        ['حق عائله‌مندی روزانه', result.dailyChildAllowance],
        ['بن کارگری روزانه', result.dailyMonthlyAllowance],
        ['حق تأهل روزانه', result.dailyMaritalAllowance],
    ] as const : [];

    return (
        <ThemedView style={styles.container}>
            <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + Spacing.three, paddingBottom: insets.bottom + Spacing.four }]} showsVerticalScrollIndicator={false}>
                <SafeAreaView style={styles.safeArea}>
                    <Card elevation={1} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <Card.Content style={styles.cardContent}>
                            <View style={styles.headerRow}>
                                <View style={styles.headerText}>
                                    <ThemedText type="bodyBold" style={[styles.pageTitle, { color: theme.text }]}>مزد مرخصی ذخیره شده کارگر</ThemedText>
                                    <ThemedText type="small" style={[styles.pageDescription, { color: theme.textSecondary }]}>مزد مرخصی بر اساس روزهای مرخصی ذخیره شده و آخرین ماه کارکرد محاسبه می‌شود.</ThemedText>
                                </View>
                            </View>
                            <View style={[styles.formulaBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                                <ThemedText type="small" style={[styles.formulaLabel, { color: theme.textSecondary }]}>فرمول محاسبه</ThemedText>
                                <ThemedText type="small" style={[styles.formulaValue, { color: theme.text }]}>میزان مرخصی ذخیره‌شده کارگر × ((حداقل مزد روزانه مصوب شورای عالی کار در آخرین روز کارکرد + پایه سنوات استحقاقی روزانه در آخرین روز کارکرد) + (مبلغ حق مسکن ماهیانه در آخرین ماه کارکرد ÷ تعداد روزهای آن ماه در تقویم) + (مبلغ حق عائله‌مندی ماهیانه در آخرین ماه کارکرد ÷ تعداد روزهای آن ماه در تقویم) + (مبلغ بن کارگری در آخرین ماه کارکرد ÷ تعداد روزهای آن ماه در تقویم) + (مبلغ حق تأهل ماهیانه در آخرین ماه کارکرد ÷ تعداد روزهای آن ماه در تقویم))</ThemedText>
                            </View>
                            <View style={styles.metricsRow}>
                                {(['start', 'end'] as const).map((target) => (
                                    <View key={target} style={[styles.metricBox, { backgroundColor: theme.surfaceVariant }]}>
                                        <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary }]}>{target === 'start' ? 'از تاریخ' : 'تا تاریخ'}</ThemedText>
                                        <Pressable onPress={() => setPickerTarget(target)} style={[styles.dateInput, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                            <ThemedText type="smallBold" style={[styles.fieldValue, { color: theme.text }]}>{formatDate(target === 'start' ? startDate : endDate)}</ThemedText>
                                            <MaterialCommunityIcons name="calendar-month-outline" size={18} color={theme.primary} />
                                        </Pressable>
                                    </View>
                                ))}
                            </View>
                            <View style={[styles.metricBox, { backgroundColor: theme.surfaceVariant }]}>
                                <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary }]}>تاریخ شروع به کار در کارگاه</ThemedText>
                                <Pressable onPress={() => setPickerTarget('employment')} style={[styles.dateInput, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                    <ThemedText type="smallBold" style={[styles.fieldValue, { color: theme.text }]}>{formatDate(employmentDate)}</ThemedText>
                                    <MaterialCommunityIcons name="calendar-account-outline" size={18} color={theme.primary} />
                                </Pressable>
                            </View>
                            <View style={[styles.metricBox, { backgroundColor: theme.surfaceVariant }]}>
                                <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary }]}>ذخیره مرخصی از سال‌های قبل</ThemedText>
                                <View style={[styles.stepper, styles.initialSavedStepper, { backgroundColor: theme.surface, borderColor: theme.border, direction: 'ltr' }]}>
                                    <Pressable
                                        onPress={() => changeInitialSavedLeaveDays(-1)}
                                        disabled={Number(initialSavedLeaveDays.replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))) <= 0}
                                        style={({ pressed }) => [
                                            styles.stepperButton,
                                            { backgroundColor: pressed ? theme.primaryContainer : theme.surfaceVariant },
                                            Number(initialSavedLeaveDays.replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))) <= 0 && styles.stepperButtonDisabled,
                                        ]}
                                        accessibilityRole="button"
                                        accessibilityLabel="کاهش ذخیره مرخصی سال‌های قبل"
                                    >
                                        <MaterialCommunityIcons name="minus" size={20} color={theme.primary} />
                                    </Pressable>
                                    <TextInput
                                        value={initialSavedLeaveDays}
                                        onChangeText={(value) => setInitialSavedLeaveDays(value.replace(/[^0-9۰-۹.]/g, ''))}
                                        keyboardType="decimal-pad"
                                        inputMode="decimal"
                                        placeholder="۰"
                                        placeholderTextColor={theme.textMuted}
                                        style={[styles.stepperInput, { color: theme.text }]}
                                        textAlign="center"
                                        accessibilityLabel="ذخیره مرخصی از سال‌های قبل"
                                    />
                                    <Pressable
                                        onPress={() => changeInitialSavedLeaveDays(1)}
                                        style={({ pressed }) => [
                                            styles.stepperButton,
                                            { backgroundColor: pressed ? theme.primaryContainer : theme.surfaceVariant },
                                        ]}
                                        accessibilityRole="button"
                                        accessibilityLabel="افزایش ذخیره مرخصی سال‌های قبل"
                                    >
                                        <MaterialCommunityIcons name="plus" size={20} color={theme.primary} />
                                    </Pressable>
                                </View>
                            </View>
                            {segmentCount > 0 ? (
                                <View style={[styles.usedLeaveBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                                    <ThemedText type="smallBold" style={[styles.sectionLabel, { color: theme.text }]}>مرخصی استفاده‌شده در هر بخش</ThemedText>
                                    {Array.from({ length: segmentCount }, (_, index) => {
                                        const isPartial = index >= fullYears;
                                        const label = isPartial ? `بازه ناقص (${remainingMonths.toFixed(2)} ماه)` : `سال کامل ${index + 1}`;
                                        return (
                                            <View key={index} style={styles.usedLeaveRow}>
                                                <ThemedText type="small" style={styles.usedLeaveLabel}>{label}</ThemedText>
                                                <View style={[styles.stepper, { backgroundColor: theme.surface, borderColor: theme.border, direction: 'ltr' }]}>
                                                    <Pressable
                                                        onPress={() => changeUsedLeaveDays(index, -1)}
                                                        disabled={Number(String(usedLeaveDaysBySegment[index] ?? '0').replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))) <= 0}
                                                        style={({ pressed }) => [
                                                            styles.stepperButton,
                                                            { backgroundColor: pressed ? theme.primaryContainer : theme.surfaceVariant },
                                                            Number(String(usedLeaveDaysBySegment[index] ?? '0').replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))) <= 0 && styles.stepperButtonDisabled,
                                                        ]}
                                                        accessibilityRole="button"
                                                        accessibilityLabel="کاهش مرخصی استفاده‌شده"
                                                    >
                                                        <MaterialCommunityIcons name="minus" size={20} color={theme.primary} />
                                                    </Pressable>
                                                    <TextInput
                                                        value={usedLeaveDaysBySegment[index] ?? ''}
                                                        onChangeText={(value) => updateUsedLeaveDays(index, value)}
                                                        keyboardType="decimal-pad"
                                                        placeholder="۰"
                                                        placeholderTextColor={theme.textMuted}
                                                        style={[styles.stepperInput, { color: theme.text }]}
                                                        textAlign="center"
                                                        accessibilityLabel="مرخصی استفاده‌شده"
                                                    />
                                                    <Pressable
                                                        onPress={() => changeUsedLeaveDays(index, 1)}
                                                        style={({ pressed }) => [
                                                            styles.stepperButton,
                                                            { backgroundColor: pressed ? theme.primaryContainer : theme.surfaceVariant },
                                                        ]}
                                                        accessibilityRole="button"
                                                        accessibilityLabel="افزایش مرخصی استفاده‌شده"
                                                    >
                                                        <MaterialCommunityIcons name="plus" size={20} color={theme.primary} />
                                                    </Pressable>
                                                </View>
                                            </View>
                                        );
                                    })}
                                </View>
                            ) : null}
                            <View style={[styles.optionSection, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                                <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary }]}>نوع کارگاه</ThemedText>
                                <View style={styles.statusRow}>
                                    {([['unclassified', 'فاقد طرح طبقه‌بندی'], ['classified', 'دارای طرح طبقه‌بندی']] as const).map(([value, label]) => (
                                        <Pressable key={value} onPress={() => setWorkshopType(value)} style={[styles.statusButton, { backgroundColor: workshopType === value ? theme.primary : theme.surface, borderColor: workshopType === value ? theme.primary : theme.border }]}>
                                            <ThemedText type="smallBold" style={{ color: workshopType === value ? theme.surface : theme.text, textAlign: 'center', fontSize: 13, lineHeight: 19 }}>{label}</ThemedText>
                                        </Pressable>
                                    ))}
                                </View>
                            </View>
                            {workshopType === 'classified' ? (
                                <View style={[styles.metricBox, { backgroundColor: theme.surfaceVariant }]}>
                                    <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary }]}>گروه شغلی</ThemedText>
                                    <Menu
                                        visible={groupMenuVisible}
                                        onDismiss={() => setGroupMenuVisible(false)}
                                        anchor={
                                            <Pressable onPress={() => setGroupMenuVisible(true)} style={[styles.dateInput, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                                <ThemedText type="smallBold" style={{ color: theme.text }}>{selectedGroup == null ? 'انتخاب گروه' : `گروه ${toPersianDigits(selectedGroup)}`}</ThemedText>
                                                <MaterialCommunityIcons name="briefcase-outline" size={18} color={theme.primary} />
                                            </Pressable>
                                        }
                                    >
                                        {jobGroups.map((group) => <Menu.Item key={group.id} title={`گروه ${toPersianDigits(group.group_number)}`} onPress={() => { setSelectedGroup(group.group_number); setGroupMenuVisible(false); }} />)}
                                    </Menu>
                                </View>
                            ) : null}
                            <Pressable
                                onPress={() => canUseSettlementPath && setSettledThrough1391((value) => !value)}
                                style={[styles.settlementRow, { backgroundColor: theme.surfaceVariant, borderColor: theme.border, opacity: canUseSettlementPath ? 1 : 0.55 }]}
                            >
                                <MaterialCommunityIcons name={settledThrough1391 ? 'checkbox-marked' : 'checkbox-blank-outline'} size={22} color={settledThrough1391 ? theme.primary : theme.textSecondary} />
                                <View style={styles.settlementText}>
                                    <ThemedText type="smallBold" style={[styles.settlementTitle, { color: theme.text }]}>تصفیه حساب تا پایان سال ۱۳۹۱ انجام شده است</ThemedText>
                                    <ThemedText type="small" style={[styles.settlementDescription, { color: theme.textSecondary }]}>{canUseSettlementPath ? 'محاسبه سنوات از سال ۱۳۹۲ ادامه پیدا می‌کند.' : 'این گزینه برای استخدام‌های سال ۱۳۹۲ و بعد کاربرد ندارد.'}</ThemedText>
                                </View>
                            </Pressable>
                            <View style={[styles.metricBox, { backgroundColor: theme.surfaceVariant }]}>
                                <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary }]}>وضعیت تأهل</ThemedText>
                                <View style={styles.statusRow}>
                                    {([['single', 'مجرد'], ['married', 'متأهل']] as const).map(([value, label]) => {
                                        const selected = maritalStatus === value;
                                        return <Pressable key={value} onPress={() => setMaritalStatus(value)} style={[styles.statusButton, { backgroundColor: selected ? theme.primary : theme.surface, borderColor: selected ? theme.primary : theme.border }]}><ThemedText type="smallBold" style={{ color: selected ? theme.surface : theme.text }}>{label}</ThemedText></Pressable>;
                                    })}
                                </View>
                            </View>
                            <View style={[styles.metricBox, { backgroundColor: theme.surfaceVariant }]}>
                                <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary }]}>تعداد فرزندان واجد شرایط</ThemedText>
                                <Menu
                                    visible={childrenMenuVisible}
                                    onDismiss={() => setChildrenMenuVisible(false)}
                                    anchor={
                                        <Pressable onPress={() => setChildrenMenuVisible(true)}>
                                            <View style={[styles.dateInput, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                                <ThemedText type="smallBold" style={[styles.fieldValue, { color: theme.text }]}>
                                                    {`${toPersianDigits(String(childrenCount))} فرزند`}
                                                </ThemedText>
                                                <MaterialCommunityIcons name="account-group-outline" size={18} color={theme.primary} />
                                            </View>
                                        </Pressable>
                                    }
                                    contentStyle={{ borderRadius: 16, backgroundColor: theme.surface }}
                                >
                                    {CHILDREN_OPTIONS.map((count) => (
                                        <Menu.Item
                                            key={count}
                                            onPress={() => {
                                                setChildrenCount(count);
                                                setChildrenMenuVisible(false);
                                            }}
                                            title={`${toPersianDigits(String(count))} فرزند`}
                                            titleStyle={{ fontFamily: 'Vazirmatn-Regular', color: theme.text }}
                                        />
                                    ))}
                                </Menu>
                            </View>
                            <View style={styles.actionsGroup}>
                                <Button mode="contained" onPress={handleCalculate} icon="cash-clock" buttonColor={theme.primary} textColor={theme.surface} style={styles.actionButton} labelStyle={styles.actionLabel} loading={isLoadingData} disabled={isLoadingData}>محاسبه</Button>
                                {result ? <Button mode="outlined" onPress={handleReset} icon="refresh" textColor={theme.primary} style={styles.actionButton} labelStyle={styles.actionLabel}>بازنشانی</Button> : null}
                            </View>
                            {result ? <Card style={[styles.resultCard, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}><Card.Content style={styles.resultContent}>
                                <View style={[styles.summaryBox, { backgroundColor: theme.surface, borderColor: theme.border }]}><ThemedText type="small" style={[styles.summaryLabel, { color: theme.textSecondary }]}>مبلغ مزد مرخصی ذخیره شده کارگر</ThemedText><ThemedText type="largeTitle" style={[styles.amountValue, { color: theme.primary }]}>{toPersianDigits(formatCurrency(result.unusedLeaveDays * result.dailyWage))}</ThemedText></View>
                                <View style={styles.breakdownHeader}><ThemedText type="smallBold" style={[styles.breakdownSectionTitle, { color: theme.text }]}>جزئیات محاسبه</ThemedText><Pressable onPress={() => setShowDetails((value) => !value)} style={[styles.toggleButton, { backgroundColor: theme.surface, borderColor: theme.border }]}><ThemedText type="smallBold" style={[styles.toggleButtonLabel, { color: theme.primary }]}>{showDetails ? 'عدم نمایش' : 'نمایش جزئیات'}</ThemedText><MaterialCommunityIcons name={showDetails ? 'chevron-up' : 'chevron-down'} size={18} color={theme.primary} /></Pressable></View>
                                {showDetails ? <View style={styles.breakdownGrid}><View style={[styles.breakdownItemCard, { backgroundColor: theme.surface, borderColor: theme.border }]}><View style={styles.breakdownItemHeaderRow}><ThemedText type="smallBold" style={[styles.breakdownItemTitle, { color: theme.text }]}>جزئیات مزد روزانه</ThemedText></View><View style={styles.breakdownDetailGrid}><View style={[styles.detailBox, { backgroundColor: theme.primaryContainer, borderColor: theme.primary }]}><ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>روزهای مرخصی ذخیره شده</ThemedText><ThemedText type="smallBold" style={[styles.detailValue, { color: theme.primary }]}>{formatNumber(result.unusedLeaveDays)} روز</ThemedText></View><View style={[styles.detailBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}><ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>روزهای تقویمی ماه آخر کارکرد</ThemedText><ThemedText type="smallBold" style={[styles.detailValue, { color: theme.text }]}>{toPersianDigits(result.calendarDaysInLastMonth)} روز</ThemedText></View><ThemedText type="small" style={[styles.detailDescription, { color: theme.textSecondary }]}>آخرین ماه کارکرد: سال {toPersianDigits(result.year)}، دوره {toPersianDigits(result.periodIndex)}</ThemedText>{components.map(([label, value]) => <View key={label} style={[styles.detailBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}><ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>{label}</ThemedText><ThemedText type="smallBold" style={[styles.detailValue, { color: theme.text }]}>{formatCurrency(value)}</ThemedText></View>)}<View style={[styles.detailBox, { backgroundColor: theme.primaryContainer, borderColor: theme.primary }]}><ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>مزد روزانه مشمول مرخصی</ThemedText><ThemedText type="smallBold" style={[styles.detailValue, { color: theme.primary }]}>{formatCurrency(result.dailyWage)}</ThemedText></View></View></View></View> : null}
                            </Card.Content></Card> : null}
                        </Card.Content>
                    </Card>
                </SafeAreaView>
            </ScrollView>
            <PersianDatePickerModal visible={pickerTarget !== null} value={pickerTarget === 'employment' ? employmentDate : pickerTarget === 'start' ? startDate : endDate} title={pickerTarget === 'employment' ? 'انتخاب تاریخ شروع به کار در کارگاه' : pickerTarget === 'start' ? 'انتخاب تاریخ شروع' : 'انتخاب تاریخ پایان'} onClose={() => setPickerTarget(null)} onSelect={handleDateSelect} availableYears={availableYears} />
            <Snackbar visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)} duration={3000} style={{ backgroundColor: theme.error, borderRadius: Radius.md }} action={{ label: 'بستن', onPress: () => setSnackbarVisible(false), labelStyle: { color: theme.surface } }}><ThemedText type="small" style={{ color: theme.surface }}>{snackbarMessage}</ThemedText></Snackbar>
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
    pageTitle: { fontSize: 16, lineHeight: 22, fontFamily: 'Vazirmatn-Bold' },
    pageDescription: { fontSize: 12, lineHeight: 20 },
    formulaBox: { borderRadius: Radius.md, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: Spacing.two, paddingVertical: Spacing.two, gap: Spacing.one },
    formulaLabel: { fontSize: 11 },
    formulaValue: { fontSize: 12, lineHeight: 20 },
    metricsRow: { flexDirection: 'row', gap: Spacing.two },
    metricBox: { flex: 1, borderRadius: 14, padding: Spacing.two, gap: Spacing.one },
    sectionLabel: { fontSize: 11 },
    dateInput: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.two, paddingVertical: Spacing.two, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, gap: Spacing.one },
    fieldValue: { flex: 1, fontSize: 13 },
    textInput: { minHeight: 42, borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, paddingHorizontal: Spacing.two, fontFamily: 'Vazirmatn-Bold', fontSize: 14 },
    usedLeaveBox: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: Spacing.two, gap: Spacing.two },
    usedLeaveRow: { flexDirection: 'column', alignItems: 'stretch', gap: Spacing.two },
    usedLeaveLabel: { fontSize: 12, lineHeight: 19 },
    stepper: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, padding: Spacing.one, gap: Spacing.one },
    stepperButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
    stepperButtonDisabled: { opacity: 0.4 },
    stepperInput: { flex: 1, minHeight: 42, fontFamily: 'Vazirmatn-Bold', fontSize: 14, paddingVertical: 0 },
    initialSavedStepper: { width: '100%' },
    statusRow: { flexDirection: 'row', gap: Spacing.two },
    statusButton: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.one, paddingVertical: Spacing.two, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth },
    optionSection: { gap: Spacing.two, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: Spacing.two },
    leaveUsageField: { gap: Spacing.one },
    settlementRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, padding: Spacing.two },
    settlementText: { flex: 1, gap: Spacing.one },
    settlementTitle: { fontSize: 13, lineHeight: 19 },
    settlementDescription: { fontSize: 11, lineHeight: 20 },
    actionsGroup: { flexDirection: 'row', gap: Spacing.two },
    actionButton: { flex: 1, borderRadius: 12 },
    actionLabel: { fontFamily: 'Vazirmatn-Bold', fontSize: 12 },
    resultCard: { borderRadius: 12, borderWidth: 1, marginTop: Spacing.two, overflow: 'hidden' },
    resultContent: { gap: Spacing.two, paddingVertical: Spacing.three, paddingHorizontal: Spacing.two },
    summaryBox: { width: '100%', alignItems: 'center', gap: Spacing.one, padding: Spacing.two, borderRadius: 12, borderWidth: 1 },
    summaryLabel: { fontSize: 11 },
    amountValue: { fontSize: 18 },
    breakdownHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.one, paddingVertical: Spacing.one, gap: Spacing.one },
    breakdownSectionTitle: { fontSize: 13, fontFamily: 'Vazirmatn-Bold' },
    toggleButton: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, paddingHorizontal: Spacing.two, paddingVertical: Spacing.one, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth },
    toggleButtonLabel: { fontSize: 11 },
    breakdownGrid: { gap: Spacing.two },
    breakdownItemCard: { borderRadius: 12, borderWidth: 1, padding: Spacing.two, gap: Spacing.one },
    breakdownItemHeaderRow: { paddingTop: 2, paddingBottom: 2, marginBottom: 2, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(0, 0, 0, 0.12)' },
    breakdownItemTitle: { fontSize: 12, fontFamily: 'Vazirmatn-Bold' },
    breakdownDetailGrid: { gap: Spacing.one },
    detailDescription: { fontSize: 12, lineHeight: 18 },
    detailBox: { alignItems: 'center', gap: Spacing.half, padding: Spacing.one, borderRadius: 8, borderWidth: 1 },
    detailLabel: { fontSize: 10 },
    detailValue: { fontSize: 12 },
});
