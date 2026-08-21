import { MaterialCommunityIcons } from '@expo/vector-icons';
import { toJalaali } from 'jalaali-js';
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
    calculateUnusedLeaveWageFromPeriodData,
    parseDateInput,
    type SalaryPeriodBucket,
    type UnusedLeaveWageCalculationResult,
    type UnusedLeaveWageMaritalStatus,
} from '@/utils/salary-calculation';

type PickerTarget = 'start' | 'end';
const CHILDREN_OPTIONS = Array.from({ length: 12 }, (_, index) => index + 1);

export default function UnusedLeaveWageScreen() {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const currentJalaliDate = useMemo(() => {
        const today = new Date();
        return toJalaali(today.getFullYear(), today.getMonth() + 1, today.getDate());
    }, []);
    const currentPersianYear = currentJalaliDate.jy;
    const defaultStartDate = `${currentPersianYear}/01/01`;
    const defaultEndDate = `${currentPersianYear}/12/29`;

    const [startDate, setStartDate] = useState(defaultStartDate);
    const [endDate, setEndDate] = useState(defaultEndDate);
    const [maritalStatus, setMaritalStatus] = useState<UnusedLeaveWageMaritalStatus>('single');
    const [childrenCount, setChildrenCount] = useState(1);
    const [childrenMenuVisible, setChildrenMenuVisible] = useState(false);
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
                            monthly_housing_single: period.monthly_housing_single,
                            monthly_housing_married: period.monthly_housing_married,
                            monthly_single_allowance: period.monthly_single_allowance,
                            monthly_married_allowance: period.monthly_married_allowance,
                            child_allowance: period.child_allowance,
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
    const shouldShowMaritalStatus = useMemo(() => {
        const parsedStart = parseDateInput(startDate);
        const parsedEnd = parseDateInput(endDate);

        if (!parsedStart || !parsedEnd || periodBuckets.length === 0) {
            return false;
        }

        return periodBuckets
            .filter((bucket) => bucket.year >= parsedStart.year && bucket.year <= parsedEnd.year)
            .some((bucket) => bucket.periods.some((period) => (
                (period.monthly_housing_single != null &&
                    period.monthly_housing_married != null &&
                    period.monthly_housing_single !== period.monthly_housing_married) ||
                (period.monthly_single_allowance != null &&
                    period.monthly_married_allowance != null &&
                    period.monthly_single_allowance !== period.monthly_married_allowance)
            )));
    }, [endDate, periodBuckets, startDate]);

    const handleDateSelect = (value: string) => {
        if (pickerTarget === 'start') {
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
        if (!start || !end) {
            setResult(null);
            setSnackbarMessage('تاریخ واردشده معتبر نیست.');
            setSnackbarVisible(true);
            return;
        }
        const calculation = calculateUnusedLeaveWageFromPeriodData(start, end, periodBuckets, maritalStatus, childrenCount);
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
        setMaritalStatus('single');
        setChildrenCount(1);
        setChildrenMenuVisible(false);
        setResult(null);
        setShowDetails(false);
    };

    const components = result ? [
        ['حداقل مزد روزانه', result.dailyMinimumWage],
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
                                    <ThemedText type="bodyBold" style={[styles.pageTitle, { color: theme.text }]}>مزد مرخصی استفاده نشده</ThemedText>
                                    <ThemedText type="small" style={[styles.pageDescription, { color: theme.textSecondary }]}>مزد مرخصی بر اساس روزهای مرخصی استفاده نشده و آخرین ماه کارکرد محاسبه می‌شود.</ThemedText>
                                </View>
                            </View>
                            <View style={[styles.formulaBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                                <ThemedText type="small" style={[styles.formulaLabel, { color: theme.textSecondary }]}>فرمول محاسبه</ThemedText>
                                <ThemedText type="small" style={[styles.formulaValue, { color: theme.text }]}>روزهای مرخصی استفاده نشده × (حداقل مزد روزانه + حق مسکن/۳۰ + حق عائله‌مندی/۳۰ + بن کارگری/۳۰ + حق تأهل/۳۰)</ThemedText>
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
                            {shouldShowMaritalStatus ? (
                                <View style={[styles.metricBox, { backgroundColor: theme.surfaceVariant }]}>
                                    <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary }]}>وضعیت تأهل</ThemedText>
                                    <View style={styles.statusRow}>
                                        {([['single', 'مجرد'], ['married', 'متأهل']] as const).map(([value, label]) => {
                                            const selected = maritalStatus === value;
                                            return <Pressable key={value} onPress={() => setMaritalStatus(value)} style={[styles.statusButton, { backgroundColor: selected ? theme.primary : theme.surface, borderColor: selected ? theme.primary : theme.border }]}><ThemedText type="smallBold" style={{ color: selected ? theme.surface : theme.text }}>{label}</ThemedText></Pressable>;
                                        })}
                                    </View>
                                </View>
                            ) : null}
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
                                <View style={[styles.summaryBox, { backgroundColor: theme.surface, borderColor: theme.border }]}><ThemedText type="small" style={[styles.summaryLabel, { color: theme.textSecondary }]}>مبلغ مزد مرخصی استفاده نشده</ThemedText><ThemedText type="largeTitle" style={[styles.amountValue, { color: theme.primary }]}>{toPersianDigits(formatCurrency(result.unusedLeaveDays * result.dailyWage))}</ThemedText></View>
                                <View style={styles.breakdownHeader}><ThemedText type="smallBold" style={[styles.breakdownSectionTitle, { color: theme.text }]}>جزئیات محاسبه</ThemedText><Pressable onPress={() => setShowDetails((value) => !value)} style={[styles.toggleButton, { backgroundColor: theme.surface, borderColor: theme.border }]}><ThemedText type="smallBold" style={[styles.toggleButtonLabel, { color: theme.primary }]}>{showDetails ? 'عدم نمایش' : 'نمایش جزئیات'}</ThemedText><MaterialCommunityIcons name={showDetails ? 'chevron-up' : 'chevron-down'} size={18} color={theme.primary} /></Pressable></View>
                                {showDetails ? <View style={styles.breakdownGrid}><View style={[styles.breakdownItemCard, { backgroundColor: theme.surface, borderColor: theme.border }]}><View style={styles.breakdownItemHeaderRow}><ThemedText type="smallBold" style={[styles.breakdownItemTitle, { color: theme.text }]}>جزئیات مزد روزانه</ThemedText></View><View style={styles.breakdownDetailGrid}><View style={[styles.detailBox, { backgroundColor: theme.primaryContainer, borderColor: theme.primary }]}><ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>روزهای مرخصی استفاده نشده</ThemedText><ThemedText type="smallBold" style={[styles.detailValue, { color: theme.primary }]}>{formatNumber(result.unusedLeaveDays)} روز</ThemedText></View><ThemedText type="small" style={[styles.detailDescription, { color: theme.textSecondary }]}>آخرین ماه کارکرد: سال {toPersianDigits(result.year)}، دوره {toPersianDigits(result.periodIndex)}</ThemedText>{components.map(([label, value]) => <View key={label} style={[styles.detailBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}><ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>{label}</ThemedText><ThemedText type="smallBold" style={[styles.detailValue, { color: theme.text }]}>{formatCurrency(value)}</ThemedText></View>)}<View style={[styles.detailBox, { backgroundColor: theme.primaryContainer, borderColor: theme.primary }]}><ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>مزد روزانه مشمول مرخصی</ThemedText><ThemedText type="smallBold" style={[styles.detailValue, { color: theme.primary }]}>{formatCurrency(result.dailyWage)}</ThemedText></View></View></View></View> : null}
                            </Card.Content></Card> : null}
                        </Card.Content>
                    </Card>
                </SafeAreaView>
            </ScrollView>
            <PersianDatePickerModal visible={pickerTarget !== null} value={pickerTarget === 'start' ? startDate : endDate} title={pickerTarget === 'start' ? 'انتخاب تاریخ شروع' : 'انتخاب تاریخ پایان'} onClose={() => setPickerTarget(null)} onSelect={handleDateSelect} availableYears={availableYears} />
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
    statusRow: { flexDirection: 'row', gap: Spacing.two },
    statusButton: { flex: 1, alignItems: 'center', paddingVertical: Spacing.two, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth },
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
