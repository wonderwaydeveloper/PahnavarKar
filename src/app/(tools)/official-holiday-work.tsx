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
import { fetchOfficialHolidaysBetweenDates, fetchPeriodsByYearId, fetchYears, seedFromJsonAsset } from '@/database';
import { useTheme } from '@/hooks/use-theme';
import {
    calculateOfficialHolidayWorkFromPeriodData,
    parseDateInput,
    type OfficialHolidayWorkCalculationResult,
    type SalaryPeriodBucket,
} from '@/utils/salary-calculation';

type PickerTarget = 'start' | 'end';

export default function OfficialHolidayWorkScreen() {
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
    const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);
    const [periodBuckets, setPeriodBuckets] = useState<SalaryPeriodBucket[]>([]);
    const [officialHolidayDates, setOfficialHolidayDates] = useState<string[]>([]);
    const [availableYears, setAvailableYears] = useState<number[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [result, setResult] = useState<OfficialHolidayWorkCalculationResult | null>(null);
    const [showDetails, setShowDetails] = useState(false);
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
                            overtime_per_hour: period.overtime_per_hour,
                        })),
                    });
                }

                const holidays = await fetchOfficialHolidaysBetweenDates('1369/01/01', '1405/12/29');

                if (isMounted) {
                    setPeriodBuckets(buckets);
                    setOfficialHolidayDates(holidays.map((holiday) => holiday.holiday_date));
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

    const toPersianDigits = (value: string | number) =>
        String(value).replace(/\d/g, (digit) => persianDigits[Number(digit)]);

    const formatCurrency = (value: number) =>
        `${new Intl.NumberFormat('fa-IR').format(value)} ریال`;

    const formatDate = (value: string) => {
        const parsed = parseDateInput(value);
        if (!parsed) {
            return '';
        }

        return `${toPersianDigits(parsed.year)}/${toPersianDigits(String(parsed.month).padStart(2, '0'))}/${toPersianDigits(String(parsed.day).padStart(2, '0'))}`;
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
            if (compareDates(value, endDate) > 0) {
                setEndDate(value);
            }
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
            setSnackbarMessage('بازهٔ زمانی واردشده معتبر نیست.');
            setSnackbarVisible(true);
            return;
        }

        const yearsInRange = Array.from({ length: parsedEnd.year - parsedStart.year + 1 }, (_, index) => parsedStart.year + index);
        const missingYears = yearsInRange.filter((year) => !periodBuckets.some((bucket) => bucket.year === year));

        if (missingYears.length > 0) {
            setResult(null);
            setSnackbarMessage(`برای سال‌های ${missingYears.map((year) => toPersianDigits(year)).join('، ')} داده‌ای موجود نیست.`);
            setSnackbarVisible(true);
            return;
        }

        const calculation = calculateOfficialHolidayWorkFromPeriodData(parsedStart, parsedEnd, periodBuckets, officialHolidayDates);

        if (calculation.breakdown.length === 0) {
            setResult(null);
            setSnackbarMessage('برای بازهٔ انتخاب‌شده تعطیل کاری استحقاقی ثبت‌شده‌ای وجود ندارد.');
            setSnackbarVisible(true);
            return;
        }

        setResult(calculation);
        setShowDetails(false);
    };

    const handleReset = () => {
        setStartDate(defaultStartDate);
        setEndDate(defaultEndDate);
        setResult(null);
        setShowDetails(false);
    };

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
                            <View style={styles.headerText}>
                                <ThemedText type="bodyBold" style={[styles.pageTitle, { color: theme.text }]}>
                                    مبلغ تعطیل کاری استحقاقی
                                </ThemedText>
                                <ThemedText type="small" style={[styles.pageDescription, { color: theme.textSecondary }]}>
                                    محاسبه مبلغ تعطیل‌کاری استحقاقی بر اساس تعداد روزهای تعطیل رسمی و مبلغ یک ساعت اضافه کاری همان سال
                                </ThemedText>
                            </View>

                            <View style={[styles.formulaBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                                <ThemedText type="smallBold" style={[styles.formulaLabel, { color: theme.textSecondary }]}>
                                    فرمول محاسبه
                                </ThemedText>
                                <ThemedText type="small" style={[styles.formulaText, { color: theme.text }]}>
                                    تعداد روزهای تعطیل رسمی در بازهٔ زمانی انتخاب‌شده × ۷٫۳۳ × مبلغ یک ساعت اضافه کاری همان سال
                                </ThemedText>
                            </View>

                            <View style={styles.metricsRow}>
                                {(['start', 'end'] as const).map((target) => (
                                    <View key={target} style={[styles.metricBox, { backgroundColor: theme.surfaceVariant }]}>
                                        <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                                            {target === 'start' ? 'از تاریخ' : 'تا تاریخ'}
                                        </ThemedText>
                                        <Pressable onPress={() => setPickerTarget(target)} style={[styles.dateInput, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                            <ThemedText type="smallBold" style={{ color: theme.text }}>
                                                {formatDate(target === 'start' ? startDate : endDate)}
                                            </ThemedText>
                                            <MaterialCommunityIcons name="calendar-month-outline" size={18} color={theme.primary} />
                                        </Pressable>
                                    </View>
                                ))}
                            </View>

                            <View style={styles.actionsGroup}>
                                <Button
                                    mode="contained"
                                    onPress={handleCalculate}
                                    icon="calendar-star"
                                    buttonColor={theme.primary}
                                    textColor={theme.surface}
                                    style={styles.actionButton}
                                    labelStyle={styles.actionLabel}
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
                                        textColor={theme.primary}
                                        style={styles.actionButton}
                                        labelStyle={styles.actionLabel}
                                    >
                                        بازنشانی
                                    </Button>
                                ) : null}
                            </View>

                            {result ? (
                                <Card style={[styles.resultCard, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                                    <Card.Content style={styles.resultContent}>
                                        <View style={[styles.summaryBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                            <ThemedText type="small" style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                                                مبلغ نهایی تعطیل کاری استحقاقی
                                            </ThemedText>
                                            <ThemedText type="largeTitle" style={[styles.amountValue, { color: theme.primary }]}>
                                                {toPersianDigits(formatCurrency(result.totalAmount))}
                                            </ThemedText>
                                        </View>

                                        <View style={styles.breakdownHeader}>
                                            <ThemedText type="smallBold" style={[styles.breakdownSectionTitle, { color: theme.text }]}>
                                                جزئیات دوره‌ها
                                            </ThemedText>
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

                                        {showDetails ? (
                                            <View style={styles.breakdownGrid}>
                                                {result.breakdown.map((item) => (
                                                    <View
                                                        key={`${item.year}-${item.periodIndex}`}
                                                        style={[styles.breakdownItemCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                                                    >
                                                        <View style={[styles.breakdownItemHeaderRow, { borderBottomColor: theme.border }]}>
                                                            <ThemedText type="smallBold" style={[styles.breakdownItemTitle, { color: theme.text }]}>
                                                                سال {toPersianDigits(item.year)}، دوره {toPersianDigits(item.periodIndex)}
                                                            </ThemedText>
                                                        </View>

                                                        <View style={styles.detailGrid}>
                                                            <View style={[styles.detailBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                                                                <ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>تعداد روزهای تعطیل</ThemedText>
                                                                <ThemedText type="smallBold" style={[styles.detailValue, { color: theme.text }]}>
                                                                    {toPersianDigits(item.daysCovered)} روز
                                                                </ThemedText>
                                                            </View>
                                                            <View style={[styles.detailBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                                                                <ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>مبلغ هر ساعت</ThemedText>
                                                                <ThemedText type="smallBold" style={[styles.detailValue, { color: theme.text }]}>
                                                                    {toPersianDigits(formatCurrency(item.overtimeRate ?? 0))}
                                                                </ThemedText>
                                                            </View>
                                                            <View style={[styles.detailBox, { backgroundColor: theme.primaryContainer, borderColor: theme.primary }]}>
                                                                <ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>مبلغ نهایی</ThemedText>
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
    container: { flex: 1 },
    scrollContent: { flexGrow: 1 },
    safeArea: { flex: 1, justifyContent: 'center', paddingHorizontal: Spacing.four },
    card: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
    cardContent: { gap: Spacing.three, paddingVertical: Spacing.four, paddingHorizontal: Spacing.three },
    headerText: { gap: Spacing.one },
    pageTitle: { fontSize: 16, lineHeight: 22, fontFamily: 'Vazirmatn-Bold' },
    pageDescription: { fontSize: 12, lineHeight: 20 },
    formulaBox: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, padding: Spacing.two, gap: Spacing.one },
    formulaLabel: { fontSize: 11 },
    formulaText: { fontSize: 12, lineHeight: 21 },
    metricsRow: { flexDirection: 'row', gap: Spacing.two },
    metricBox: { flex: 1, borderRadius: 14, padding: Spacing.two, gap: Spacing.one },
    sectionLabel: { fontSize: 11 },
    dateInput: {
        minHeight: 42,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.two,
        paddingVertical: Spacing.two,
        borderRadius: 8,
        borderWidth: StyleSheet.hairlineWidth,
    },
    actionsGroup: { flexDirection: 'row', gap: Spacing.two },
    actionButton: { flex: 1, borderRadius: 10 },
    actionLabel: { fontFamily: 'Vazirmatn-Bold', fontSize: 12 },
    resultCard: { borderRadius: 12, borderWidth: 1, marginTop: Spacing.two, overflow: 'hidden' },
    resultContent: { gap: Spacing.two, paddingVertical: Spacing.three, paddingHorizontal: Spacing.two },
    summaryBox: {
        width: '100%',
        alignItems: 'center',
        gap: Spacing.one,
        padding: Spacing.two,
        borderRadius: 12,
        borderWidth: 1,
    },
    summaryLabel: { fontSize: 11 },
    amountValue: { fontSize: 18 },
    breakdownHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.one,
        paddingVertical: Spacing.one,
        gap: Spacing.one,
    },
    breakdownSectionTitle: { fontSize: 13, fontFamily: 'Vazirmatn-Bold' },
    toggleButtonLabel: { fontSize: 11 },
    toggleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.one,
        paddingHorizontal: Spacing.two,
        paddingVertical: Spacing.one,
        borderRadius: 12,
        borderWidth: StyleSheet.hairlineWidth,
    },
    breakdownGrid: { gap: Spacing.two },
    breakdownItemCard: { borderRadius: 12, borderWidth: 1, padding: Spacing.two, gap: Spacing.one },
    breakdownItemHeaderRow: { paddingTop: 2, paddingBottom: 2, marginBottom: 2, borderBottomWidth: StyleSheet.hairlineWidth },
    breakdownItemTitle: { fontSize: 12, fontFamily: 'Vazirmatn-Bold' },
    detailGrid: { gap: Spacing.one },
    detailBox: { alignItems: 'center', gap: Spacing.half, padding: Spacing.one, borderRadius: 8, borderWidth: 1 },
    detailLabel: { fontSize: 10 },
    detailValue: { fontSize: 12 },
});
