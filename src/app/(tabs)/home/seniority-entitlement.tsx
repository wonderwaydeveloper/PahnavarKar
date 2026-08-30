import { MaterialCommunityIcons } from '@expo/vector-icons';
import { jalaaliMonthLength, toJalaali } from 'jalaali-js';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Snackbar } from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { PersianDatePickerModal } from '@/components/persian-date-picker-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { fetchPeriodsByYearId, fetchYears, seedFromJsonAsset } from '@/database';
import { useTheme } from '@/hooks/use-theme';
import {
    calculateSeniorityEntitlementFromPeriodData,
    parseDateInput,
    type ParsedDateInput,
    type SalaryPeriodBucket,
    type SeniorityEntitlementBreakdownItem,
    type SeniorityEntitlementCalculationResult,
    type SeniorityEntitlementSettlementStatus,
} from '@/utils/salary-calculation';

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
type PickerTarget = 'start' | 'end' | null;

function toPersianDigits(value: string | number): string {
    return String(value).replace(/\d/g, (digit) => PERSIAN_DIGITS[Number(digit)]);
}

function formatCurrency(value: number): string {
    return `${new Intl.NumberFormat('fa-IR').format(Math.round(value))} ریال`;
}

function formatDate(date: ParsedDateInput): string {
    return [date.year, date.month, date.day]
        .map((part, index) => toPersianDigits(index === 0 ? part : String(part).padStart(2, '0')))
        .join('/');
}

function formatInputDate(value: string): string {
    const date = parseDateInput(value);
    return date ? formatDate(date) : '';
}

function compareDates(left: string, right: string): number {
    const leftDate = parseDateInput(left);
    const rightDate = parseDateInput(right);
    if (!leftDate || !rightDate) return 0;

    const leftValue = leftDate.year * 10000 + leftDate.month * 100 + leftDate.day;
    const rightValue = rightDate.year * 10000 + rightDate.month * 100 + rightDate.day;
    return leftValue - rightValue;
}

function DetailValue({ label, value }: { label: string; value: string }) {
    const theme = useTheme();

    return (
        <View style={[styles.detailBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
            <ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>{label}</ThemedText>
            <ThemedText type="smallBold" style={[styles.detailValue, { color: theme.text }]}>{value}</ThemedText>
        </View>
    );
}

function BreakdownItem({ item }: { item: SeniorityEntitlementBreakdownItem }) {
    const theme = useTheme();

    return (
        <View style={[styles.breakdownItem, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.breakdownHeader, { borderBottomColor: theme.border }]}>
                <ThemedText type="smallBold" style={[styles.breakdownTitle, { color: theme.text }]}>
                    سال {toPersianDigits(item.year)}، دوره {toPersianDigits(item.periodIndex)}
                </ThemedText>
                <ThemedText type="small" style={[styles.breakdownSubtitle, { color: theme.textSecondary }]}>
                    از {formatDate(item.eligibleFrom)} تا {formatDate(item.eligibleTo)}
                </ThemedText>
            </View>
            <View style={styles.detailGrid}>
                <DetailValue label="از تاریخ" value={formatDate(item.eligibleFrom)} />
                <DetailValue label="تا تاریخ" value={formatDate(item.eligibleTo)} />
                <DetailValue label="تعداد روزهای این دوره" value={`${toPersianDigits(item.daysCovered)} روز`} />
                <DetailValue label="پایه سنوات جاری" value={formatCurrency(item.seniorityBase)} />
                <DetailValue label="پایه سنوات استحقاقی روزانه" value={formatCurrency(item.dailyEntitlement)} />
                <DetailValue label="درصد افزایش" value={item.percentIncrease === null ? '-' : toPersianDigits(item.percentIncrease)} />
                <View style={[styles.detailBox, { backgroundColor: theme.primaryContainer, borderColor: theme.primary }]}>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>مبلغ استحقاق این دوره</ThemedText>
                    <ThemedText type="smallBold" style={{ color: theme.primary }}>{formatCurrency(item.amount)}</ThemedText>
                </View>
            </View>
        </View>
    );
}

export default function SeniorityEntitlementScreen() {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const currentDate = useMemo(() => {
        const today = new Date();
        return toJalaali(today.getFullYear(), today.getMonth() + 1, today.getDate());
    }, []);
    const defaultStartDate = `${currentDate.jy}/01/01`;
    const defaultEndDate = `${currentDate.jy}/12/${jalaaliMonthLength(currentDate.jy, 12)}`;

    const [startDate, setStartDate] = useState(defaultStartDate);
    const [endDate, setEndDate] = useState(defaultEndDate);
    const [settlementStatus, setSettlementStatus] = useState<SeniorityEntitlementSettlementStatus>('unsettled');
    const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);
    const [availableYears, setAvailableYears] = useState<number[]>([]);
    const [periodBuckets, setPeriodBuckets] = useState<SalaryPeriodBucket[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [result, setResult] = useState<SeniorityEntitlementCalculationResult | null>(null);
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
        return () => {
            isMounted = false;
        };
    }, []);

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
        const parsedStart = parseDateInput(startDate);
        const parsedEnd = parseDateInput(endDate);

        if (!parsedStart || !parsedEnd || compareDates(startDate, endDate) > 0) {
            setResult(null);
            setSnackbarMessage('تاریخ واردشده معتبر نیست یا تاریخ شروع بعد از تاریخ پایان است.');
            setSnackbarVisible(true);
            return;
        }

        const missingYears = [];
        for (let year = parsedStart.year; year <= parsedEnd.year; year += 1) {
            const bucket = periodBuckets.find((item) => item.year === year);
            if (!bucket || bucket.periods.length === 0) {
                missingYears.push(year);
            }
        }

        if (missingYears.length > 0) {
            setResult(null);
            setSnackbarMessage(`برای سال‌های ${missingYears.map((year) => toPersianDigits(year)).join('، ')} داده‌ای برای محاسبه موجود نیست.`);
            setSnackbarVisible(true);
            return;
        }

        const resolveGenericSeniorityBase = (bucket: SalaryPeriodBucket, period: SalaryPeriodBucket['periods'][number]) =>
            Number(period.seniority_base ?? 0);

        const calculation = calculateSeniorityEntitlementFromPeriodData(
            parsedStart,
            parsedEnd,
            periodBuckets,
            settlementStatus,
            resolveGenericSeniorityBase,
        );
        if (calculation.breakdown.length === 0 || calculation.breakdown.every((item) => item.amount <= 0)) {
            setResult(null);
            setSnackbarMessage('هنوز پایه سنوات استحقاقی ایجاد نشده است');
            setSnackbarVisible(true);
            return;
        }

        setResult(calculation);
        setShowDetails(false);
    };

    const handleReset = () => {
        setStartDate(defaultStartDate);
        setEndDate(defaultEndDate);
        setSettlementStatus('unsettled');
        setResult(null);
        setShowDetails(false);
    };

    const parsedStartDate = parseDateInput(startDate);
    const showSettlementStatus = parsedStartDate !== null && parsedStartDate.year < 1392;
    const lastDailyEntitlement = result?.breakdown.at(-1)?.dailyEntitlement ?? 0;

    return (
        <ThemedView style={styles.container}>
            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + Spacing.three, paddingBottom: insets.bottom + Spacing.four }]}
                showsVerticalScrollIndicator={false}
            >
                <SafeAreaView style={styles.safeArea}>
                    <Card elevation={1} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <Card.Content style={styles.cardContent}>
                            <View style={styles.headerText}>
                                <ThemedText type="bodyBold" style={[styles.pageTitle, { color: theme.text }]}>محاسبه پایه سنوات استحقاقی</ThemedText>
                                <ThemedText type="small" style={[styles.pageDescription, { color: theme.textSecondary }]}>محاسبه پایه سنوات استحقاقی براساس درصد افزایش سایر سطوح مزدی و سابقه کار کارگر</ThemedText>
                            </View>

                            <View style={[styles.formulaBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                                <ThemedText type="small" style={[styles.formulaLabel, { color: theme.textSecondary }]}>فرمول محاسبه</ThemedText>
                                <ThemedText type="small" style={[styles.formulaValue, { color: theme.text }]}>
                                    سال اول: صفر | اولین سالگرد: پایه سنوات جاری | قبل از سالگرد: درصد افزایش × مبلغ قبلی | بعد از سالگرد: مبلغ قبلی + پایه سنوات جاری
                                </ThemedText>
                            </View>

                            <View style={styles.metricsRow}>
                                {(['start', 'end'] as const).map((target) => (
                                    <View key={target} style={[styles.metricBox, { backgroundColor: theme.surfaceVariant }]}>
                                        <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary }]}>{target === 'start' ? 'تاریخ استخدام در کارگاه' : 'تا تاریخ'}</ThemedText>
                                        <Pressable onPress={() => setPickerTarget(target)} style={[styles.dateInput, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                            <ThemedText type="smallBold" style={{ color: theme.text }}>{formatInputDate(target === 'start' ? startDate : endDate)}</ThemedText>
                                            <MaterialCommunityIcons name="calendar-month-outline" size={18} color={theme.primary} />
                                        </Pressable>
                                    </View>
                                ))}
                            </View>

                            {showSettlementStatus ? (
                                <View style={[styles.metricBox, { backgroundColor: theme.surfaceVariant }]}>
                                    <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary }]}>وضعیت تصفیه حساب در سال ۱۳۹۱</ThemedText>
                                    <View style={styles.statusRow}>
                                        {([['unsettled', 'تصفیه حساب نکرده'], ['settled', 'تصفیه حساب کرده']] as const).map(([value, label]) => (
                                            <Pressable
                                                key={value}
                                                onPress={() => setSettlementStatus(value)}
                                                style={[styles.statusButton, { backgroundColor: settlementStatus === value ? theme.primary : theme.surface, borderColor: settlementStatus === value ? theme.primary : theme.border }]}
                                            >
                                                <ThemedText type="smallBold" style={{ color: settlementStatus === value ? theme.surface : theme.text }}>{label}</ThemedText>
                                            </Pressable>
                                        ))}
                                    </View>
                                </View>
                            ) : null}

                            <View style={styles.actionsGroup}>
                                <Button mode="contained" onPress={handleCalculate} icon="briefcase-clock" buttonColor={theme.primary} textColor={theme.surface} style={styles.actionButton} labelStyle={styles.actionLabel} loading={isLoadingData} disabled={isLoadingData}>محاسبه</Button>
                                {result ? <Button mode="outlined" onPress={handleReset} icon="refresh" textColor={theme.primary} style={styles.actionButton} labelStyle={styles.actionLabel}>بازنشانی</Button> : null}
                            </View>

                            {result ? (
                                <Card style={[styles.resultCard, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                                    <Card.Content style={styles.resultContent}>
                                        <View style={styles.summaryBoxHeader}>
                                            <View style={[styles.summaryBoxContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                                <ThemedText type="small" style={[styles.summaryLabel, { color: theme.textSecondary }]}>مبلغ نهایی پایه سنوات استحقاقی</ThemedText>
                                                <ThemedText type="largeTitle" style={[styles.amountValue, { color: theme.primary }]}>{formatCurrency(result.totalAmount)}</ThemedText>
                                                <View style={[styles.summaryDivider, { backgroundColor: theme.border }]} />
                                                <ThemedText type="small" style={[styles.lastDailyEntitlementLabel, { color: theme.textSecondary }]}>پایه سنوات استحقاقی روزانه آخرین دوره</ThemedText>
                                                <ThemedText type="smallBold" style={[styles.lastDailyEntitlementValue, { color: theme.text }]}>{formatCurrency(lastDailyEntitlement)}</ThemedText>
                                            </View>
                                        </View>
                                        <View style={styles.breakdownHeaderRow}>
                                            <ThemedText type="smallBold" style={{ color: theme.text }}>جزئیات دوره‌ها</ThemedText>
                                            <Pressable
                                                onPress={() => setShowDetails((visible) => !visible)}
                                                style={[styles.detailsButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
                                            >
                                                <ThemedText type="smallBold" style={[styles.detailsButtonLabel, { color: theme.primary }]}>
                                                    {showDetails ? 'عدم نمایش' : 'نمایش جزئیات'}
                                                </ThemedText>
                                                <MaterialCommunityIcons name={showDetails ? 'chevron-up' : 'chevron-down'} size={18} color={theme.primary} />
                                            </Pressable>
                                        </View>
                                        {showDetails ? (
                                            <View style={styles.breakdownList}>
                                                {result.breakdown.map((item, index) => (
                                                    <BreakdownItem key={`${item.year}-${item.periodIndex}-${index}`} item={item} />
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
                visible={pickerTarget !== null}
                value={pickerTarget === 'start' ? startDate : endDate}
                title={pickerTarget === 'start' ? 'انتخاب تاریخ شروع' : 'انتخاب تاریخ پایان'}
                onClose={() => setPickerTarget(null)}
                onSelect={handleDateSelect}
                availableYears={availableYears}
            />
            <Snackbar
                visible={snackbarVisible}
                onDismiss={() => setSnackbarVisible(false)}
                duration={3000}
                style={{ backgroundColor: theme.error, borderRadius: Radius.md }}
                action={{ label: 'بستن', onPress: () => setSnackbarVisible(false) }}
            >
                <ThemedText type="small" style={{ color: theme.surface }}>{snackbarMessage}</ThemedText>
            </Snackbar>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { flexGrow: 1 },
    safeArea: { flex: 1, justifyContent: 'center', paddingHorizontal: Spacing.four },
    card: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
    cardContent: { gap: Spacing.three, paddingVertical: Spacing.four, paddingHorizontal: Spacing.three },
    headerText: { gap: Spacing.one },
    pageTitle: { fontSize: 16, lineHeight: 22, fontFamily: 'Vazirmatn-Bold' },
    pageDescription: { fontSize: 12, lineHeight: 20 },
    sectionLabel: { fontSize: 11, fontWeight: '500' },
    formulaLabel: { fontSize: 11, fontWeight: '500' },
    formulaValue: { fontSize: 13, lineHeight: 18 },
    formulaBox: { borderRadius: 12, borderWidth: 1, padding: Spacing.two, gap: Spacing.one },
    metricsRow: { flexDirection: 'row', alignItems: 'stretch', gap: Spacing.two },
    metricBox: { flex: 1, borderRadius: 12, padding: Spacing.two, gap: Spacing.one },
    dateInput: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.two, paddingVertical: Spacing.two, borderRadius: 8, borderWidth: 1, minHeight: 40 },
    statusRow: { flexDirection: 'row', gap: Spacing.two },
    statusButton: { flex: 1, alignItems: 'center', paddingVertical: Spacing.two, borderRadius: 8, borderWidth: 1 },
    actionsGroup: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.one },
    actionButton: { flex: 1, borderRadius: 12 },
    actionLabel: { fontFamily: 'Vazirmatn-Bold', fontSize: 12 },
    resultCard: { borderRadius: 12, borderWidth: 1, marginTop: Spacing.two, overflow: 'hidden' },
    resultContent: { gap: Spacing.two, paddingVertical: Spacing.three, paddingHorizontal: Spacing.two },
    summaryBoxHeader: { alignItems: 'center', marginBottom: Spacing.one },
    summaryBoxContent: { width: '100%', alignItems: 'center', gap: Spacing.one, padding: Spacing.two, borderRadius: 12, borderWidth: 1 },
    summaryLabel: { fontSize: 11 },
    amountValue: { fontSize: 18 },
    summaryDivider: { width: '80%', height: StyleSheet.hairlineWidth, marginVertical: Spacing.one },
    lastDailyEntitlementLabel: { fontSize: 11 },
    lastDailyEntitlementValue: { fontSize: 12 },
    breakdownHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.one, paddingVertical: Spacing.one, gap: Spacing.one },
    detailsButton: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: Spacing.two, paddingVertical: Spacing.one },
    detailsButtonLabel: { fontSize: 11 },
    breakdownList: { gap: Spacing.two },
    breakdownItem: { borderRadius: 12, borderWidth: 1, padding: Spacing.two, gap: Spacing.one },
    breakdownHeader: { paddingTop: 2, paddingBottom: 2, marginBottom: 2, borderBottomWidth: StyleSheet.hairlineWidth },
    breakdownTitle: { fontSize: 13, lineHeight: 20, fontFamily: 'Vazirmatn-Bold' },
    breakdownSubtitle: { fontSize: 11, lineHeight: 18 },
    detailGrid: { gap: Spacing.one },
    detailBox: { alignItems: 'center', gap: Spacing.half, padding: Spacing.one, borderRadius: 8, borderWidth: 1, borderColor: 'transparent' },
    detailLabel: { color: '#708797', fontSize: 10 },
    detailValue: { color: '#102A39', fontSize: 12 },
});
