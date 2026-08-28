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
import { fetchYears, seedFromJsonAsset } from '@/database';
import { useTheme } from '@/hooks/use-theme';
import { calculateUnusedLeaveDays, calculateUnusedLeaveMonths, parseDateInput } from '@/utils/salary-calculation';

export default function UnusedLeaveEntitlementScreen() {
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
    const [pickerTarget, setPickerTarget] = useState<'start' | 'end' | null>(null);
    const [pickerVisible, setPickerVisible] = useState(false);
    const [result, setResult] = useState<number | null>(null);
    const [showDetailedBreakdown, setShowDetailedBreakdown] = useState(false);
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [availableYears, setAvailableYears] = useState<number[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [calculationDetails, setCalculationDetails] = useState<{
        totalMonthsWorked: number;
        fullYears: number;
        remainingMonths: number;
        yearDays: number;
        remainingMonthDays: number;
        totalDays: number;
    } | null>(null);

    useEffect(() => {
        let isMounted = true;

        const loadData = async () => {
            try {
                setIsLoadingData(true);
                await seedFromJsonAsset();
                const years = await fetchYears();

                if (isMounted) {
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

    const formatNumber = (value: number) =>
        Number.isInteger(value) ? toPersianDigits(value.toFixed(0)) : toPersianDigits(value.toFixed(2));

    const formattedResult = result === null ? '۰' : formatNumber(result);

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

    const handleCalculate = () => {
        const parsedStart = parseDateInput(startDate);
        const parsedEnd = parseDateInput(endDate);

        if (!parsedStart || !parsedEnd) {
            setResult(null);
            setCalculationDetails(null);
            setSnackbarMessage('تاریخ واردشده معتبر نیست.');
            setSnackbarVisible(true);
            return;
        }

        if (compareDates(startDate, endDate) > 0) {
            setSnackbarMessage('تاریخ شروع باید قبل یا برابر تاریخ پایان باشد.');
            setSnackbarVisible(true);
            return;
        }

        const totalMonthsWorked = calculateUnusedLeaveMonths(parsedStart, parsedEnd);

        if (totalMonthsWorked === null) {
            setSnackbarMessage('بازه زمانی وارد‌شده معتبر نیست.');
            setSnackbarVisible(true);
            return;
        }

        let fullYears = 0;
        let remainingMonths = 0;

        if (totalMonthsWorked > 12) {
            fullYears = Math.floor(totalMonthsWorked / 12);
            remainingMonths = totalMonthsWorked % 12;
        } else {
            remainingMonths = totalMonthsWorked;
        }
        const calculatedDays = calculateUnusedLeaveDays(totalMonthsWorked);

        setResult(calculatedDays);
        setCalculationDetails({
            totalMonthsWorked,
            fullYears,
            remainingMonths,
            yearDays: fullYears * 9,
            remainingMonthDays: remainingMonths * (9 / 12),
            totalDays: calculatedDays,
        });
        setShowDetailedBreakdown(false);
    };

    const handleReset = () => {
        setStartDate(defaultStartDate);
        setEndDate(defaultEndDate);
        setResult(null);
        setCalculationDetails(null);
        setShowDetailedBreakdown(false);
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
                            <View style={styles.headerRow}>
                                <View style={styles.headerText}>
                                    <ThemedText type="bodyBold" style={[styles.pageTitle, { color: theme.text }]}>
                                        تعداد روزهای مرخصی ذخیره شده کارگر
                                    </ThemedText>
                                    <ThemedText type="small" style={[styles.pageDescription, { color: theme.textSecondary }]}>
                                        محاسبه تعداد روزهای مرخصی ذخیره شده برای کارگر براساس ماده ۶۴ قانون کار
                                    </ThemedText>
                                </View>
                            </View>

                            <View style={[styles.formulaBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                                <ThemedText type="small" style={[styles.formulaLabel, { color: theme.textSecondary }]}>
                                    فرمول محاسبه
                                </ThemedText>
                                <ThemedText type="small" style={[styles.formulaValue, { color: theme.text }]}>
                                    ۱) اگر کارگر یک سال یا کمتر کار کرده باشد:{'\n'}
                                    تعداد روز مرخصی استفاده نشده = تعداد ماه‌های کارکرد × ۲.۵ {'\n'}
                                    {'\n'}
                                    ۲) اگر کارگر بیش از یک سال کار کرده باشد:{'\n'}
                                    تعداد روز مرخصی استفاده نشده = (تعداد سال‌های کامل × ۹) + (تعداد ماه‌های مازاد × ۰.۷۵)
                                </ThemedText>
                            </View>

                            <View style={styles.metricsRow}>
                                <View style={[styles.metricBox, { backgroundColor: theme.surfaceVariant }]}>
                                    <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                                        از تاریخ
                                    </ThemedText>
                                    <Pressable
                                        style={[styles.dateInput, { backgroundColor: theme.surface, borderColor: theme.border }]}
                                        onPress={() => openPicker('start')}
                                    >
                                        <ThemedText type="smallBold" style={[styles.fieldValue, { color: theme.text }]}>
                                            {formatDisplayedDate(startDate)}
                                        </ThemedText>
                                        <MaterialCommunityIcons name="calendar-month-outline" size={18} color={theme.primary} />
                                    </Pressable>
                                </View>

                                <View style={[styles.metricBox, { backgroundColor: theme.surfaceVariant }]}>
                                    <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                                        تا تاریخ
                                    </ThemedText>
                                    <Pressable
                                        style={[styles.dateInput, { backgroundColor: theme.surface, borderColor: theme.border }]}
                                        onPress={() => openPicker('end')}
                                    >
                                        <ThemedText type="smallBold" style={[styles.fieldValue, { color: theme.text }]}>
                                            {formatDisplayedDate(endDate)}
                                        </ThemedText>
                                        <MaterialCommunityIcons name="calendar-month-outline" size={18} color={theme.primary} />
                                    </Pressable>
                                </View>
                            </View>

                            <View style={styles.actionsGroup}>
                                <Button
                                    mode="contained"
                                    onPress={handleCalculate}
                                    icon="calendar-clock"
                                    buttonColor={theme.primary}
                                    textColor={theme.surface}
                                    style={styles.actionButton}
                                    labelStyle={styles.actionLabel}
                                    loading={isLoadingData}
                                    disabled={isLoadingData}
                                >
                                    محاسبه
                                </Button>

                                <Button
                                    mode="outlined"
                                    onPress={handleReset}
                                    icon="refresh"
                                    textColor={theme.primary}
                                    style={[styles.actionButton, styles.resetButton, { borderColor: theme.border }]}
                                    labelStyle={styles.actionLabel}
                                >
                                    بازنشانی
                                </Button>
                            </View>

                            {result !== null ? (
                                <Card style={[styles.breakdownCard, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                                    <Card.Content style={styles.breakdownContent}>
                                        <View style={styles.summaryBoxHeader}>
                                            <View style={[styles.summaryBoxContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                                <ThemedText type="small" style={[styles.resultLabel, { color: theme.textSecondary }]}>
                                                    مجموع روزهای مرخصی استفاده نشده
                                                </ThemedText>
                                                <ThemedText type="largeTitle" style={[styles.amountValue, { color: theme.primary }]}>
                                                    {formattedResult}
                                                </ThemedText>
                                            </View>
                                        </View>

                                        <View style={styles.breakdownSectionHeader}>
                                            <ThemedText type="smallBold" style={[styles.breakdownSectionTitle, { color: theme.text }]}>
                                                جزئیات محاسبه
                                            </ThemedText>
                                            <Pressable
                                                onPress={() => setShowDetailedBreakdown((prev) => !prev)}
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

                                        {showDetailedBreakdown && calculationDetails ? (
                                            <View style={styles.breakdownGrid}>
                                                <View style={[styles.breakdownItemCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                                    <View style={styles.breakdownItemHeaderRow}>
                                                        <ThemedText type="smallBold" style={[styles.breakdownItemTitle, { color: theme.text }]}>
                                                            خلاصه محاسبه
                                                        </ThemedText>
                                                    </View>

                                                    <View style={styles.breakdownDetailGrid}>
                                                        {calculationDetails.totalMonthsWorked <= 12 ? (
                                                            <>


                                                                <View style={[styles.breakdownDetailBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                                                                    <ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>
                                                                        مجموع ماه‌های کارکرد
                                                                    </ThemedText>
                                                                    <ThemedText type="smallBold" style={[styles.detailValue, { color: theme.text }]}>
                                                                        {toPersianDigits(String(calculationDetails.totalMonthsWorked))} ماه
                                                                    </ThemedText>
                                                                </View>

                                                                <View style={[styles.breakdownDetailBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                                                                    <ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>
                                                                        روش محاسبه
                                                                    </ThemedText>
                                                                    <ThemedText type="smallBold" style={[styles.detailValue, { color: theme.text }]}>
                                                                        روش ۱
                                                                    </ThemedText>
                                                                </View>

                                                                <View style={[styles.breakdownDetailBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                                                                    <ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>
                                                                        روزهای مرخصی
                                                                    </ThemedText>
                                                                    <ThemedText type="smallBold" style={[styles.detailValue, { color: theme.primary }]}>
                                                                        {formatNumber(calculationDetails.totalDays)}
                                                                    </ThemedText>
                                                                </View>
                                                            </>
                                                        ) : (
                                                            <>

                                                                <View style={[styles.breakdownDetailBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                                                                    <ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>
                                                                        مجموع ماه‌های کارکرد
                                                                    </ThemedText>
                                                                    <ThemedText type="smallBold" style={[styles.detailValue, { color: theme.text }]}>
                                                                        {toPersianDigits(String(calculationDetails.totalMonthsWorked))} ماه
                                                                    </ThemedText>
                                                                </View>

                                                                <View style={[styles.breakdownDetailBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                                                                    <ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>
                                                                        سال کامل
                                                                    </ThemedText>
                                                                    <ThemedText type="smallBold" style={[styles.detailValue, { color: theme.text }]}>
                                                                        {toPersianDigits(String(calculationDetails.fullYears))} سال
                                                                    </ThemedText>
                                                                </View>

                                                                <View style={[styles.breakdownDetailBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                                                                    <ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>
                                                                        ماه مازاد
                                                                    </ThemedText>
                                                                    <ThemedText type="smallBold" style={[styles.detailValue, { color: theme.text }]}>
                                                                        {toPersianDigits(String(calculationDetails.remainingMonths))} ماه
                                                                    </ThemedText>
                                                                </View>

                                                                <View style={[styles.breakdownDetailBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                                                                    <ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>
                                                                        روزهای مرخصی سال‌های کامل
                                                                    </ThemedText>
                                                                    <ThemedText type="smallBold" style={[styles.detailValue, { color: theme.primary }]}>
                                                                        {formatNumber(calculationDetails.yearDays)}
                                                                    </ThemedText>
                                                                </View>

                                                                <View style={[styles.breakdownDetailBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                                                                    <ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>
                                                                        روزهای مرخصی ماه‌های مازاد
                                                                    </ThemedText>
                                                                    <ThemedText type="smallBold" style={[styles.detailValue, { color: theme.primary }]}>
                                                                        {formatNumber(calculationDetails.remainingMonthDays)}
                                                                    </ThemedText>
                                                                </View>

                                                                <View style={[styles.breakdownDetailBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                                                                    <ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>
                                                                        روش محاسبه
                                                                    </ThemedText>
                                                                    <ThemedText type="smallBold" style={[styles.detailValue, { color: theme.text }]}>
                                                                        روش ۲
                                                                    </ThemedText>
                                                                </View>

                                                                <View style={[styles.breakdownDetailBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                                                                    <ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>
                                                                        مجموع روزهای مرخصی
                                                                    </ThemedText>
                                                                    <ThemedText type="smallBold" style={[styles.detailValue, { color: theme.primary }]}>
                                                                        {formatNumber(calculationDetails.totalDays)}
                                                                    </ThemedText>
                                                                </View>
                                                            </>
                                                        )}
                                                    </View>
                                                </View>
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
    pageTitle: {
        fontSize: 16,
        lineHeight: 22,
        fontFamily: 'Vazirmatn-Bold',
    },
    pageDescription: {
        lineHeight: 20,
        fontSize: 12,
    },
    formulaBox: {
        borderRadius: Radius.md,
        borderWidth: StyleSheet.hairlineWidth,
        paddingHorizontal: Spacing.two,
        paddingVertical: Spacing.two,
        gap: Spacing.one,
    },
    formulaLabel: {
        fontSize: 11,
    },
    formulaValue: {
        lineHeight: 20,
        fontSize: 12,
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
    sectionLabel: {
        fontSize: 11,
    },
    dateInput: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: Spacing.one,
        paddingHorizontal: Spacing.two,
        paddingVertical: Spacing.two,
        borderRadius: 12,
        borderWidth: StyleSheet.hairlineWidth,
    },
    fieldValue: {
        fontSize: 13,
        flex: 1,
    },
    actionsGroup: {
        flexDirection: 'row',
        gap: Spacing.two,
    },
    actionButton: {
        flex: 1,
        borderRadius: 12,
    },
    resetButton: {
        borderWidth: 1,
    },
    actionLabel: {
        fontFamily: 'Vazirmatn-Bold',
        fontSize: 12,
    },
    resultCard: {
        borderRadius: 12,
        borderWidth: 1,
        marginTop: Spacing.two,
        overflow: 'hidden',
    },
    resultContent: {
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
    resultLabel: {
        fontSize: 11,
    },
    amountValue: {
        fontSize: 18,
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
        fontFamily: 'Vazirmatn-Bold',
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
        fontSize: 10,
    },
    detailValue: {
        fontSize: 12,
    },
});
