import { MaterialCommunityIcons } from '@expo/vector-icons';
import { jalaaliMonthLength, toJalaali } from 'jalaali-js';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Menu, Snackbar } from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { PersianDatePickerModal } from '@/components/persian-date-picker-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { fetchPeriodsByYearId, fetchYears, seedFromJsonAsset } from '@/database';
import { useTheme } from '@/hooks/use-theme';
import {
    calculateSuspensionWageFromPeriodData,
    parseDateInput,
    type SalaryPeriodBucket,
    type SuspensionWageCalculationResult,
} from '@/utils/salary-calculation';

type PickerTarget = 'suspensionStart' | 'suspensionEnd' | 'employmentStart';
type MaritalStatus = 'single' | 'married';

const CHILDREN_OPTIONS = Array.from({ length: 13 }, (_, index) => index);

export default function SuspensionWageScreen() {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const currentJalaliDate = useMemo(() => {
        const today = new Date();
        return toJalaali(today.getFullYear(), today.getMonth() + 1, today.getDate());
    }, []);
    const currentYear = currentJalaliDate.jy;
    const defaultSuspensionStart = `${currentYear}/01/01`;
    const defaultSuspensionEnd = `${currentYear}/12/${jalaaliMonthLength(currentYear, 12)}`;

    const [suspensionStart, setSuspensionStart] = useState(defaultSuspensionStart);
    const [suspensionEnd, setSuspensionEnd] = useState(defaultSuspensionEnd);
    const [employmentStart, setEmploymentStart] = useState(`${currentYear - 1}/01/01`);
    const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);
    const [maritalStatus, setMaritalStatus] = useState<MaritalStatus>('single');
    const [childrenCount, setChildrenCount] = useState(0);
    const [childrenMenuVisible, setChildrenMenuVisible] = useState(false);
    const [periodBuckets, setPeriodBuckets] = useState<SalaryPeriodBucket[]>([]);
    const [availableYears, setAvailableYears] = useState<number[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [result, setResult] = useState<SuspensionWageCalculationResult | null>(null);
    const [showDetails, setShowDetails] = useState(false);
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    useEffect(() => {
        let isMounted = true;
        const loadData = async () => {
            try {
                await seedFromJsonAsset();
                const years = await fetchYears();
                const buckets: SalaryPeriodBucket[] = [];

                for (const year of years) {
                    const periods = await fetchPeriodsByYearId(year.id);
                    if (periods.length === 0) continue;
                    buckets.push({
                        year: year.year,
                        periods: periods.map((period) => ({
                            period_index: period.period_index,
                            month_count: period.month_count,
                            daily_minimum_wage: period.daily_minimum_wage,
                            percent_increase: period.percent_increase,
                            seniority_base: period.seniority_base,
                            monthly_housing_single: period.monthly_housing_single,
                            monthly_housing_married: period.monthly_housing_married,
                            child_allowance: period.child_allowance,
                            monthly_single_allowance: period.monthly_single_allowance,
                            monthly_married_allowance: period.monthly_married_allowance,
                            marital_allowance: period.marital_allowance,
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
                if (isMounted) setIsLoadingData(false);
            }
        };
        void loadData();
        return () => { isMounted = false; };
    }, []);

    const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
    const toPersianDigits = (value: string | number) => String(value).replace(/\d/g, (digit) => persianDigits[Number(digit)]);
    const formatCurrency = (value: number) => `${new Intl.NumberFormat('fa-IR').format(Math.round(value))} ریال`;
    const formatDate = (value: string) => {
        const parsed = parseDateInput(value);
        return parsed ? `${toPersianDigits(parsed.year)}/${toPersianDigits(String(parsed.month).padStart(2, '0'))}/${toPersianDigits(String(parsed.day).padStart(2, '0'))}` : '';
    };
    const formatParsedDate = (value: { year: number; month: number; day: number }) =>
        `${toPersianDigits(value.year)}/${toPersianDigits(String(value.month).padStart(2, '0'))}/${toPersianDigits(String(value.day).padStart(2, '0'))}`;
    const compareDates = (left: string, right: string) => {
        const parsedLeft = parseDateInput(left);
        const parsedRight = parseDateInput(right);
        if (!parsedLeft || !parsedRight) return 0;
        return parsedLeft.year * 10000 + parsedLeft.month * 100 + parsedLeft.day - (parsedRight.year * 10000 + parsedRight.month * 100 + parsedRight.day);
    };

    const showMaritalStatus = (() => {
        const start = parseDateInput(suspensionStart);
        const end = parseDateInput(suspensionEnd);

        if (!start || !end || compareDates(suspensionStart, suspensionEnd) > 0) {
            return false;
        }

        return periodBuckets
            .filter((bucket) => bucket.year >= start.year && bucket.year <= end.year)
            .some((bucket) => bucket.periods.some((period) => (
                (period.monthly_housing_single != null &&
                    period.monthly_housing_married != null &&
                    period.monthly_housing_single !== period.monthly_housing_married) ||
                (period.monthly_single_allowance != null &&
                    period.monthly_married_allowance != null &&
                    period.monthly_single_allowance !== period.monthly_married_allowance) ||
                period.marital_allowance != null
            )));
    })();
    const openPicker = (target: PickerTarget) => setPickerTarget(target);
    const getDateValue = (target: PickerTarget) => target === 'suspensionStart' ? suspensionStart : target === 'suspensionEnd' ? suspensionEnd : employmentStart;
    const handleDateSelect = (value: string) => {
        if (pickerTarget === 'employmentStart') {
            setEmploymentStart(value);
        } else if (pickerTarget === 'suspensionStart') {
            setSuspensionStart(value);
            if (compareDates(value, suspensionEnd) > 0) setSuspensionEnd(value);
        } else if (pickerTarget === 'suspensionEnd') {
            if (compareDates(value, suspensionStart) < 0) {
                setSnackbarMessage('تاریخ پایان تعلیق باید برابر یا بزرگ‌تر از تاریخ شروع باشد.');
                setSnackbarVisible(true);
            } else {
                setSuspensionEnd(value);
            }
        }
        setPickerTarget(null);
    };

    const handleCalculate = () => {
        const start = parseDateInput(suspensionStart);
        const end = parseDateInput(suspensionEnd);
        const employment = parseDateInput(employmentStart);
        if (!start || !end || !employment || compareDates(suspensionStart, suspensionEnd) > 0 || compareDates(employmentStart, suspensionEnd) > 0) {
            setResult(null);
            setSnackbarMessage('تاریخ‌های واردشده معتبر نیستند.');
            setSnackbarVisible(true);
            return;
        }

        const selectedYears = periodBuckets.filter((bucket) => bucket.year >= start.year && bucket.year <= end.year);
        const missingYears = Array.from({ length: end.year - start.year + 1 }, (_, index) => start.year + index)
            .filter((year) => !selectedYears.some((bucket) => bucket.year === year));
        if (missingYears.length > 0) {
            setResult(null);
            setSnackbarMessage(`برای سال‌های ${missingYears.map((year) => toPersianDigits(year)).join('، ')} داده‌ای موجود نیست.`);
            setSnackbarVisible(true);
            return;
        }

        const calculation = calculateSuspensionWageFromPeriodData(start, end, employment, periodBuckets, maritalStatus, childrenCount);
        if (calculation.breakdown.length === 0) {
            setResult(null);
            setSnackbarMessage('برای بازهٔ انتخاب‌شده مبلغ قابل محاسبه‌ای وجود ندارد.');
            setSnackbarVisible(true);
            return;
        }
        setResult(calculation);
        setShowDetails(false);
    };

    const handleReset = () => {
        setSuspensionStart(defaultSuspensionStart);
        setSuspensionEnd(defaultSuspensionEnd);
        setEmploymentStart(`${currentYear - 1}/01/01`);
        setMaritalStatus('single');
        setChildrenCount(0);
        setResult(null);
        setShowDetails(false);
    };

    const dateFields: { target: PickerTarget; label: string }[] = [
        { target: 'employmentStart', label: 'تاریخ شروع کار' },
        { target: 'suspensionStart', label: 'شروع ایام تعلیق' },
        { target: 'suspensionEnd', label: 'پایان ایام تعلیق' },
    ];

    return (
        <ThemedView style={styles.container}>
            <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + Spacing.three, paddingBottom: insets.bottom + Spacing.four }]} showsVerticalScrollIndicator={false}>
                <SafeAreaView style={styles.safeArea}>
                    <Card elevation={1} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <Card.Content style={styles.cardContent}>
                            <View style={styles.headerText}>
                                <ThemedText type="bodyBold" style={[styles.pageTitle, { color: theme.text }]}>محاسبه حق‌السعی ایام تعلیق</ThemedText>
                                <ThemedText type="small" style={[styles.pageDescription, { color: theme.textSecondary }]}>محاسبه حق‌السعی ایام تعلیق موضوع ماده ۶۷ آیین دادرسی کار | ایام تعلیق، توقیف رابطهٔ کارگری و کارفرمایی و معلق شدن تعهدات طرفین است.</ThemedText>
                            </View>

                            <View style={[styles.formulaBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                                <ThemedText type="smallBold" style={{ color: theme.textSecondary }}>فرمول محاسبه</ThemedText>
                                <ThemedText type="small" style={[styles.formulaText, { color: theme.text }]}>
                                    تعداد روزهای انتخابی در بازهٔ زمانی هر سال × ((حداقل مزد روزانه مصوب شورای عالی کار در همان سال + پایه سنوات استحقاقی در بازهٔ انتخاب‌شده) + (حق مسکن ماهیانه آن سال ÷ تعداد روزهای همان ماه) + (حق عائله‌مندی ماهیانه ÷ تعداد روزهای همان ماه) + (بن کارگری در سال کارکرد ÷ تعداد روزهای همان ماه) + (حق تأهل ماهیانه ÷ تعداد روزهای همان ماه))
                                </ThemedText>
                            </View>

                            <View style={styles.dateGrid}>
                                {dateFields.map(({ target, label }) => (
                                    <View key={target} style={[styles.metricBox, styles.dateField, { backgroundColor: theme.surfaceVariant }]}>
                                        <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary }]}>{label}</ThemedText>
                                        <Pressable onPress={() => openPicker(target)} style={[styles.dateInput, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                            <ThemedText type="smallBold" style={{ color: theme.text }}>{formatDate(getDateValue(target))}</ThemedText>
                                            <MaterialCommunityIcons name="calendar-month-outline" size={18} color={theme.primary} />
                                        </Pressable>
                                    </View>
                                ))}
                            </View>

                            {showMaritalStatus ? (
                                <View style={[styles.metricBox, { backgroundColor: theme.surfaceVariant }]}>
                                    <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary }]}>وضعیت تأهل</ThemedText>
                                    <View style={styles.optionsRow}>
                                        {([['single', 'مجرد'], ['married', 'متأهل']] as const).map(([value, label]) => (
                                            <Pressable key={value} onPress={() => setMaritalStatus(value)} style={[styles.optionButton, { backgroundColor: maritalStatus === value ? theme.primary : theme.surface, borderColor: maritalStatus === value ? theme.primary : theme.border }]}>
                                                <ThemedText type="smallBold" style={{ color: maritalStatus === value ? theme.surface : theme.text }}>{label}</ThemedText>
                                            </Pressable>
                                        ))}
                                    </View>
                                </View>
                            ) : null}

                            <View style={[styles.metricBox, { backgroundColor: theme.surfaceVariant }]}>
                                <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary }]}>تعداد فرزندان واجد شرایط</ThemedText>
                                <Menu visible={childrenMenuVisible} onDismiss={() => setChildrenMenuVisible(false)} anchor={<Pressable onPress={() => setChildrenMenuVisible(true)} style={[styles.dateInput, { backgroundColor: theme.surface, borderColor: theme.border }]}><ThemedText type="smallBold" style={{ color: theme.text }}>{toPersianDigits(childrenCount)} فرزند</ThemedText><MaterialCommunityIcons name="account-group-outline" size={18} color={theme.primary} /></Pressable>}>
                                    {CHILDREN_OPTIONS.map((count) => <Menu.Item key={count} title={`${toPersianDigits(count)} فرزند`} onPress={() => { setChildrenCount(count); setChildrenMenuVisible(false); }} />)}
                                </Menu>
                            </View>

                            <View style={styles.actionsGroup}>
                                <Button mode="contained" onPress={handleCalculate} icon="pause-circle-outline" buttonColor={theme.primary} textColor={theme.surface} style={styles.actionButton} labelStyle={styles.actionLabel} loading={isLoadingData} disabled={isLoadingData}>محاسبه</Button>
                                {result ? <Button mode="outlined" onPress={handleReset} icon="refresh" textColor={theme.primary} style={styles.actionButton} labelStyle={styles.actionLabel}>بازنشانی</Button> : null}
                            </View>

                            {result ? <Card style={[styles.resultCard, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}><Card.Content style={styles.resultContent}>
                                <View style={[styles.summaryBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                    <ThemedText type="small" style={[styles.summaryLabel, { color: theme.textSecondary }]}>مبلغ نهایی حق‌السعی ایام تعلیق</ThemedText>
                                    <ThemedText type="largeTitle" style={[styles.amountValue, { color: theme.primary }]}>{formatCurrency(result.totalAmount)}</ThemedText>
                                </View>
                                <View style={styles.breakdownHeader}>
                                    <ThemedText type="smallBold" style={[styles.breakdownSectionTitle, { color: theme.text }]}>جزئیات دوره‌ها</ThemedText>
                                    <Pressable
                                        onPress={() => setShowDetails((value) => !value)}
                                        style={[styles.toggleButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
                                    >
                                        <ThemedText type="smallBold" style={[styles.toggleButtonLabel, { color: theme.primary }]}>
                                            {showDetails ? 'عدم نمایش' : 'نمایش جزئیات'}
                                        </ThemedText>
                                        <MaterialCommunityIcons name={showDetails ? 'chevron-up' : 'chevron-down'} size={18} color={theme.primary} />
                                    </Pressable>
                                </View>
                                {showDetails ? <View style={styles.breakdownGrid}>{result.breakdown.map((item) => <View key={`${item.year}-${item.periodIndex}`} style={[styles.breakdownItemCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                    <View style={[styles.breakdownItemHeaderRow, { borderBottomColor: theme.border }]}>
                                        <ThemedText type="smallBold" style={[styles.breakdownItemTitle, { color: theme.text }]}>سال {toPersianDigits(item.year)}، دوره {toPersianDigits(item.periodIndex)}</ThemedText>
                                    </View>
                                    <View style={styles.breakdownDetailGrid}>
                                        <View style={[styles.detailBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                                            <ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>بازهٔ زمانی دوره</ThemedText>
                                            <ThemedText type="smallBold" style={[styles.detailValue, { color: theme.text }]}>{formatParsedDate(item.startDate)} تا {formatParsedDate(item.endDate)}</ThemedText>
                                        </View>
                                        <View style={[styles.detailBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                                            <ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>تعداد روزهای دوره</ThemedText>
                                            <ThemedText type="smallBold" style={[styles.detailValue, { color: theme.text }]}>{toPersianDigits(item.daysCovered)} روز</ThemedText>
                                        </View>
                                        <View style={[styles.detailBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                                            <ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>مزد پایه روزانه</ThemedText>
                                            <ThemedText type="smallBold" style={[styles.detailValue, { color: theme.text }]}>{formatCurrency(item.dailyMinimumWage)}</ThemedText>
                                        </View>
                                        <View style={[styles.detailBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                                            <ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>سنوات استحقاقی روزانه</ThemedText>
                                            <ThemedText type="smallBold" style={[styles.detailValue, { color: theme.text }]}>{formatCurrency(item.dailySeniority)}</ThemedText>
                                        </View>
                                        <View style={[styles.detailBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                                            <ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>حق مسکن روزانه</ThemedText>
                                            <ThemedText type="smallBold" style={[styles.detailValue, { color: theme.text }]}>{formatCurrency(item.dailyHousingAllowance)}</ThemedText>
                                        </View>
                                        <View style={[styles.detailBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                                            <ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>حق عائله‌مندی روزانه</ThemedText>
                                            <ThemedText type="smallBold" style={[styles.detailValue, { color: theme.text }]}>{formatCurrency(item.dailyChildAllowance)}</ThemedText>
                                        </View>
                                        <View style={[styles.detailBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                                            <ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>بن کارگری روزانه</ThemedText>
                                            <ThemedText type="smallBold" style={[styles.detailValue, { color: theme.text }]}>{formatCurrency(item.dailyMonthlyAllowance)}</ThemedText>
                                        </View>
                                        <View style={[styles.detailBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                                            <ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>حق تأهل روزانه</ThemedText>
                                            <ThemedText type="smallBold" style={[styles.detailValue, { color: theme.text }]}>{formatCurrency(item.dailyMaritalAllowance)}</ThemedText>
                                        </View>
                                        <View style={[styles.detailBox, { backgroundColor: theme.primaryContainer, borderColor: theme.primary }]}>
                                            <ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>مزد روزانه مشمول</ThemedText>
                                            <ThemedText type="smallBold" style={[styles.detailValue, { color: theme.primary }]}>{formatCurrency(item.dailyWage)}</ThemedText>
                                        </View>
                                        <View style={[styles.detailBox, { backgroundColor: theme.primaryContainer, borderColor: theme.primary }]}>
                                            <ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>مبلغ استحقاق این دوره</ThemedText>
                                            <ThemedText type="smallBold" style={[styles.detailValue, { color: theme.primary }]}>{formatCurrency(item.amount)}</ThemedText>
                                        </View>
                                    </View>
                                </View>)}</View> : null}
                            </Card.Content></Card> : null}
                        </Card.Content>
                    </Card>
                </SafeAreaView>
            </ScrollView>
            <PersianDatePickerModal visible={pickerTarget !== null} value={pickerTarget ? getDateValue(pickerTarget) : suspensionStart} title="انتخاب تاریخ" onClose={() => setPickerTarget(null)} onSelect={handleDateSelect} availableYears={availableYears} />
            <Snackbar visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)} duration={3000} style={{ backgroundColor: theme.error, borderRadius: Radius.md }} action={{ label: 'بستن', onPress: () => setSnackbarVisible(false) }}><ThemedText type="small" style={{ color: theme.surface }}>{snackbarMessage}</ThemedText></Snackbar>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { flexGrow: 1 },
    safeArea: { flex: 1, justifyContent: 'center', paddingHorizontal: Spacing.four },
    card: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
    cardContent: { gap: Spacing.three, paddingVertical: Spacing.four, paddingHorizontal: Spacing.three },
    headerText: { gap: Spacing.one },
    pageTitle: { fontSize: 16, lineHeight: 22, fontFamily: 'Vazirmatn-Bold' },
    pageDescription: { fontSize: 12, lineHeight: 20 },
    formulaBox: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, padding: Spacing.two, gap: Spacing.one },
    formulaText: { fontSize: 12, lineHeight: 21 },
    dateGrid: { gap: Spacing.two },
    metricBox: { borderRadius: 12, padding: Spacing.two, gap: Spacing.one },
    dateField: { width: '100%' },
    sectionLabel: { fontSize: 11 },
    dateInput: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.two, paddingVertical: Spacing.two, borderRadius: 8, borderWidth: StyleSheet.hairlineWidth },
    optionsRow: { flexDirection: 'row', gap: Spacing.two },
    optionButton: { flex: 1, alignItems: 'center', paddingVertical: Spacing.two, borderRadius: 8, borderWidth: StyleSheet.hairlineWidth },
    actionsGroup: { flexDirection: 'row', gap: Spacing.two },
    actionButton: { flex: 1, borderRadius: 10 },
    actionLabel: { fontFamily: 'Vazirmatn-Bold', fontSize: 12 },
    resultCard: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
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
    breakdownItemHeaderRow: { paddingTop: 2, paddingBottom: 2, marginBottom: 2, borderBottomWidth: StyleSheet.hairlineWidth },
    breakdownItemTitle: { fontSize: 12, fontFamily: 'Vazirmatn-Bold' },
    breakdownDetailGrid: { gap: Spacing.one },
    detailBox: { alignItems: 'center', gap: Spacing.half, padding: Spacing.one, borderRadius: 8, borderWidth: 1 },
    detailLabel: { fontSize: 10 },
    detailValue: { fontSize: 12 },
});