import { MaterialCommunityIcons } from '@expo/vector-icons';
import { jalaaliMonthLength, toJalaali } from 'jalaali-js';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Card, Menu, Snackbar } from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { FontAwareButton as Button, FontAwareMenuItem } from '@/components/font-aware-paper';
import { DailyWorkTimeField, getDailyWorkMinutes } from '@/components/daily-work-time-field';
import { DateInputField } from '@/components/date-input-field';
import { PersianDatePickerModal } from '@/components/persian-date-picker-modal';
import { SettlementThrough1391Field } from '@/components/settlement-through-1391-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WorkshopTypeSelector } from '@/components/workshop-type-selector';
import { Radius, Spacing } from '@/constants/theme';
import { fetchJobGroups, fetchPeriodsByYearId, fetchSeniorityBaseByGroup, fetchYears, seedFromJsonAsset } from '@/database';
import { useTheme } from '@/hooks/use-theme';
import { getDailyWorkRatio, scaleWageCalculationResult } from '@/utils/daily-work-ratio';
import {
    calculateBonusEntitlementFromPeriodData,
    parseDateInput,
    type BonusEntitlementCalculationResult,
    type EntitledSeniorityWorkshopType,
    type SalaryPeriodBucket,
} from '@/utils/salary-calculation';

type PickerTarget = 'start' | 'end' | 'employment';

export default function BonusEntitlementScreen() {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const currentDate = useMemo(() => {
        const today = new Date();
        return toJalaali(today.getFullYear(), today.getMonth() + 1, today.getDate());
    }, []);
    const currentYear = currentDate.jy;
    const defaultStartDate = `${currentYear}/01/01`;
    const defaultEndDate = `${currentYear}/12/${jalaaliMonthLength(currentYear, 12)}`;
    const defaultEmploymentDate = `${currentYear - 1}/01/01`;

    const [startDate, setStartDate] = useState(defaultStartDate);
    const [endDate, setEndDate] = useState(defaultEndDate);
    const [employmentDate, setEmploymentDate] = useState(defaultEmploymentDate);
    const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);
    const [workshopType, setWorkshopType] = useState<EntitledSeniorityWorkshopType>('unclassified');
    const [settledThrough1391, setSettledThrough1391] = useState(false);
    const [jobGroups, setJobGroups] = useState<{ id: number; group_number: number; sort_order: number }[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
    const [groupMenuVisible, setGroupMenuVisible] = useState(false);
    const [periodBuckets, setPeriodBuckets] = useState<SalaryPeriodBucket[]>([]);
    const [availableYears, setAvailableYears] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [result, setResult] = useState<BonusEntitlementCalculationResult | null>(null);
    const [dailyWorkTime, setDailyWorkTime] = useState('07:20');
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
                            (await fetchSeniorityBaseByGroup(period.id)).map((row) => [
                                groups.find((group) => group.id === row.job_group_id)?.group_number ?? row.job_group_id,
                                Number(row.base_value),
                            ]),
                        ),
                    })));
                    buckets.push({ year: year.year, periods: mappedPeriods });
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
                if (isMounted) setIsLoading(false);
            }
        };
        void loadData();
        return () => { isMounted = false; };
    }, []);

    const digits = '۰۱۲۳۴۵۶۷۸۹';
    const toPersianDigits = (value: string | number) => String(value).replace(/\d/g, (digit) => digits[Number(digit)]);
    const formatCurrency = (value: number) => `${new Intl.NumberFormat('fa-IR').format(Math.round(value))} ریال`;
    const formatNumber = (value: number) => toPersianDigits(value.toFixed(2).replace(/\.00$/, ''));
    const formatDate = (value: string) => {
        const parsed = parseDateInput(value);
        return parsed ? `${toPersianDigits(parsed.year)}/${toPersianDigits(String(parsed.month).padStart(2, '0'))}/${toPersianDigits(String(parsed.day).padStart(2, '0'))}` : '';
    };
    const compareDates = (left: string, right: string) => {
        const a = parseDateInput(left);
        const b = parseDateInput(right);
        if (!a || !b) return 0;
        return a.year * 10000 + a.month * 100 + a.day - (b.year * 10000 + b.month * 100 + b.day);
    };
    const canUseSettlementPath = (parseDateInput(employmentDate)?.year ?? 0) <= 1391;

    const handleDateSelect = (value: string) => {
        if (pickerTarget === 'employment') {
            setEmploymentDate(value);
            if ((parseDateInput(value)?.year ?? 0) > 1391) {
                setSettledThrough1391(false);
            }
            if (compareDates(value, endDate) > 0) setEndDate(value);
        } else if (pickerTarget === 'start') {
            setStartDate(value);
            if (compareDates(value, endDate) > 0) setEndDate(value);
        } else if (pickerTarget === 'end') {
            if (compareDates(value, startDate) < 0) {
                setSnackbarMessage('تاریخ پایان باید برابر یا بزرگ‌تر از تاریخ شروع باشد.');
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
        if (!start || !end || !employment || compareDates(startDate, endDate) > 0 || compareDates(employmentDate, startDate) > 0) {
            setResult(null);
            setSnackbarMessage('بازهٔ زمانی یا تاریخ استخدام معتبر نیست.');
            setSnackbarVisible(true);
            return;
        }
        if (workshopType === 'classified' && selectedGroup == null) {
            setResult(null);
            setSnackbarMessage('گروه شغلی را انتخاب کنید.');
            setSnackbarVisible(true);
            return;
        }

        const calculation = calculateBonusEntitlementFromPeriodData(
            start,
            end,
            employment,
            periodBuckets,
            workshopType,
            selectedGroup ?? undefined,
            settledThrough1391,
        );
        if (calculation.breakdown.length === 0) {
            setResult(null);
            setSnackbarMessage('برای بازهٔ انتخاب‌شده دادهٔ قابل محاسبه‌ای پیدا نشد.');
            setSnackbarVisible(true);
            return;
        }
        setResult(scaleWageCalculationResult(calculation, getDailyWorkRatio(getDailyWorkMinutes(dailyWorkTime))));
        setShowDetails(false);
    };

    return (
        <ThemedView style={styles.container}>
            <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + Spacing.three, paddingBottom: insets.bottom + Spacing.four }]} showsVerticalScrollIndicator={false}>
                <SafeAreaView style={styles.safeArea}>
                    <Card elevation={1} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <Card.Content style={styles.cardContent}>
                            <View style={styles.headerText}>
                                <ThemedText type="bodyBold" style={[styles.pageTitle, { color: theme.text }]}>محاسبه عیدی و پاداش استحقاقی</ThemedText>
                                <ThemedText type="small" style={[styles.pageDescription, { color: theme.textSecondary }]}>محاسبه عیدی پاداش ماهیانه بر اساس ماده واحده قانون تعیین عیدی پاداش، مصوب مجلس در سال ۱۳۷۰</ThemedText>
                            </View>
                            <View style={[styles.formulaBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                                <ThemedText type="smallBold" style={[styles.formulaLabel, { color: theme.textSecondary }]}>فرمول محاسبه</ThemedText>
                                <ThemedText type="small" style={[styles.formulaText, { color: theme.text }]}>گام اول: مبلغ عیدی و پاداش محاسبه‌شده = مجموعِ [تعداد ماه‌های کارکرد هر دوره × ۵ × (حداقل مزد روزانه مصوب همان سال + پایه سنوات استحقاقی همان دوره)]</ThemedText>
                                <ThemedText type="small" style={[styles.formulaText, { color: theme.textSecondary }]}>گام دوم: حداقل عیدی = تعداد ماه‌های کارکرد در سال × ۵ × حداقل مزد روزانه؛ حداکثر عیدی = تعداد ماه‌های کارکرد در سال × ۷٫۵ × حداقل مزد روزانه</ThemedText>
                                <ThemedText type="small" style={[styles.formulaText, { color: theme.textSecondary }]}>گام سوم: مبلغ عیدی و پاداش استحقاقی برابر است با مبلغ محاسبه‌شده، مشروط بر اینکه از حداکثر قانونی بیشتر نباشد.</ThemedText>
                            </View>
                            <View style={styles.metricsRow}>
                                <DateInputField label="از تاریخ" value={startDate} onPress={() => setPickerTarget('start')} formatValue={formatDate} />
                                <DateInputField label="تا تاریخ" value={endDate} onPress={() => setPickerTarget('end')} formatValue={formatDate} />
                            </View>
                            <DateInputField label="تاریخ استخدام" value={employmentDate} onPress={() => setPickerTarget('employment')} formatValue={formatDate} iconName="calendar-account-outline" helperText="جهت محاسبه پایه سنوات استحقاقی و اعمال آن در محاسبات" />
                            <WorkshopTypeSelector value={workshopType} onValueChange={setWorkshopType} />
                            {workshopType === 'classified' ? (
                                <View style={[styles.metricBox, { backgroundColor: theme.surfaceVariant }]}>
                                    <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary }]}>گروه شغلی</ThemedText>
                                    <Menu visible={groupMenuVisible} onDismiss={() => setGroupMenuVisible(false)} anchor={<Pressable onPress={() => setGroupMenuVisible(true)} style={[styles.dateInput, { backgroundColor: theme.surface, borderColor: theme.border }]}><ThemedText type="smallBold" style={{ color: theme.text }}>{selectedGroup == null ? 'انتخاب گروه شغلی' : `گروه ${toPersianDigits(selectedGroup)}`}</ThemedText><MaterialCommunityIcons name="briefcase-outline" size={18} color={theme.primary} /></Pressable>}>
                                        {jobGroups.map((group) => <FontAwareMenuItem key={group.id} onPress={() => { setSelectedGroup(group.group_number); setGroupMenuVisible(false); }} title={`گروه ${toPersianDigits(group.group_number)}`} />)}
                                    </Menu>
                                </View>
                            ) : null}
                            <SettlementThrough1391Field checked={settledThrough1391} enabled={canUseSettlementPath} onChange={setSettledThrough1391} />
                            <DailyWorkTimeField value={dailyWorkTime} onChange={setDailyWorkTime} />
                            <View style={styles.actionsGroup}>
                                <Button mode="contained" onPress={handleCalculate} icon="gift-outline" buttonColor={theme.primary} textColor={theme.surface} style={styles.actionButton} labelStyle={styles.actionLabel} loading={isLoading} disabled={isLoading}>محاسبه</Button>
                            </View>
                            {result ? (
                                <Card style={[styles.resultCard, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                                    <Card.Content style={styles.resultContent}>
                                        <View style={[styles.summaryBoxContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                            <ThemedText type="small" style={[styles.summaryLabel, { color: theme.textSecondary }]}>مبلغ نهایی عیدی و پاداش در بازهٔ زمانی انتخابی</ThemedText>
                                            <ThemedText type="largeTitle" style={[styles.amountValue, { color: theme.primary }]}>{toPersianDigits(formatCurrency(result.totalEntitlementAmount))}</ThemedText>
                                        </View>
                                        <View style={styles.summaryDetailsGrid}>
                                            <View style={[styles.summaryDetailBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                                <ThemedText type="small" style={[styles.summaryLabel, { color: theme.textSecondary }]}>حداقل عیدی و پاداش در بازهٔ زمانی انتخابی</ThemedText>
                                                <ThemedText type="smallBold" style={{ color: theme.text }}>{toPersianDigits(formatCurrency(result.totalMinimumAmount))}</ThemedText>
                                            </View>
                                            <View style={[styles.summaryDetailBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                                <ThemedText type="small" style={[styles.summaryLabel, { color: theme.textSecondary }]}>حداکثر عیدی و پاداش در بازهٔ زمانی انتخابی</ThemedText>
                                                <ThemedText type="smallBold" style={{ color: theme.text }}>{toPersianDigits(formatCurrency(result.totalMaximumAmount))}</ThemedText>
                                            </View>
                                        </View>
                                        <View style={styles.breakdownHeader}>
                                            <ThemedText type="smallBold" style={{ color: theme.text }}>جزئیات دوره‌ها</ThemedText>
                                            <Pressable onPress={() => setShowDetails((value) => !value)} style={[styles.toggleButton, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                                <ThemedText type="smallBold" style={[styles.toggleButtonLabel, { color: theme.primary }]}>{showDetails ? 'عدم نمایش' : 'نمایش جزئیات'}</ThemedText>
                                                <MaterialCommunityIcons name={showDetails ? 'chevron-up' : 'chevron-down'} size={18} color={theme.primary} />
                                            </Pressable>
                                        </View>
                                        {showDetails ? <View style={styles.breakdownGrid}>{result.breakdown.map((item, index) => (
                                            <View key={`${item.year}-${item.periodIndex}-${index}`} style={[styles.breakdownItemCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                                <View style={[styles.breakdownItemHeaderRow, { borderBottomColor: theme.border }]}>
                                                    <ThemedText type="smallBold" style={[styles.breakdownItemTitle, { color: theme.text }]}>{`سال ${toPersianDigits(item.year)} · دوره ${toPersianDigits(item.periodIndex)}`}</ThemedText>
                                                </View>
                                                <View style={styles.breakdownDetailGrid}>
                                                    <View style={[styles.breakdownDetailBox, { backgroundColor: theme.primaryContainer, borderColor: theme.primary }]}>
                                                        <ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>بازهٔ زمانی</ThemedText>
                                                        <ThemedText type="smallBold" style={[styles.detailValue, { color: theme.primary }]}>{formatDate(`${item.startDate.year}/${item.startDate.month}/${item.startDate.day}`)} تا {formatDate(`${item.endDate.year}/${item.endDate.month}/${item.endDate.day}`)}</ThemedText>
                                                    </View>
                                                    <View style={[styles.breakdownDetailBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                                                        <ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>نوع بازه</ThemedText>
                                                        <ThemedText type="smallBold" style={[styles.detailValue, { color: theme.text }]}>{item.phase === 'before-anniversary' ? 'پیش از سالگرد استخدام' : 'بعد از سالگرد استخدام'}</ThemedText>
                                                    </View>
                                                    <View style={[styles.breakdownDetailBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                                                        <ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>ماه‌های کارکرد دوره</ThemedText>
                                                        <ThemedText type="smallBold" style={[styles.detailValue, { color: theme.text }]}>{formatNumber(item.monthsCovered)} ماه</ThemedText>
                                                    </View>
                                                    <View style={[styles.breakdownDetailBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                                                        <ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>حداقل مزد روزانه</ThemedText>
                                                        <ThemedText type="smallBold" style={[styles.detailValue, { color: theme.text }]}>{toPersianDigits(formatCurrency(item.dailyMinimumWage))}</ThemedText>
                                                    </View>
                                                    <View style={[styles.breakdownDetailBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                                                        <ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>{workshopType === 'classified' ? 'پایه سنوات استحقاقی روزانه گروه شغلی' : 'پایه سنوات استحقاقی روزانه'}</ThemedText>
                                                        <ThemedText type="smallBold" style={[styles.detailValue, { color: theme.text }]}>{toPersianDigits(formatCurrency(item.dailySeniority))}</ThemedText>
                                                    </View>
                                                    <View style={[styles.breakdownDetailBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                                                        <ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>حداقل عیدی و پاداش</ThemedText>
                                                        <ThemedText type="smallBold" style={[styles.detailValue, { color: theme.text }]}>{toPersianDigits(formatCurrency(item.minimumAmount))}</ThemedText>
                                                    </View>
                                                    <View style={[styles.breakdownDetailBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                                                        <ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>حداکثر عیدی و پاداش</ThemedText>
                                                        <ThemedText type="smallBold" style={[styles.detailValue, { color: theme.text }]}>{toPersianDigits(formatCurrency(item.maximumAmount))}</ThemedText>
                                                    </View>
                                                    <View style={[styles.breakdownDetailBox, { backgroundColor: theme.primaryContainer, borderColor: theme.primary }]}>
                                                        <ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>سهم نهایی دوره</ThemedText>
                                                        <ThemedText type="smallBold" style={[styles.detailValue, { color: theme.primary }]}>{toPersianDigits(formatCurrency(item.entitlementAmount))}</ThemedText>
                                                    </View>
                                                </View>
                                            </View>
                                        ))}</View> : null}
                                    </Card.Content>
                                </Card>
                            ) : null}
                        </Card.Content>
                    </Card>
                </SafeAreaView>
            </ScrollView>
            <PersianDatePickerModal visible={pickerTarget !== null} value={pickerTarget === 'start' ? startDate : pickerTarget === 'end' ? endDate : employmentDate} title={pickerTarget === 'start' ? 'انتخاب تاریخ شروع' : pickerTarget === 'end' ? 'انتخاب تاریخ پایان' : 'انتخاب تاریخ استخدام'} onClose={() => setPickerTarget(null)} onSelect={handleDateSelect} availableYears={availableYears} />
            <Snackbar visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)} duration={3000} style={{ backgroundColor: theme.error, borderRadius: Radius.md }} action={{ label: 'بستن', onPress: () => setSnackbarVisible(false), labelStyle: { color: theme.surface } }}><ThemedText type="small" style={{ color: theme.surface }}>{snackbarMessage}</ThemedText></Snackbar>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 }, scrollContent: { flexGrow: 1 }, safeArea: { flex: 1, justifyContent: 'center', paddingHorizontal: Spacing.four },
    card: { borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' }, cardContent: { gap: Spacing.three, paddingVertical: Spacing.four, paddingHorizontal: Spacing.three },
    headerText: { gap: Spacing.one }, pageTitle: { display: 'none', fontSize: 16, lineHeight: 22, fontFamily: 'AppFont-Bold' }, pageDescription: { fontSize: 13, lineHeight: 20 },
    formulaBox: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, padding: Spacing.two, gap: Spacing.one }, formulaLabel: { fontSize: 11 }, formulaText: { fontSize: 12, lineHeight: 21 },
    metricsRow: { flexDirection: 'row', gap: Spacing.two }, metricBox: { flex: 1, borderRadius: 14, padding: Spacing.two, gap: Spacing.one }, sectionLabel: { fontSize: 11 },
    dateInput: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.two, paddingVertical: Spacing.two, borderRadius: 8, borderWidth: StyleSheet.hairlineWidth },
    optionSection: { gap: Spacing.two }, optionsRow: { flexDirection: 'row', gap: Spacing.two }, optionButton: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.two, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth },
    checkRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.two, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth }, checkText: { flex: 1, gap: Spacing.one }, optionTitle: { fontSize: 13, lineHeight: 19, fontFamily: 'AppFont-Bold' }, optionDescription: { fontSize: 11, lineHeight: 20, fontFamily: 'AppFont-Regular' }, actionsGroup: { flexDirection: 'row', gap: Spacing.two }, actionButton: { flex: 1, borderRadius: 12 }, actionLabel: { fontFamily: 'AppFont-Bold', fontSize: 12 },
    resultCard: { borderRadius: 12, borderWidth: 1, marginTop: Spacing.two, overflow: 'hidden' }, resultContent: { gap: Spacing.two, paddingVertical: Spacing.three, paddingHorizontal: Spacing.two }, summaryBoxContent: { width: '100%', alignItems: 'center', gap: Spacing.one, padding: Spacing.two, borderRadius: 12, borderWidth: 1 }, summaryDetailsGrid: { gap: Spacing.one }, summaryDetailBox: { width: '100%', alignItems: 'center', gap: Spacing.half, padding: Spacing.two, borderRadius: 12, borderWidth: 1 }, summaryLabel: { fontSize: 11 }, amountValue: { fontSize: 18 },
    breakdownHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.one, paddingVertical: Spacing.one, gap: Spacing.one }, breakdownSectionTitle: { fontSize: 13 }, toggleButton: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, paddingHorizontal: Spacing.two, paddingVertical: Spacing.one, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth }, toggleButtonLabel: { fontSize: 11, lineHeight: 17, fontFamily: 'AppFont-Bold' }, breakdownGrid: { gap: Spacing.two }, breakdownItemCard: { gap: Spacing.one, padding: Spacing.two, borderRadius: 12, borderWidth: 1 }, breakdownItemHeaderRow: { paddingTop: 2, paddingBottom: 2, marginBottom: 2, borderBottomWidth: StyleSheet.hairlineWidth }, breakdownItemTitle: { fontSize: 12, fontFamily: 'AppFont-Bold' }, breakdownDetailGrid: { gap: Spacing.one }, breakdownDetailBox: { alignItems: 'center', gap: Spacing.half, padding: Spacing.one, borderRadius: 8, borderWidth: 1 }, detailLabel: { fontSize: 10 }, detailValue: { fontSize: 12 },
});
