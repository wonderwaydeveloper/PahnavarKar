import { MaterialCommunityIcons } from '@expo/vector-icons';
import { jalaaliMonthLength, toJalaali } from 'jalaali-js';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Button, Card, Snackbar } from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { PersianDatePickerModal } from '@/components/persian-date-picker-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { fetchPeriodsByYearId, fetchYears, seedFromJsonAsset } from '@/database';
import { useTheme } from '@/hooks/use-theme';
import {
    calculateAvailableFridaysByYear,
    calculateFridayWorkFromPeriodData,
    parseDateInput,
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

    const [startDate, setStartDate] = useState(defaultStartDate);
    const [endDate, setEndDate] = useState(defaultEndDate);
    const [fridayWorkDaysByYear, setFridayWorkDaysByYear] = useState<Record<number, string>>({});
    const [pickerTarget, setPickerTarget] = useState<'start' | 'end' | null>(null);
    const [pickerVisible, setPickerVisible] = useState(false);
    const [periodBuckets, setPeriodBuckets] = useState<SalaryPeriodBucket[]>([]);
    const [availableYears, setAvailableYears] = useState<number[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [result, setResult] = useState<FridayWorkCalculationResult | null>(null);
    const [showDetailedBreakdown, setShowDetailedBreakdown] = useState(false);
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    useEffect(() => {
        let isMounted = true;

        const loadData = async () => {
            try {
                setIsLoadingData(true);
                await seedFromJsonAsset();

                const years = await fetchYears();
                const buckets: SalaryPeriodBucket[] = [];

                for (const year of years) {
                    const periods = await fetchPeriodsByYearId(year.id);
                    if (periods.length === 0) {
                        continue;
                    }

                    buckets.push({
                        year: year.year,
                        periods: periods.map((period) => ({
                            period_index: period.period_index,
                            month_count: period.month_count,
                            daily_minimum_wage: period.daily_minimum_wage,
                            friday_work_per_day: period.friday_work_per_day,
                        })),
                    });
                }

                if (isMounted) {
                    setPeriodBuckets(buckets);
                    setAvailableYears(years.map((year) => year.year));
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
    const formatCurrency = (value: number) => `${new Intl.NumberFormat('fa-IR').format(value)} ریال`;

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

    const openPicker = (target: 'start' | 'end') => {
        setPickerTarget(target);
        setPickerVisible(true);
    };

    const closePicker = () => {
        setPickerVisible(false);
        setPickerTarget(null);
    };

    const handleDateSelect = (value: string) => {
        if (pickerTarget === 'start') {
            setStartDate(value);
            if (compareDates(value, endDate) > 0) {
                setEndDate(value);
            }
            return;
        }

        if (pickerTarget === 'end') {
            if (compareDates(value, startDate) < 0) {
                setEndDate(startDate);
                setSnackbarMessage('تاریخ پایان باید برابر یا بزرگتر از تاریخ شروع باشد.');
                setSnackbarVisible(true);
                return;
            }

            setEndDate(value);
        }
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

        if (!parsedStart || !parsedEnd || compareDates(startDate, endDate) > 0) {
            setResult(null);
            setSnackbarMessage('بازهٔ زمانی واردشده معتبر نیست.');
            setSnackbarVisible(true);
            return;
        }

        if (periodBuckets.length === 0) {
            setResult(null);
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

        const calculation = calculateFridayWorkFromPeriodData(parsedStart, parsedEnd, periodBuckets, parsedFridayWorkDaysByYear);

        if (calculation.breakdown.length === 0) {
            setResult(null);
            setSnackbarMessage('برای بازهٔ انتخابی مبلغ جمعه کاری ثبت‌شده‌ای پیدا نشد.');
            setSnackbarVisible(true);
            return;
        }

        setResult(calculation);
        setShowDetailedBreakdown(false);
    };

    const handleReset = () => {
        setStartDate(defaultStartDate);
        setEndDate(defaultEndDate);
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
                                <ThemedText type="small" style={[styles.formulaValue, { color: theme.text }]}>تعداد جمعه کاری کارگر در هر سال × مبلغ جمعه کاری یک روز در دوره‌های همان سال</ThemedText>
                            </View>

                            <View style={styles.metricsRow}>
                                {(['start', 'end'] as const).map((target) => (
                                    <View key={target} style={[styles.metricBox, { backgroundColor: theme.surfaceVariant }]}>
                                        <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary }]}>{target === 'start' ? 'از تاریخ' : 'تا تاریخ'}</ThemedText>
                                        <Pressable onPress={() => openPicker(target)}>
                                            <View style={[styles.dateInput, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                                <ThemedText type="small" style={[styles.fieldValue, { color: theme.text }]}>{formatDisplayedDate(target === 'start' ? startDate : endDate)}</ThemedText>
                                                <MaterialCommunityIcons name="calendar-month-outline" size={18} color={theme.primary} />
                                            </View>
                                        </Pressable>
                                    </View>
                                ))}
                            </View>

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
                                                            <View style={[styles.breakdownDetailBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}><ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>جمعه‌های موجود در این دوره</ThemedText><ThemedText type="smallBold" style={[styles.detailValue, { color: theme.text }]}>{toPersianDigits(String(item.fridaysInPeriod))} روز</ThemedText></View>
                                                            <View style={[styles.breakdownDetailBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}><ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>جمعه‌کاری واردشده</ThemedText><ThemedText type="smallBold" style={[styles.detailValue, { color: theme.text }]}>{toPersianDigits(String(item.fridayWorkDays))} روز</ThemedText></View>
                                                            <View style={[styles.breakdownDetailBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}><ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>مبلغ جمعه کاری یک روز</ThemedText><ThemedText type="smallBold" style={[styles.detailValue, { color: theme.text }]}>{item.fridayWorkRate != null ? toPersianDigits(formatCurrency(item.fridayWorkRate)) : '-'}</ThemedText></View>
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

            <PersianDatePickerModal visible={pickerVisible} value={pickerTarget === 'start' ? startDate : endDate} title={pickerTarget === 'start' ? 'انتخاب تاریخ شروع' : 'انتخاب تاریخ پایان'} onClose={closePicker} onSelect={handleDateSelect} availableYears={availableYears} />

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
    pageTitle: { fontSize: 16, lineHeight: 22, fontFamily: 'Vazirmatn-Bold' },
    pageDescription: { lineHeight: 20, fontSize: 12 },
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