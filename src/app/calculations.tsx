import { MaterialCommunityIcons } from '@expo/vector-icons';
import { toJalaali } from 'jalaali-js';
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
  calculateSalaryFromPeriodData,
  parseDateInput,
  type SalaryCalculationResult,
  type SalaryPeriodBucket,
} from '@/utils/salary-calculation';

export default function CalculationsScreen() {
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
  const [periodBuckets, setPeriodBuckets] = useState<SalaryPeriodBucket[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [result, setResult] = useState<SalaryCalculationResult | null>(null);
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
            })),
          });
        }

        if (isMounted) {
          setPeriodBuckets(buckets);
          setAvailableYears(years.map((year) => year.year));
        }
      } catch {
        if (isMounted) {
          // Handle error silently or show in snackbar if needed
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

    if (!parsedStart || !parsedEnd) {
      setResult(null);
      return;
    }

    if (parsedStart.year > parsedEnd.year || (parsedStart.year === parsedEnd.year && parsedStart.month > parsedEnd.month) ||
      (parsedStart.year === parsedEnd.year && parsedStart.month === parsedEnd.month && parsedStart.day > parsedEnd.day)) {
      setResult(null);
      return;
    }

    if (periodBuckets.length === 0) {
      setResult(null);
      return;
    }

    const calculation = calculateSalaryFromPeriodData(parsedStart, parsedEnd, periodBuckets);

    if (calculation.breakdown.length === 0) {
      setResult(null);
      return;
    }

    setResult(calculation);
    setShowDetailedBreakdown(false);
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
                    کارت محاسبه مزد
                  </ThemedText>
                  <ThemedText type="small" style={[styles.pageDescription, { color: theme.textSecondary }]}> 
                    بازه‌ی زمانی خود را انتخاب کنید تا مبلغ بر اساس داده‌های دوره‌های ثبت‌شده محاسبه شود.
                  </ThemedText>
                </View>
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

              <View style={styles.actionsGroup}>
                <Button
                  mode="contained"
                  onPress={handleCalculate}
                  icon="calculator-variant"
                  style={styles.actionButton}
                  labelStyle={styles.actionLabel}
                  buttonColor={theme.primary}
                  textColor={theme.surface}
                  loading={isLoadingData}
                  disabled={isLoadingData}
                >
                  محاسبه
                </Button>

                {result && result.breakdown.length > 0 ? (
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

              {result && result.breakdown.length > 0 ? (
                <Card style={[styles.breakdownCard, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}> 
                  <Card.Content style={styles.breakdownContent}>
                    <View style={styles.breakdownHeaderRow}>
                      <View style={styles.breakdownHeaderTextBlock}>
                        <View style={styles.breakdownTitleRow}>
                          <View style={[styles.breakdownIconBadge, { backgroundColor: theme.primaryContainer }]}> 
                            <MaterialCommunityIcons name="calculator-variant-outline" size={18} color={theme.primary} />
                          </View>
                          <View style={styles.breakdownTitleInner}>
                            <ThemedText type="smallBold" style={[styles.sectionTitle, { color: theme.text }]}> 
                              جزئیات محاسبه
                            </ThemedText>
                            <View style={[styles.breakdownSummaryPill, { backgroundColor: theme.surface, borderColor: theme.border, marginTop: Spacing.one }]}> 
                              <ThemedText type="smallBold" style={[styles.pillText, { color: theme.primary }]}> 
                                {`بازه: ${formatDisplayedDate(startDate)} تا ${formatDisplayedDate(endDate)}`}
                              </ThemedText>
                            </View>
                          </View>
                        </View>
                      </View>
                    </View>

                    <View style={styles.summaryBoxHeader}>
                      <View style={[styles.summaryBoxContent, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
                        <ThemedText type="small" style={[styles.summaryLabel, { color: theme.textSecondary }]}> 
                          مبلغ قابل محاسبه
                        </ThemedText>
                        <ThemedText type="largeTitle" style={[styles.amountValue, { color: theme.primary }]}> 
                          {isLoadingData ? 'در حال بارگذاری...' : formattedResult}
                        </ThemedText>
                      </View>
                      <View style={[styles.formulaBox, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
                        <ThemedText type="small" style={[styles.formulaLabel, { color: theme.textSecondary }]}> 
                          فرمول محاسبه
                        </ThemedText>
                        <ThemedText type="small" style={[styles.formulaValue, { color: theme.text }]}> 
                          مبلغ حداقل مزد روزانه مصوب شورای عالی کار در هر سال × تعداد روزهای کارکرد هر سال
                        </ThemedText>
                      </View>
                      <View style={[styles.formulaBox, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
                        <ThemedText type="small" style={[styles.formulaLabel, { color: theme.textSecondary }]}> 
                          توضیح ساده
                        </ThemedText>
                        <ThemedText type="small" style={[styles.formulaValue, { color: theme.textSecondary }]}> 
                          اگر بازه‌ی انتخابی شما از چند دوره عبور کند، هر دوره جداگانه حساب می‌شود. فقط روزهایی از آن دوره که داخل بازه‌ی شما قرار می‌گیرند در نظر گرفته می‌شوند و سپس این مقادیر با هم جمع می‌شوند.
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
                              <View style={[styles.breakdownSummaryPill, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}> 
                                <ThemedText type="smallBold" style={[styles.breakdownPillValue, { color: theme.primary }]}> 
                                  {`${toPersianDigits(String(item.daysCovered))} روز پوشش`}
                                </ThemedText>
                              </View>
                            </View>

                            <View style={styles.breakdownDetailGrid}>
                              <View style={[styles.breakdownDetailBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}> 
                                <ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}> 
                                  حداقل مزد روزانه
                                </ThemedText>
                                <ThemedText type="smallBold" style={[styles.detailValue, { color: theme.text }]}> 
                                  {toPersianDigits(formatCurrency(item.dailyMinimumWage ?? 0))}
                                </ThemedText>
                              </View>
                              <View style={[styles.breakdownDetailBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}> 
                                <ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}> 
                                  مبلغ دوره
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
  summaryBox: {
    borderRadius: 16,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
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
  input: {
    width: '100%',
    fontFamily: 'Vazirmatn-Regular',
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
  breakdownCard: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  breakdownContent: {
    gap: Spacing.two,
  },
  breakdownHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  breakdownHeaderTextBlock: {
    flex: 1,
    flexDirection: 'column',
    gap: Spacing.two,
  },
  breakdownTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  breakdownIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breakdownTitleInner: {
    flex: 1,
    minWidth: 0,
  },
  breakdownSummaryPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  breakdownSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  breakdownSectionTitle: {
    fontFamily: 'Vazirmatn-Bold',
    fontSize: 13,
    lineHeight: 20,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.one,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  toggleButtonLabel: {
    fontFamily: 'Vazirmatn-Medium',
    fontSize: 12.5,
    lineHeight: 18,
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
  breakdownItemHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  breakdownDetailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  breakdownDetailBox: {
    flex: 1,
    minWidth: 120,
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
  sectionTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Vazirmatn-Bold',
  },
  pillText: {
    fontSize: 12.5,
    lineHeight: 18,
    fontFamily: 'Vazirmatn-Bold',
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
  explanationText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 17,
    fontFamily: 'Vazirmatn-Regular',
    textAlign: 'right',
  },
  breakdownItemTitle: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: 'Vazirmatn-Bold',
  },
  breakdownPillValue: {
    fontSize: 12.5,
    lineHeight: 18,
    fontFamily: 'Vazirmatn-Bold',
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
