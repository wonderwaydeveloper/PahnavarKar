import { MaterialCommunityIcons } from '@expo/vector-icons';
import { toJalaali } from 'jalaali-js';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Checkbox, Menu, Snackbar } from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { PersianDatePickerModal } from '@/components/persian-date-picker-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { fetchPeriodsByYearId, fetchYears, seedFromJsonAsset } from '@/database';
import { useTheme } from '@/hooks/use-theme';
import {
    calculateFamilyAllowanceFromPeriodData,
    parseDateInput,
    type FamilyAllowanceCalculationResult,
    type SalaryPeriodBucket,
} from '@/utils/salary-calculation';

const CHILDREN_OPTIONS = Array.from({ length: 12 }, (_, index) => index + 1);

export default function FamilyAllowanceScreen() {
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
    const [pickerTarget, setPickerTarget] = useState<'start' | 'end' | null>(null);
    const [pickerVisible, setPickerVisible] = useState(false);
    const [childrenCount, setChildrenCount] = useState(1);
    const [childrenMenuVisible, setChildrenMenuVisible] = useState(false);
    const [periodBuckets, setPeriodBuckets] = useState<SalaryPeriodBucket[]>([]);
    const [availableYears, setAvailableYears] = useState<number[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [showDetailedBreakdown, setShowDetailedBreakdown] = useState(false);
    const [includeDaysCovered, setIncludeDaysCovered] = useState(true);
    const [result, setResult] = useState<FamilyAllowanceCalculationResult | null>(null);
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
                            child_allowance: period.child_allowance,
                        })),
                    });
                }

                if (isMounted) {
                    setPeriodBuckets(buckets);
                    setAvailableYears(years.map((year) => year.year));
                }
            } catch (error) {
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

    const formatDisplayedDate = (value: string) => {
        const parsed = parseDateInput(value);

        if (!parsed) {
            return '';
        }

        return `${toPersianDigits(String(parsed.year))}/${toPersianDigits(String(parsed.month).padStart(2, '0'))}/${toPersianDigits(String(parsed.day).padStart(2, '0'))}`;
    };

    const openPicker = (target: 'start' | 'end') => {
        setPickerTarget(target);
        setPickerVisible(true);
    };

    const closePicker = () => {
        setPickerVisible(false);
        setPickerTarget(null);
    };

    const openChildrenMenu = () => {
        setChildrenMenuVisible(true);
    };

    const closeChildrenMenu = () => {
        setChildrenMenuVisible(false);
    };

    const handleDateSelect = (value: string) => {
        if (pickerTarget === 'start') {
            setStartDate(value);
            if (endDate) {
                const parsedStart = parseDateInput(value);
                const parsedEnd = parseDateInput(endDate);
                if (parsedStart && parsedEnd && parsedStart.year > parsedEnd.year) {
                    setEndDate(value);
                }
            }
            return;
        }

        if (pickerTarget === 'end') {
            if (startDate) {
                const parsedStart = parseDateInput(startDate);
                const parsedEnd = parseDateInput(value);
                if (parsedStart && parsedEnd) {
                    const leftValue = parsedStart.year * 10000 + parsedStart.month * 100 + parsedStart.day;
                    const rightValue = parsedEnd.year * 10000 + parsedEnd.month * 100 + parsedEnd.day;
                    if (rightValue < leftValue) {
                        setEndDate(startDate);
                        setSnackbarMessage('تاریخ پایان باید برابر یا بزرگتر از تاریخ شروع باشد.');
                        setSnackbarVisible(true);
                        return;
                    }
                }
            }
            setEndDate(value);
        }
    };

    const handleCalculate = () => {
        const parsedStart = parseDateInput(startDate);
        const parsedEnd = parseDateInput(endDate);

        if (!parsedStart || !parsedEnd) {
            setSnackbarMessage('فرمت تاریخ نامعتبر است.');
            setSnackbarVisible(true);
            setResult(null);
            return;
        }

        const startValue = parsedStart.year * 10000 + parsedStart.month * 100 + parsedStart.day;
        const endValue = parsedEnd.year * 10000 + parsedEnd.month * 100 + parsedEnd.day;

        if (startValue > endValue) {
            setSnackbarMessage('تاریخ شروع باید قبل از تاریخ پایان باشد.');
            setSnackbarVisible(true);
            setResult(null);
            return;
        }

        if (periodBuckets.length === 0) {
            setSnackbarMessage('داده دوره‌ای برای محاسبه موجود نیست.');
            setSnackbarVisible(true);
            setResult(null);
            return;
        }

        const calculation = calculateFamilyAllowanceFromPeriodData(
            parsedStart,
            parsedEnd,
            periodBuckets,
            childrenCount,
            includeDaysCovered,
        );

        if (calculation.breakdown.length === 0) {
            setSnackbarMessage('برای بازه انتخاب‌شده ماه کارکرد یا حق عائله‌مندی ثبت نشده است.');
            setSnackbarVisible(true);
            setResult(null);
            return;
        }

        setResult(calculation);
    };

    const handleReset = () => {
        setResult(null);
        setShowDetailedBreakdown(false);
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
                                        کارت محاسبه حق عائله‌مندی
                                    </ThemedText>
                                    <ThemedText type="small" style={[styles.pageDescription, { color: theme.textSecondary }]}>
                                        بازه‌ی زمانی و تعداد فرزندان واجد شرایط را انتخاب کنید تا مبلغ عائله‌مندی محاسبه شود.
                                    </ThemedText>
                                </View>
                            </View>

                            <View style={[styles.formulaBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                                <ThemedText type="small" style={[styles.formulaLabel, { color: theme.textSecondary }]}>
                                    فرمول
                                </ThemedText>
                                <ThemedText type="small" style={[styles.formulaValue, { color: theme.text }]}>
                                    تعداد ماه کارکرد × تعداد فرزندان × مبلغ عائله مندی به یک فرزند واجد شرایط
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
                                <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                                    تعداد فرزندان واجد شرایط
                                </ThemedText>
                                <Menu
                                    visible={childrenMenuVisible}
                                    onDismiss={closeChildrenMenu}
                                    anchor={
                                        <Pressable onPress={openChildrenMenu}>
                                            <View style={[styles.dateInput, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                                <ThemedText type="small" style={[styles.fieldValue, { color: theme.text }]}>
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
                                                closeChildrenMenu();
                                            }}
                                            title={`${toPersianDigits(String(count))} فرزند`}
                                            titleStyle={{ fontFamily: 'Vazirmatn-Regular', color: theme.text }}
                                        />
                                    ))}
                                </Menu>
                            </View>

                            <View style={[styles.optionBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                                <View style={styles.optionRow}>
                                    <View style={styles.checkboxRow}>
                                        <Checkbox
                                            status={includeDaysCovered ? 'checked' : 'unchecked'}
                                            onPress={() => setIncludeDaysCovered((value) => !value)}
                                            color={theme.primary}
                                        />
                                        <ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>
                                            محاسبه تعداد روزهای شمول
                                        </ThemedText>
                                    </View>
                                </View>

                                <View style={styles.helpRow}>
                                    <ThemedText type="small" style={[styles.helpText, { color: theme.textSecondary }]}>
                                        با فعال بودن این گزینه، روزهای جزئی شمول هم در محاسبه لحاظ می‌شوند
                                        اگر غیر فعال باشد، فقط ماه‌های کامل لحاظ می‌شوند.
                                    </ThemedText>
                                </View>
                            </View>

                            <View style={styles.actionsGroup}>
                                <Button
                                    mode="contained"
                                    onPress={handleCalculate}
                                    icon="account-group-outline"
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
                                        <View style={{ marginBottom: Spacing.one }}>
                                            <ThemedText type="smallBold" style={[styles.breakdownSectionTitle, { color: theme.text }]}>جزئیات محاسبه</ThemedText>
                                        </View>
                                        <View style={styles.summaryBoxHeader}>
                                            <View style={[styles.summaryBoxContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                                <ThemedText type="small" style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                                                    مبلغ کل حق عائله‌مندی
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
                                                            <View style={[styles.breakdownDetailBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                                                                <ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>
                                                                    تعداد ماه‌های شمول
                                                                </ThemedText>
                                                                <ThemedText type="smallBold" style={[styles.detailValue, { color: theme.text }]}>
                                                                    {toPersianDigits(String(item.monthsCovered))} ماه
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
                                                                <ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>
                                                                    مبلغ عائله مندی به یک فرزند واجد شرایط
                                                                </ThemedText>
                                                                <ThemedText type="smallBold" style={[styles.detailValue, { color: theme.text }]}>
                                                                    {item.childAllowance != null ? toPersianDigits(formatCurrency(item.childAllowance)) : '-'}
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
                value={pickerTarget === 'start' ? startDate : endDate}
                title={pickerTarget === 'start' ? 'انتخاب تاریخ شروع' : 'انتخاب تاریخ پایان'}
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
    summaryBoxHeader: {
        gap: Spacing.one,
    },
    summaryBoxContent: {
        borderRadius: Radius.md,
        borderWidth: StyleSheet.hairlineWidth,
        paddingHorizontal: Spacing.two,
        paddingVertical: Spacing.two,
        gap: Spacing.one,
    },
    formulaBox: {
        borderRadius: Radius.md,
        borderWidth: StyleSheet.hairlineWidth,
        paddingHorizontal: Spacing.two,
        paddingVertical: Spacing.two,
        gap: Spacing.one,
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
    dateInput: {
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: 12,
        paddingHorizontal: Spacing.two,
        paddingVertical: Spacing.two,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    childrenSection: {
        gap: Spacing.two,
    },
    childSelectorButton: {
        borderRadius: 12,
        paddingHorizontal: Spacing.four,
    },
    childrenOptionsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.two,
    },
    childOption: {
        minWidth: 42,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: 12,
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.two,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionsGroup: {
        gap: Spacing.two,
    },
    actionButton: {
        borderRadius: 12,
    },
    resetButton: {
        borderRadius: 12,
        borderWidth: StyleSheet.hairlineWidth,
    },
    actionLabel: {
        fontFamily: 'Vazirmatn-Medium',
        fontSize: 14,
        lineHeight: 20,
    },
    optionRow: {
        flexDirection: 'column',
        gap: Spacing.two,
        paddingHorizontal: 0,
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.one,
    },
    optionBox: {
        borderRadius: Radius.md,
        borderWidth: StyleSheet.hairlineWidth,
        paddingVertical: Spacing.two,
        paddingHorizontal: Spacing.two,
        marginBottom: Spacing.two,
    },
    helpRow: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.one,
        paddingHorizontal: 0,
        paddingTop: 0,
    },
    helpText: {
        fontFamily: 'Vazirmatn-Regular',
        fontSize: 12,
        lineHeight: 18,
    },
    breakdownCard: {
        borderRadius: Radius.lg,
        borderWidth: StyleSheet.hairlineWidth,
    },
    breakdownContent: {
        gap: Spacing.two,
    },
    breakdownSectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: Spacing.two,
        marginTop: Spacing.one,
    },
    toggleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.one,
        borderRadius: 14,
        borderWidth: StyleSheet.hairlineWidth,
        paddingHorizontal: Spacing.two,
        paddingVertical: Spacing.one,
    },
    toggleButtonLabel: {
        fontFamily: 'Vazirmatn-Bold',
        fontSize: 13,
        lineHeight: 19,
    },
    breakdownSectionTitle: {
        fontFamily: 'Vazirmatn-Bold',
        fontSize: 13,
        lineHeight: 20,
    },
    breakdownGrid: {
        flexDirection: 'column',
        gap: Spacing.two,
    },
    breakdownItemCard: {
        borderRadius: Radius.md,
        borderWidth: StyleSheet.hairlineWidth,
        paddingHorizontal: Spacing.two,
        paddingVertical: Spacing.two,
        gap: Spacing.two,
    },
    breakdownItemTitle: {
        fontSize: 13,
        lineHeight: 19,
        fontFamily: 'Vazirmatn-Bold',
    },
    breakdownSummaryPill: {
        alignSelf: 'flex-start',
        borderRadius: 999,
        borderWidth: StyleSheet.hairlineWidth,
        paddingHorizontal: Spacing.two,
        paddingVertical: Spacing.one,
    },
    breakdownPillValue: {
        fontSize: 12.5,
        lineHeight: 18,
        fontFamily: 'Vazirmatn-Bold',
    },
    breakdownItemHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: Spacing.two,
        flexWrap: 'wrap',
    },
    breakdownDetailGrid: {
        flexDirection: 'column',
        gap: Spacing.two,
    },
    breakdownDetailBox: {
        width: '100%',
        borderRadius: Radius.md,
        borderWidth: StyleSheet.hairlineWidth,
        paddingHorizontal: Spacing.two,
        paddingVertical: Spacing.two,
        gap: Spacing.one,
    },
    pageTitle: {
        fontSize: 16,
        lineHeight: 22,
        fontFamily: 'Vazirmatn-Bold',
    },
    pageDescription: {
        fontSize: 12.5,
        lineHeight: 19,
        fontFamily: 'Vazirmatn-Regular',
    },
    sectionLabel: {
        fontSize: 12.5,
        lineHeight: 18,
        fontFamily: 'Vazirmatn-Medium',
    },
    fieldValue: {
        fontSize: 13,
        lineHeight: 19,
        fontFamily: 'Vazirmatn-Medium',
    },
    summaryLabel: {
        fontSize: 12.5,
        lineHeight: 18,
        fontFamily: 'Vazirmatn-Medium',
    },
    amountValue: {
        fontSize: 22,
        lineHeight: 28,
        fontFamily: 'Vazirmatn-Bold',
    },
    formulaLabel: {
        fontSize: 12.5,
        lineHeight: 18,
        fontFamily: 'Vazirmatn-Medium',
    },
    formulaValue: {
        fontSize: 12.5,
        lineHeight: 18,
        fontFamily: 'Vazirmatn-Regular',
    },
    detailLabel: {
        fontSize: 12.2,
        lineHeight: 17,
        fontFamily: 'Vazirmatn-Medium',
    },
    detailValue: {
        fontSize: 13,
        lineHeight: 19,
        fontFamily: 'Vazirmatn-Bold',
    },
});
