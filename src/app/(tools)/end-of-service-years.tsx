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
import { fetchJobGroups, fetchPeriodsByYearId, fetchSeniorityBaseByGroup, fetchYears, seedFromJsonAsset } from '@/database';
import { useTheme } from '@/hooks/use-theme';
import {
    calculateEndOfServiceYearsFromPeriodData,
    calculateEntitledSeniorityFromPeriodData,
    parseDateInput,
    type EndOfServiceYearsCalculationResult,
    type EntitledSeniorityWorkshopType,
    type SalaryPeriodBucket,
} from '@/utils/salary-calculation';

export default function EndOfServiceYearsScreen() {
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
    const [employmentDate, setEmploymentDate] = useState(defaultStartDate);
    const [pickerTarget, setPickerTarget] = useState<'start' | 'end' | 'employment' | null>(null);
    const [workshopType, setWorkshopType] = useState<EntitledSeniorityWorkshopType>('unclassified');
    const [settledThrough1391, setSettledThrough1391] = useState(false);
    const [jobGroups, setJobGroups] = useState<{ id: number; group_number: number; sort_order: number }[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
    const [groupMenuVisible, setGroupMenuVisible] = useState(false);
    const [pickerVisible, setPickerVisible] = useState(false);
    const [periodBuckets, setPeriodBuckets] = useState<SalaryPeriodBucket[]>([]);
    const [availableYears, setAvailableYears] = useState<number[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [result, setResult] = useState<EndOfServiceYearsCalculationResult | null>(null);
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

    const toPersianDigits = (value: string) =>
        value.replace(/\d/g, (digit) => persianDigits[Number(digit)]);

    const formatCurrency = (value: number) =>
        `${new Intl.NumberFormat('fa-IR').format(value)} ریال`;

    const formatNumber = (value: number) =>
        toPersianDigits(Number.isInteger(value) ? String(value) : value.toFixed(2));

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

    const canUseSettlementPath = (parseDateInput(employmentDate)?.year ?? 0) <= 1391;

    const handleDateSelect = (value: string) => {
        if (pickerTarget === 'employment') {
            setEmploymentDate(value);
            if (compareDates(value, endDate) > 0) {
                setEndDate(value);
            }
        } else if (pickerTarget === 'start') {
            setStartDate(value);

            if (endDate) {
                const comparison = compareDates(value, endDate);
                if (comparison > 0) {
                    setEndDate(value);
                }
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
        const employment = parseDateInput(employmentDate);

        if (!parsedStart || !parsedEnd || !employment || compareDates(employmentDate, endDate) > 0) {
            setResult(null);
            return;
        }

        if (parsedStart.year > parsedEnd.year ||
            (parsedStart.year === parsedEnd.year && parsedStart.month > parsedEnd.month) ||
            (parsedStart.year === parsedEnd.year && parsedStart.month === parsedEnd.month && parsedStart.day > parsedEnd.day)) {
            setResult(null);
            return;
        }

        if (periodBuckets.length === 0 || (workshopType === 'classified' && selectedGroup == null)) {
            setResult(null);
            return;
        }

        const seniority = calculateEntitledSeniorityFromPeriodData(
            employment,
            parsedEnd,
            periodBuckets,
            workshopType,
            selectedGroup ?? undefined,
            settledThrough1391,
        );
        const dailySeniorityByPeriod = Object.fromEntries(
            seniority.breakdown.map((item) => [`${item.year}:${item.periodIndex}`, item.entitlement]),
        );
        const calculation = calculateEndOfServiceYearsFromPeriodData(
            parsedStart,
            parsedEnd,
            periodBuckets,
            seniority.finalEntitlement,
            dailySeniorityByPeriod,
        );

        if (calculation.breakdown.length === 0) {
            setResult(null);
            return;
        }

        setResult(calculation);
    };

    const handleReset = () => {
        setEmploymentDate(defaultStartDate);
        setResult(null);
        setWorkshopType('unclassified');
        setSettledThrough1391(false);
        setSelectedGroup(jobGroups[0]?.group_number ?? null);
        setGroupMenuVisible(false);
    };

    const formattedResult = useMemo(() => {
        if (!result) {
            return '۰ ریال';
        }

        return toPersianDigits(formatCurrency(result.totalAmount));
    }, [result]);

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
                                        محاسبه سنوات پایان کار
                                    </ThemedText>
                                    <ThemedText type="small" style={[styles.pageDescription, { color: theme.textSecondary }]}>
                                        محاسبه سنوات پایان کار براساس ماده ۲۴ قانون کار
                                    </ThemedText>
                                </View>
                            </View>

                            <View style={[styles.formulaBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                                <ThemedText type="small" style={[styles.formulaLabel, { color: theme.textSecondary }]}>
                                    فرمول محاسبه
                                </ThemedText>
                                <ThemedText type="small" style={[styles.formulaValue, { color: theme.text }]}>
                                    تعداد کل ماه کارکرد × ۲٫۵ × (حداقل مزد روزانه مصوب شورای عالی کار در آخرین روز کارکرد + پایه سنوات استحقاقی کارگر در آخرین روز کارکرد)
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
                                <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary }]}>تاریخ شروع به کار در کارگاه</ThemedText>
                                <Pressable onPress={() => openPicker('employment')}>
                                    <View style={[styles.dateInput, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                        <ThemedText type="small" style={[styles.fieldValue, { color: theme.text }]}>{formatDisplayedDate(employmentDate)}</ThemedText>
                                        <MaterialCommunityIcons name="calendar-account-outline" size={18} color={theme.primary} />
                                    </View>
                                </Pressable>
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
                                    <Menu
                                        visible={groupMenuVisible}
                                        onDismiss={() => setGroupMenuVisible(false)}
                                        anchor={<Pressable onPress={() => setGroupMenuVisible(true)}><View style={[styles.dateInput, { backgroundColor: theme.surface, borderColor: theme.border }]}><ThemedText type="small" style={{ color: theme.text }}>{selectedGroup == null ? 'انتخاب گروه' : `گروه ${toPersianDigits(String(selectedGroup))}`}</ThemedText><MaterialCommunityIcons name="briefcase-outline" size={18} color={theme.primary} /></View></Pressable>}
                                    >
                                        {jobGroups.map((group) => <Menu.Item key={group.id} title={`گروه ${toPersianDigits(String(group.group_number))}`} onPress={() => { setSelectedGroup(group.group_number); setGroupMenuVisible(false); }} />)}
                                    </Menu>
                                </View>
                            ) : null}

                            <Pressable
                                onPress={() => canUseSettlementPath && setSettledThrough1391((value) => !value)}
                                style={[styles.checkRow, { backgroundColor: theme.surfaceVariant, borderColor: theme.border, opacity: canUseSettlementPath ? 1 : 0.55 }]}
                            >
                                <View style={styles.checkboxRow}>
                                    <MaterialCommunityIcons name={settledThrough1391 ? 'checkbox-marked' : 'checkbox-blank-outline'} size={22} color={settledThrough1391 ? theme.primary : theme.textSecondary} />
                                    <View style={styles.checkText}>
                                        <ThemedText type="smallBold" style={[styles.optionTitle, { color: theme.text }]}>تصفیه حساب تا پایان سال ۱۳۹۱ انجام شده است</ThemedText>
                                        <ThemedText type="small" style={[styles.optionDescription, { color: theme.textSecondary }]}>{canUseSettlementPath ? 'محاسبه سنوات از سال ۱۳۹۲ ادامه پیدا می‌کند.' : 'این گزینه برای استخدام‌های سال ۱۳۹۲ و بعد کاربرد ندارد.'}</ThemedText>
                                    </View>
                                </View>
                            </Pressable>

                            <View style={styles.actionsGroup}>
                                <Button
                                    mode="contained"
                                    onPress={handleCalculate}
                                    icon="briefcase-clock"
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
                                                    مبلغ کل سنوات پایان کار
                                                </ThemedText>
                                                <ThemedText type="largeTitle" style={[styles.amountValue, { color: theme.primary }]}>
                                                    {formattedResult}
                                                </ThemedText>
                                            </View>
                                        </View>

                                        <View style={styles.summaryDetails}>
                                            <View style={[styles.summaryDetailBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                                <ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>کل ماه معادل کارکرد</ThemedText>
                                                <ThemedText type="smallBold" style={[styles.detailValue, { color: theme.primary }]}>{formatNumber(result.totalMonthEquivalent)} ماه</ThemedText>
                                            </View>
                                            <View style={[styles.summaryDetailBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                                <ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>حداقل مزد روز آخر</ThemedText>
                                                <ThemedText type="smallBold" style={[styles.detailValue, { color: theme.text }]}>{toPersianDigits(formatCurrency(result.finalDailyMinimumWage))}</ThemedText>
                                            </View>
                                            <View style={[styles.summaryDetailBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                                <ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>پایه سنوات روز آخر</ThemedText>
                                                <ThemedText type="smallBold" style={[styles.detailValue, { color: theme.text }]}>{toPersianDigits(formatCurrency(result.finalDailySeniority))}</ThemedText>
                                            </View>
                                            <View style={[styles.summaryDetailBox, { backgroundColor: theme.primaryContainer, borderColor: theme.primary }]}>
                                                <ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>{workshopType === 'classified' ? 'مزد مبنا روزانه' : 'مزد ثابت روزانه'}</ThemedText>
                                                <ThemedText type="smallBold" style={[styles.detailValue, { color: theme.primary }]}>{toPersianDigits(formatCurrency(result.finalDailyWage))}</ThemedText>
                                            </View>
                                        </View>

                                    </Card.Content>
                                </Card>
                            ) : null}
                        </Card.Content>
                    </Card>
                </SafeAreaView>
            </ScrollView>

            <PersianDatePickerModal
                visible={pickerVisible}
                value={pickerTarget === 'employment' ? employmentDate : pickerTarget === 'start' ? startDate : endDate}
                title={pickerTarget === 'employment' ? 'انتخاب تاریخ شروع به کار در کارگاه' : pickerTarget === 'start' ? 'انتخاب تاریخ شروع' : 'انتخاب تاریخ پایان'}
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
        borderWidth: 1,
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
    formulaBox: {
        borderRadius: 12,
        borderWidth: 1,
        padding: Spacing.two,
        gap: Spacing.one,
    },
    metricsRow: {
        flexDirection: 'row',
        alignItems: 'stretch',
        gap: Spacing.two,
    },
    metricBox: {
        flex: 1,
        borderRadius: 12,
        padding: Spacing.two,
        gap: Spacing.one,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: '500',
    },
    dateInput: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.two,
        paddingVertical: Spacing.two,
        borderRadius: 8,
        borderWidth: 1,
        minHeight: 40,
    },
    fieldValue: {
        fontSize: 13,
        flex: 1,
    },
    optionSection: { gap: Spacing.two },
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
    checkRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, padding: Spacing.two },
    checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
    checkText: { flex: 1, gap: Spacing.one },
    optionTitle: { fontSize: 13, lineHeight: 19, fontFamily: 'Vazirmatn-Bold' },
    optionDescription: { fontSize: 11, lineHeight: 20, fontFamily: 'Vazirmatn-Regular' },
    helpRow: {
        marginTop: Spacing.one,
    },
    helpText: {
        lineHeight: 20,
        fontSize: 11,
        fontFamily: 'Vazirmatn-Regular',
    },
    actionsGroup: {
        flexDirection: 'row',
        gap: Spacing.two,
        marginTop: Spacing.one,
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
    summaryDetails: {
        gap: Spacing.one,
    },
    summaryDetailBox: {
        borderRadius: 10,
        borderWidth: StyleSheet.hairlineWidth,
        paddingHorizontal: Spacing.two,
        paddingVertical: Spacing.one,
        alignItems: 'center',
        gap: Spacing.half,
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
        fontSize: 12,
        fontFamily: 'Vazirmatn-Regular',
    },
    detailValue: {
        fontSize: 12,
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
    formulaLabel: {
        fontSize: 11,
        fontWeight: '500',
    },
    formulaValue: {
        fontSize: 13,
        lineHeight: 18,
    },
});
