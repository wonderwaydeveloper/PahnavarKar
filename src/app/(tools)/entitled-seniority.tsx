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
    calculateEntitledSeniorityFromPeriodData,
    parseDateInput,
    type EntitledSeniorityCalculationResult,
    type EntitledSeniorityWorkshopType,
    type SalaryPeriodBucket,
} from '@/utils/salary-calculation';

export default function EntitledSeniorityScreen() {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const currentDate = useMemo(() => {
        const today = new Date();
        return toJalaali(today.getFullYear(), today.getMonth() + 1, today.getDate());
    }, []);
    const defaultEmploymentDate = `${currentDate.jy - 1}/01/01`;
    const defaultEndDate = `${currentDate.jy}/12/${jalaaliMonthLength(currentDate.jy, 12)}`;

    const [employmentDate, setEmploymentDate] = useState(defaultEmploymentDate);
    const [endDate, setEndDate] = useState(defaultEndDate);
    const [pickerTarget, setPickerTarget] = useState<'employment' | 'end' | null>(null);
    const [workshopType, setWorkshopType] = useState<EntitledSeniorityWorkshopType>('unclassified');
    const [settledThrough1391, setSettledThrough1391] = useState(false);
    const [jobGroups, setJobGroups] = useState<{ id: number; group_number: number; sort_order: number }[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
    const [groupMenuVisible, setGroupMenuVisible] = useState(false);
    const [periodBuckets, setPeriodBuckets] = useState<SalaryPeriodBucket[]>([]);
    const [availableYears, setAvailableYears] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [result, setResult] = useState<EntitledSeniorityCalculationResult | null>(null);
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

                    const mappedPeriods = [];
                    for (const period of periods) {
                        const groupRows = await fetchSeniorityBaseByGroup(period.id);
                        const seniorityBaseByGroup = Object.fromEntries(
                            groupRows.map((row) => {
                                const group = groups.find((item) => item.id === row.job_group_id);
                                return [group?.group_number ?? row.job_group_id, Number(row.base_value)];
                            }),
                        );
                        mappedPeriods.push({
                            period_index: period.period_index,
                            month_count: period.month_count,
                            daily_minimum_wage: period.daily_minimum_wage,
                            percent_increase: period.percent_increase,
                            seniority_base: period.seniority_base,
                            seniority_base_by_group: seniorityBaseByGroup,
                        });
                    }

                    buckets.push({ year: year.year, periods: mappedPeriods });
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
                if (isMounted) setIsLoading(false);
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
    const canUseSettlementPath = (parseDateInput(employmentDate)?.year ?? 0) <= 1391;

    const compareDates = (left: string, right: string) => {
        const parsedLeft = parseDateInput(left);
        const parsedRight = parseDateInput(right);
        if (!parsedLeft || !parsedRight) return 0;
        return parsedLeft.year * 10000 + parsedLeft.month * 100 + parsedLeft.day - (parsedRight.year * 10000 + parsedRight.month * 100 + parsedRight.day);
    };

    const selectDate = (value: string) => {
        if (pickerTarget === 'employment') {
            setEmploymentDate(value);
            if ((parseDateInput(value)?.year ?? 0) > 1392) {
                setSettledThrough1391(false);
            }
            if (compareDates(value, endDate) > 0) setEndDate(value);
        } else if (pickerTarget === 'end') {
            if (compareDates(value, employmentDate) < 0) {
                setSnackbarMessage('تاریخ پایان باید برابر یا بزرگ‌تر از تاریخ استخدام باشد.');
                setSnackbarVisible(true);
            } else {
                setEndDate(value);
            }
        }
        setPickerTarget(null);
    };

    const handleCalculate = () => {
        const employment = parseDateInput(employmentDate);
        const end = parseDateInput(endDate);
        if (!employment || !end || compareDates(employmentDate, endDate) > 0) {
            setSnackbarMessage('تاریخ‌های واردشده معتبر نیستند.');
            setSnackbarVisible(true);
            setResult(null);
            return;
        }
        if (workshopType === 'classified' && selectedGroup == null) {
            setSnackbarMessage('گروه شغلی را انتخاب کنید.');
            setSnackbarVisible(true);
            return;
        }

        const calculation = calculateEntitledSeniorityFromPeriodData(
            employment,
            end,
            periodBuckets,
            workshopType,
            selectedGroup ?? undefined,
            settledThrough1391,
        );
        if (calculation.breakdown.length === 0) {
            setSnackbarMessage('برای بازه انتخاب‌شده پایه سنوات قابل محاسبه‌ای پیدا نشد.');
            setSnackbarVisible(true);
            setResult(null);
            return;
        }
        setResult(calculation);
        setShowDetails(false);
    };

    const handleReset = () => {
        setEmploymentDate(defaultEmploymentDate);
        setEndDate(defaultEndDate);
        setWorkshopType('unclassified');
        setSettledThrough1391(false);
        setResult(null);
        setShowDetails(false);
    };

    const selectedEndYear = parseDateInput(endDate)?.year;
    const finalYearBreakdown = result && selectedEndYear != null
        ? result.breakdown.filter((item) => item.year === selectedEndYear)
        : [];

    return (
        <ThemedView style={styles.container}>
            <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + Spacing.three, paddingBottom: insets.bottom + Spacing.four }]} showsVerticalScrollIndicator={false}>
                <SafeAreaView style={styles.safeArea}>
                    <Card elevation={1} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <Card.Content style={styles.cardContent}>
                            <View style={styles.headerText}>
                                <ThemedText type="bodyBold" style={[styles.pageTitle, { color: theme.text }]}>پایه سنوات استحقاقی</ThemedText>
                                <ThemedText type="small" style={[styles.pageDescription, { color: theme.textSecondary }]}>محاسبه پایه سنوات بر اساس تاریخ استخدام، وضعیت تصفیه حساب و طرح طبقه‌بندی مشاغل</ThemedText>
                            </View>

                            <View style={[styles.formulaBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                                <ThemedText type="smallBold" style={[styles.formulaLabel, { color: theme.textSecondary }]}>راهنمای محاسبه</ThemedText>
                                <ThemedText type="small" style={[styles.formulaValue, { color: theme.text }]}>سال اول: صفر؛ از اولین سالگرد: پایه سنوات جاری؛ سال‌های بعد: پایه جاری به‌اضافه پایه سنوات محاسبه‌شده قبلی</ThemedText>
                            </View>

                            <View style={styles.metricsRow}>
                                {([['employment', 'تاریخ استخدام'], ['end', 'تا تاریخ']] as const).map(([target, label]) => (
                                    <View key={target} style={[styles.metricBox, { backgroundColor: theme.surfaceVariant }]}>
                                        <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary }]}>{label}</ThemedText>
                                        <Pressable onPress={() => setPickerTarget(target)} style={[styles.dateInput, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                            <ThemedText type="smallBold" style={[styles.fieldValue, { color: theme.text }]}>{formatDate(target === 'employment' ? employmentDate : endDate)}</ThemedText>
                                            <MaterialCommunityIcons name="calendar-month-outline" size={18} color={theme.primary} />
                                        </Pressable>
                                    </View>
                                ))}
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

                            <View style={styles.actionsGroup}>
                                <Button mode="contained" onPress={handleCalculate} icon="cash-plus" buttonColor={theme.primary} textColor={theme.surface} style={styles.actionButton} labelStyle={styles.actionLabel} loading={isLoading} disabled={isLoading}>محاسبه</Button>
                                {result ? <Button mode="outlined" onPress={handleReset} icon="refresh" textColor={theme.primary} style={styles.actionButton} labelStyle={styles.actionLabel}>بازنشانی</Button> : null}
                            </View>

                            {result ? <Card style={[styles.resultCard, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}><Card.Content style={styles.resultContent}>
                                <View style={[styles.summaryBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                    <ThemedText type="small" style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                                        {workshopType === 'classified' ? 'مبالغ پایه سنوات استحقاقی گروه شغلی' : 'مبالغ پایه سنوات استحقاقی'} در سال {toPersianDigits(selectedEndYear ?? '')}
                                    </ThemedText>
                                    <View style={styles.finalYearAmounts}>
                                        {finalYearBreakdown.map((item, index) => (
                                            <View key={`${item.year}-${item.periodIndex}-${item.phase}-${index}`} style={[styles.finalYearAmount, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                                                <ThemedText type="small" style={[styles.finalYearDateLabel, { color: theme.textSecondary }]}>بازه زمانی</ThemedText>
                                                <ThemedText type="smallBold" style={[styles.finalYearDate, { color: theme.text }]}>{formatParsedDate(item.startDate)} تا {formatParsedDate(item.endDate)}</ThemedText>
                                                <View style={styles.finalYearValueRow}>
                                                    <View style={[styles.finalYearValueBlock, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                                        <ThemedText type="small" style={[styles.finalYearValueLabel, { color: theme.textSecondary }]}>روزانه</ThemedText>
                                                        <ThemedText type="smallBold" style={[styles.finalYearAmountValue, { color: theme.primary }]}>{formatCurrency(item.entitlement)}</ThemedText>
                                                    </View>
                                                    <View style={[styles.finalYearValueBlock, styles.finalYearMonthlyBlock, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
                                                        <ThemedText type="small" style={[styles.finalYearValueLabel, { color: theme.textSecondary }]}>۳۰ روزه</ThemedText>
                                                        <ThemedText type="smallBold" style={[styles.finalYearAmountValue, { color: theme.primary }]}>{formatCurrency(item.entitlement * 30)}</ThemedText>
                                                    </View>
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                                <View style={styles.breakdownHeader}>
                                    <ThemedText type="smallBold" style={[styles.breakdownSectionTitle, { color: theme.text }]}>جزئیات بازه‌های محاسبه</ThemedText>
                                    <Pressable onPress={() => setShowDetails((value) => !value)} style={[styles.toggleButton, { backgroundColor: theme.surface, borderColor: theme.border }]}><ThemedText type="smallBold" style={[styles.toggleButtonLabel, { color: theme.primary }]}>{showDetails ? 'عدم نمایش' : 'نمایش جزئیات'}</ThemedText><MaterialCommunityIcons name={showDetails ? 'chevron-up' : 'chevron-down'} size={18} color={theme.primary} /></Pressable>
                                </View>
                                {showDetails ? (
                                    <View style={styles.breakdownGrid}>
                                        {result.breakdown.map((item, index) => (
                                            <View
                                                key={`${item.year}-${item.periodIndex}-${index}`}
                                                style={[styles.breakdownItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
                                            >
                                                <View style={[styles.breakdownItemHeaderRow, { borderBottomColor: theme.border }]}>
                                                    <ThemedText type="smallBold" style={[styles.breakdownItemTitle, { color: theme.text }]}>
                                                        سال {toPersianDigits(item.year)}، دوره {toPersianDigits(item.periodIndex)}
                                                    </ThemedText>
                                                </View>
                                                <View style={styles.detailGrid}>
                                                    <View style={[styles.detailBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                                                        <ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>بازه زمانی</ThemedText>
                                                        <ThemedText type="smallBold" style={[styles.detailValue, styles.dateValue, { color: theme.text }]}>
                                                            {formatParsedDate(item.startDate)} تا {formatParsedDate(item.endDate)}
                                                        </ThemedText>
                                                    </View>
                                                    <View style={[styles.detailBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                                                        <ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>نوع بازه</ThemedText>
                                                        <ThemedText type="smallBold" style={[styles.detailValue, { color: theme.text }]}>
                                                            {item.phase === 'before-anniversary' ? 'پیش از سالگرد' : 'پس از سالگرد'}
                                                        </ThemedText>
                                                    </View>
                                                    <View style={[styles.detailBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                                                        <ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>تعداد روز</ThemedText>
                                                        <ThemedText type="smallBold" style={[styles.detailValue, { color: theme.text }]}>{toPersianDigits(item.daysCovered)} روز</ThemedText>
                                                    </View>
                                                    <View style={[styles.detailBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                                                        <ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>
                                                            {workshopType === 'classified' ? 'پایه سنوات جاری گروه شغلی' : 'پایه سنوات جاری'}
                                                        </ThemedText>
                                                        <ThemedText type="smallBold" style={[styles.detailValue, { color: theme.text }]}>{formatCurrency(item.currentBase)}</ThemedText>
                                                    </View>
                                                    <View style={[styles.detailBox, { backgroundColor: theme.primaryContainer, borderColor: theme.primary }]}>
                                                        <ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>
                                                            {workshopType === 'classified' ? 'پایه سنوات استحقاقی روزانه گروه شغلی' : 'پایه سنوات استحقاقی روزانه'}
                                                        </ThemedText>
                                                        <ThemedText type="smallBold" style={[styles.detailValue, { color: theme.primary }]}>{formatCurrency(item.entitlement)}</ThemedText>
                                                    </View>
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                ) : null}
                            </Card.Content></Card> : null}
                        </Card.Content>
                    </Card>
                </SafeAreaView>
            </ScrollView>
            <PersianDatePickerModal visible={pickerTarget !== null} value={pickerTarget === 'employment' ? employmentDate : endDate} title={pickerTarget === 'employment' ? 'انتخاب تاریخ استخدام' : 'انتخاب تاریخ پایان'} onClose={() => setPickerTarget(null)} onSelect={selectDate} availableYears={availableYears} />
            <Snackbar visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)} duration={3000} style={{ backgroundColor: theme.error, borderRadius: Radius.md }} action={{ label: 'بستن', onPress: () => setSnackbarVisible(false), labelStyle: { color: theme.surface } }}><ThemedText type="small" style={{ color: theme.surface }}>{snackbarMessage}</ThemedText></Snackbar>
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
    pageDescription: { fontSize: 12, lineHeight: 20, fontFamily: 'Vazirmatn-Regular' },
    formulaBox: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, padding: Spacing.two, gap: Spacing.one },
    formulaLabel: { fontSize: 10, lineHeight: 16, fontFamily: 'Vazirmatn-Medium' },
    formulaValue: { fontSize: 12, lineHeight: 20, fontFamily: 'Vazirmatn-Regular' },
    metricsRow: { flexDirection: 'row', gap: Spacing.two },
    metricBox: { flex: 1, borderRadius: 14, padding: Spacing.two, gap: Spacing.one },
    sectionLabel: { fontSize: 11, lineHeight: 16, fontFamily: 'Vazirmatn-Medium' },
    dateInput: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.one, paddingHorizontal: Spacing.two, paddingVertical: Spacing.two, borderRadius: 8, borderWidth: StyleSheet.hairlineWidth },
    fieldValue: { flex: 1, fontSize: 12, lineHeight: 18, fontFamily: 'Vazirmatn-Bold' },
    optionSection: { gap: Spacing.two },
    optionsRow: { flexDirection: 'row', gap: Spacing.two },
    optionButton: { flex: 1, minHeight: 44, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.two },
    checkRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, padding: Spacing.two },
    checkText: { flex: 1, gap: Spacing.one },
    actionsGroup: { flexDirection: 'row', gap: Spacing.two },
    actionButton: { flex: 1, borderRadius: 10 },
    actionLabel: { fontFamily: 'Vazirmatn-Bold', fontSize: 12 },
    optionTitle: { fontSize: 13, lineHeight: 19, fontFamily: 'Vazirmatn-Bold' },
    optionDescription: { fontSize: 11, lineHeight: 20, fontFamily: 'Vazirmatn-Regular' },
    resultCard: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
    resultContent: { gap: Spacing.two, paddingVertical: Spacing.three, paddingHorizontal: Spacing.two },
    summaryBox: { width: '100%', alignItems: 'center', gap: Spacing.one, padding: Spacing.two, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth },
    summaryLabel: { fontSize: 11, lineHeight: 16, fontFamily: 'Vazirmatn-Medium', textAlign: 'center' },
    amountValue: { fontSize: 18, lineHeight: 26, fontFamily: 'Vazirmatn-Bold' },
    finalYearAmounts: { width: '100%', gap: Spacing.one },
    finalYearAmount: { width: '100%', alignItems: 'center', gap: Spacing.half, padding: Spacing.two, borderRadius: 8, borderWidth: StyleSheet.hairlineWidth },
    finalYearDateLabel: { fontSize: 10, lineHeight: 16, fontFamily: 'Vazirmatn-Medium' },
    finalYearDate: { fontSize: 12, lineHeight: 18, fontFamily: 'Vazirmatn-Bold', textAlign: 'center' },
    finalYearValueRow: { width: '100%', flexDirection: 'column', gap: Spacing.one, marginTop: Spacing.one },
    finalYearValueBlock: { width: '100%', alignItems: 'center', gap: Spacing.half, paddingHorizontal: Spacing.two, paddingVertical: Spacing.one, borderRadius: 8, borderWidth: StyleSheet.hairlineWidth },
    finalYearMonthlyBlock: {},
    finalYearValueLabel: { fontSize: 10, lineHeight: 16, fontFamily: 'Vazirmatn-Medium' },
    finalYearAmountValue: { fontSize: 18, lineHeight: 26, fontFamily: 'Vazirmatn-Bold' },
    breakdownHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.one, paddingVertical: Spacing.one, gap: Spacing.two },
    breakdownSectionTitle: { fontSize: 13, lineHeight: 19, fontFamily: 'Vazirmatn-Bold' },
    toggleButton: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, paddingHorizontal: Spacing.two, paddingVertical: Spacing.one, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth },
    toggleButtonLabel: { fontSize: 11, lineHeight: 17, fontFamily: 'Vazirmatn-Bold' },
    breakdownGrid: { gap: Spacing.two },
    breakdownItem: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, padding: Spacing.two, gap: Spacing.one },
    breakdownItemHeaderRow: { paddingTop: 2, paddingBottom: 2, marginBottom: 2, borderBottomWidth: StyleSheet.hairlineWidth },
    breakdownItemTitle: { fontSize: 12, lineHeight: 18, fontFamily: 'Vazirmatn-Bold' },
    detailGrid: { gap: Spacing.one },
    detailBox: { alignItems: 'center', gap: Spacing.half, padding: Spacing.one, borderRadius: 8, borderWidth: StyleSheet.hairlineWidth },
    detailLabel: { fontSize: 10, lineHeight: 16, fontFamily: 'Vazirmatn-Regular' },
    detailValue: { fontSize: 12, lineHeight: 18, fontFamily: 'Vazirmatn-Bold' },
    dateValue: { textAlign: 'center' },
});