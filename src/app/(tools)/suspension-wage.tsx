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
  calculateSuspensionWageFromPeriodData,
  parseDateInput,
  type EntitledSeniorityWorkshopType,
  type SalaryPeriodBucket,
  type SuspensionWageCalculationResult,
  type UnusedLeaveWageMaritalStatus,
} from '@/utils/salary-calculation';

type PickerTarget = 'start' | 'end' | 'employment';

export default function SuspensionWageScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const currentJalaliDate = useMemo(() => {
    const today = new Date();
    return toJalaali(
      today.getFullYear(),
      today.getMonth() + 1,
      today.getDate(),
    );
  }, []);
  const currentPersianYear = currentJalaliDate.jy;
  const defaultStartDate = `${currentPersianYear}/01/01`;
  const defaultEndDate = `${currentPersianYear}/12/${jalaaliMonthLength(currentPersianYear, 12)}`;
  const defaultEmploymentDate = `${currentPersianYear - 1}/01/01`;

  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [employmentDate, setEmploymentDate] = useState(defaultEmploymentDate);
  const [workshopType, setWorkshopType] =
    useState<EntitledSeniorityWorkshopType>("unclassified");
  const [settledThrough1391, setSettledThrough1391] = useState(false);
  const [maritalStatus, setMaritalStatus] =
    useState<UnusedLeaveWageMaritalStatus>("single");
  const [childrenCount, setChildrenCount] = useState(0);
  const [jobGroups, setJobGroups] = useState<
    { id: number; group_number: number; sort_order: number }[]
  >([]);
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [groupMenuVisible, setGroupMenuVisible] = useState(false);
  const [childrenMenuVisible, setChildrenMenuVisible] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);
  const [periodBuckets, setPeriodBuckets] = useState<SalaryPeriodBucket[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [result, setResult] = useState<SuspensionWageCalculationResult | null>(
    null,
  );
  const [dailyWorkTime, setDailyWorkTime] = useState('07:20');
  const [showDetails, setShowDetails] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        await seedFromJsonAsset();
        const [years, groups] = await Promise.all([
          fetchYears(),
          fetchJobGroups(),
        ]);
        const buckets: SalaryPeriodBucket[] = [];

        for (const year of years) {
          const periods = await fetchPeriodsByYearId(year.id);
          const mappedPeriods = await Promise.all(
            periods.map(async (period) => ({
              period_index: period.period_index,
              month_count: period.month_count,
              daily_minimum_wage: period.daily_minimum_wage,
              percent_increase: period.percent_increase,
              seniority_base: period.seniority_base,
              seniority_base_by_group: Object.fromEntries(
                (await fetchSeniorityBaseByGroup(period.id)).map((row) => {
                  const group = groups.find(
                    (item) => item.id === row.job_group_id,
                  );
                  return [
                    group?.group_number ?? row.job_group_id,
                    Number(row.base_value),
                  ];
                }),
              ),
              monthly_housing_single: period.monthly_housing_single,
              monthly_housing_married: period.monthly_housing_married,
              monthly_single_allowance: period.monthly_single_allowance,
              monthly_married_allowance: period.monthly_married_allowance,
              child_allowance: period.child_allowance,
              marital_allowance: period.marital_allowance,
            })),
          );

          if (mappedPeriods.length > 0) {
            buckets.push({ year: year.year, periods: mappedPeriods });
          }
        }

        if (isMounted) {
          setPeriodBuckets(buckets);
          setJobGroups(groups);
          setSelectedGroup(groups[0]?.group_number ?? null);
          setAvailableYears(years.map((year) => year.year));
        }
      } catch {
        if (isMounted) {
          setSnackbarMessage(
            "خطا در بارگذاری داده‌ها. لطفاً دوباره تلاش کنید.",
          );
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

  const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
  const toPersianDigits = (value: string | number) =>
    String(value).replace(/\d/g, (digit) => persianDigits[Number(digit)]);
  const formatCurrency = (value: number) =>
    `${new Intl.NumberFormat("fa-IR").format(Math.round(value))} ریال`;
  const formatNumber = (value: number) =>
    toPersianDigits(Number.isInteger(value) ? String(value) : value.toFixed(2));
  const formatDate = (value: string) => {
    const parsed = parseDateInput(value);
    return parsed
      ? `${toPersianDigits(String(parsed.year))}/${toPersianDigits(String(parsed.month).padStart(2, "0"))}/${toPersianDigits(String(parsed.day).padStart(2, "0"))}`
      : "";
  };
  const compareDates = (left: string, right: string) => {
    const parsedLeft = parseDateInput(left);
    const parsedRight = parseDateInput(right);
    if (!parsedLeft || !parsedRight) return 0;
    return (
      parsedLeft.year * 10000 +
      parsedLeft.month * 100 +
      parsedLeft.day -
      (parsedRight.year * 10000 + parsedRight.month * 100 + parsedRight.day)
    );
  };
  const canUseSettlementPath =
    (parseDateInput(employmentDate)?.year ?? 0) <= 1391;

  const openPicker = (target: PickerTarget) => setPickerTarget(target);
  const closePicker = () => setPickerTarget(null);
  const handleDateSelect = (value: string) => {
    if (pickerTarget === "employment") {
      if (compareDates(value, startDate) > 0) {
        setSnackbarMessage(
          "تاریخ استخدام باید برابر یا قبل از تاریخ شروع تعلیق باشد.",
        );
        setSnackbarVisible(true);
        closePicker();
        return;
      }
      setEmploymentDate(value);
      if ((parseDateInput(value)?.year ?? 0) > 1391) {
        setSettledThrough1391(false);
      }
    } else if (pickerTarget === "start") {
      setStartDate(value);
      if (compareDates(value, endDate) > 0) setEndDate(value);
    } else if (pickerTarget === "end") {
      if (compareDates(value, startDate) < 0) {
        setSnackbarMessage(
          "تاریخ پایان تعلیق باید برابر یا بزرگ‌تر از تاریخ شروع باشد.",
        );
        setSnackbarVisible(true);
      } else {
        setEndDate(value);
      }
    }
    closePicker();
  };

  const handleCalculate = () => {
    const suspensionStart = parseDateInput(startDate);
    const suspensionEnd = parseDateInput(endDate);
    const employmentStart = parseDateInput(employmentDate);
    if (!suspensionStart || !suspensionEnd || !employmentStart) {
      setSnackbarMessage("تاریخ‌های واردشده معتبر نیستند.");
      setSnackbarVisible(true);
      return;
    }
    if (compareDates(employmentDate, startDate) > 0) {
      setSnackbarMessage(
        "تاریخ استخدام باید برابر یا قبل از تاریخ شروع تعلیق باشد.",
      );
      setSnackbarVisible(true);
      return;
    }
    if (workshopType === "classified" && selectedGroup == null) {
      setSnackbarMessage("گروه شغلی را انتخاب کنید.");
      setSnackbarVisible(true);
      return;
    }

    const calculation = calculateSuspensionWageFromPeriodData(
      suspensionStart,
      suspensionEnd,
      employmentStart,
      periodBuckets,
      workshopType,
      selectedGroup ?? undefined,
      settledThrough1391,
      maritalStatus,
      childrenCount,
    );

    if (calculation.breakdown.length === 0) {
      setSnackbarMessage("برای بازهٔ انتخابی دادهٔ قابل محاسبه پیدا نشد.");
      setSnackbarVisible(true);
      setResult(null);
      return;
    }
    setResult(scaleWageCalculationResult(calculation, getDailyWorkRatio(getDailyWorkMinutes(dailyWorkTime))));
    setShowDetails(false);
  };

  const datePickerValue =
    pickerTarget === "start"
      ? startDate
      : pickerTarget === "end"
        ? endDate
        : employmentDate;
  const datePickerTitle =
    pickerTarget === "start"
      ? "انتخاب شروع تعلیق"
      : pickerTarget === "end"
        ? "انتخاب پایان تعلیق"
        : "انتخاب تاریخ استخدام";

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
          <Card
            elevation={1}
            style={[
              styles.card,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Card.Content style={styles.cardContent}>
              <View style={styles.headerRow}>
                <View style={styles.headerText}>
                  <ThemedText
                    type="bodyBold"
                    style={[styles.pageTitle, { color: theme.text }]}
                  >
                    محاسبه حق‌السعی ایام تعلیق
                  </ThemedText>
                  <ThemedText
                    type="small"
                    style={[
                      styles.pageDescription,
                      { color: theme.textSecondary },
                    ]}
                  >
                    محاسبه حق‌السعی ایام تعلیق موضوع ماده ۳۴ قانون کار و ماده ۶۷
                    آیین دادرسی کار
                  </ThemedText>
                </View>
              </View>

              <View
                style={[
                  styles.formulaBox,
                  {
                    backgroundColor: theme.surfaceVariant,
                    borderColor: theme.border,
                  },
                ]}
              >
                <ThemedText
                  type="small"
                  style={[styles.formulaLabel, { color: theme.textSecondary }]}
                >
                  فرمول محاسبه
                </ThemedText>
                <ThemedText
                  type="small"
                  style={[styles.formulaValue, { color: theme.text }]}
                >
                  مبلغ کل = جمعِ مبلغ هر بازه؛ مبلغ هر بازه = تعداد روزهای تعلیق
                  در بازه × (حداقل مزد روزانه + پایه سنوات استحقاقی بازه + سهم
                  روزانه حق مسکن + سهم روزانه حق عائله‌مندی + سهم روزانه بن
                  کارگری + سهم روزانه حق تأهل)؛ سهم روزانه هر مزایای ماهیانه =
                  مبلغ ماهیانه ÷ تعداد روزهای همان ماه
                </ThemedText>
              </View>

              <View style={styles.metricsRow}>
                <DateInputField
                  label="تاریخ شروع تعلیق"
                  value={startDate}
                  onPress={() => openPicker('start')}
                  formatValue={formatDate}
                />
                <DateInputField
                  label="تاریخ پایان تعلیق"
                  value={endDate}
                  onPress={() => openPicker('end')}
                  formatValue={formatDate}
                />
              </View>

              <View
                style={[
                  styles.optionSection,
                  {
                    backgroundColor: theme.surfaceVariant,
                    borderColor: theme.border,
                  },
                ]}
              >
                <DateInputField
                  label="تاریخ استخدام"
                  value={employmentDate}
                  onPress={() => openPicker('employment')}
                  formatValue={formatDate}
                  iconName="calendar-account-outline"
                  helperText="جهت محاسبه پایه سنوات استحقاقی و اعمال آن در محاسبات"
                />
              </View>

              <View
                style={[
                  styles.optionSection,
                  {
                    backgroundColor: theme.surfaceVariant,
                    borderColor: theme.border,
                  },
                ]}
              >
                <ThemedText
                  type="small"
                  style={[styles.sectionLabel, { color: theme.textSecondary }]}
                >
                  وضعیت تأهل
                </ThemedText>
                <View style={styles.optionsRow}>
                  <Pressable
                    onPress={() => setMaritalStatus("single")}
                    style={[
                      styles.optionButton,
                      {
                        backgroundColor:
                          maritalStatus === "single"
                            ? theme.primary
                            : theme.surface,
                        borderColor:
                          maritalStatus === "single"
                            ? theme.primary
                            : theme.border,
                      },
                    ]}
                  >
                    <ThemedText
                      type="smallBold"
                      style={{
                        color:
                          maritalStatus === "single"
                            ? theme.surface
                            : theme.text,
                      }}
                    >
                      مجرد
                    </ThemedText>
                  </Pressable>
                  <Pressable
                    onPress={() => setMaritalStatus("married")}
                    style={[
                      styles.optionButton,
                      {
                        backgroundColor:
                          maritalStatus === "married"
                            ? theme.primary
                            : theme.surface,
                        borderColor:
                          maritalStatus === "married"
                            ? theme.primary
                            : theme.border,
                      },
                    ]}
                  >
                    <ThemedText
                      type="smallBold"
                      style={{
                        color:
                          maritalStatus === "married"
                            ? theme.surface
                            : theme.text,
                      }}
                    >
                      متأهل
                    </ThemedText>
                  </Pressable>
                </View>
              </View>

              <View
                style={[
                  styles.optionSection,
                  {
                    backgroundColor: theme.surfaceVariant,
                    borderColor: theme.border,
                  },
                ]}
              >
                <ThemedText
                  type="small"
                  style={[styles.sectionLabel, { color: theme.textSecondary }]}
                >
                  تعداد فرزندان واجد شرایط
                </ThemedText>
                <Menu
                  visible={childrenMenuVisible}
                  onDismiss={() => setChildrenMenuVisible(false)}
                  anchor={
                    <Pressable
                      onPress={() => setChildrenMenuVisible(true)}
                      style={[
                        styles.dateInput,
                        {
                          backgroundColor: theme.surface,
                          borderColor: theme.border,
                        },
                      ]}
                    >
                      <ThemedText
                        type="smallBold"
                        style={[styles.fieldValue, { color: theme.text }]}
                      >{`${formatNumber(childrenCount)} فرزند`}</ThemedText>
                      <MaterialCommunityIcons
                        name="account-group-outline"
                        size={18}
                        color={theme.primary}
                      />
                    </Pressable>
                  }
                  contentStyle={{
                    borderRadius: 16,
                    backgroundColor: theme.surface,
                  }}
                >
                  {Array.from({ length: 13 }, (_, index) => (
                    <FontAwareMenuItem
                      key={index}
                      onPress={() => {
                        setChildrenCount(index);
                        setChildrenMenuVisible(false);
                      }}
                      title={`${toPersianDigits(String(index))} فرزند`}
                      titleStyle={{
                        fontFamily: "AppFont-Regular",
                        color: theme.text,
                      }}
                    />
                  ))}
                </Menu>
              </View>

              <WorkshopTypeSelector
                value={workshopType}
                onValueChange={setWorkshopType}
              />

              {workshopType === "classified" ? (
                <View
                  style={[
                    styles.optionSection,
                    {
                      backgroundColor: theme.surfaceVariant,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <ThemedText
                    type="small"
                    style={[
                      styles.sectionLabel,
                      { color: theme.textSecondary },
                    ]}
                  >
                    گروه شغلی
                  </ThemedText>
                  <Menu
                    visible={groupMenuVisible}
                    onDismiss={() => setGroupMenuVisible(false)}
                    anchor={
                      <Pressable
                        onPress={() => setGroupMenuVisible(true)}
                        style={[
                          styles.dateInput,
                          {
                            backgroundColor: theme.surface,
                            borderColor: theme.border,
                          },
                        ]}
                      >
                        <ThemedText
                          type="smallBold"
                          style={[styles.fieldValue, { color: theme.text }]}
                        >
                          {selectedGroup == null
                            ? "انتخاب گروه شغلی"
                            : `گروه ${toPersianDigits(String(selectedGroup))}`}
                        </ThemedText>
                        <MaterialCommunityIcons
                          name="chevron-down"
                          size={18}
                          color={theme.primary}
                        />
                      </Pressable>
                    }
                    contentStyle={{
                      borderRadius: 16,
                      backgroundColor: theme.surface,
                    }}
                  >
                    {jobGroups.map((group) => (
                      <FontAwareMenuItem
                        key={group.id}
                        onPress={() => {
                          setSelectedGroup(group.group_number);
                          setGroupMenuVisible(false);
                        }}
                        title={`گروه ${toPersianDigits(String(group.group_number))}`}
                        titleStyle={{
                          fontFamily: "AppFont-Regular",
                          color: theme.text,
                        }}
                      />
                    ))}
                  </Menu>
                </View>
              ) : null}

              <SettlementThrough1391Field
                checked={settledThrough1391}
                enabled={canUseSettlementPath}
                onChange={setSettledThrough1391}
              />

              <DailyWorkTimeField value={dailyWorkTime} onChange={setDailyWorkTime} />
              <View style={styles.actionsGroup}>
                <Button
                  mode="contained"
                  onPress={handleCalculate}
                  icon="scale-balance"
                  buttonColor={theme.primary}
                  textColor={theme.surface}
                  style={styles.actionButton}
                  labelStyle={styles.actionLabel}
                  loading={isLoadingData}
                  disabled={isLoadingData}
                >
                  محاسبه
                </Button>
              </View>

              {result ? (
                <Card
                  style={[
                    styles.resultCard,
                    {
                      backgroundColor: theme.surfaceVariant,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Card.Content style={styles.resultContent}>
                    <View
                      style={[
                        styles.summaryBox,
                        {
                          backgroundColor: theme.surface,
                          borderColor: theme.border,
                        },
                      ]}
                    >
                      <ThemedText
                        type="small"
                        style={[
                          styles.summaryLabel,
                          { color: theme.textSecondary },
                        ]}
                      >
                        مبلغ کل حق‌السعی ایام تعلیق
                      </ThemedText>
                      <ThemedText
                        type="largeTitle"
                        style={[styles.amountValue, { color: theme.primary }]}
                      >
                        {toPersianDigits(formatCurrency(result.totalAmount))}
                      </ThemedText>
                    </View>
                    <View style={styles.breakdownHeader}>
                      <ThemedText
                        type="smallBold"
                        style={[
                          styles.breakdownSectionTitle,
                          { color: theme.text },
                        ]}
                      >
                        جزئیات محاسبه
                      </ThemedText>
                      <Pressable
                        onPress={() => setShowDetails((value) => !value)}
                        style={[
                          styles.toggleButton,
                          {
                            backgroundColor: theme.surface,
                            borderColor: theme.border,
                          },
                        ]}
                      >
                        <ThemedText
                          type="smallBold"
                          style={[
                            styles.toggleButtonLabel,
                            { color: theme.primary },
                          ]}
                        >
                          {showDetails ? "عدم نمایش" : "نمایش جزئیات"}
                        </ThemedText>
                        <MaterialCommunityIcons
                          name={showDetails ? "chevron-up" : "chevron-down"}
                          size={18}
                          color={theme.primary}
                        />
                      </Pressable>
                    </View>
                    {showDetails ? (
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
                              <ThemedText
                                type="smallBold"
                                style={[
                                  styles.breakdownItemTitle,
                                  { color: theme.text },
                                ]}
                              >{`سال ${toPersianDigits(String(item.year))}، دوره ${toPersianDigits(String(item.periodIndex))}`}</ThemedText>
                            </View>
                            <View style={styles.breakdownDetailGrid}>
                              <View style={[styles.detailBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                                <ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>نوع بازه</ThemedText>
                                <ThemedText type="smallBold" style={[styles.detailValue, { color: theme.text }]}>{item.phase === 'before-anniversary' ? 'پیش از سالگرد استخدام' : 'بعد از سالگرد استخدام'}</ThemedText>
                              </View>
                              <View
                                style={[
                                  styles.detailBox,
                                  {
                                    backgroundColor: theme.primaryContainer,
                                    borderColor: theme.primary,
                                  },
                                ]}
                              >
                                <ThemedText
                                  type="small"
                                  style={[
                                    styles.detailLabel,
                                    { color: theme.textSecondary },
                                  ]}
                                >
                                  بازهٔ تعلیق
                                </ThemedText>
                                <ThemedText
                                  type="smallBold"
                                  style={[
                                    styles.detailValue,
                                    { color: theme.primary },
                                  ]}
                                >{`${formatDate(`${item.startDate.year}/${item.startDate.month}/${item.startDate.day}`)} تا ${formatDate(`${item.endDate.year}/${item.endDate.month}/${item.endDate.day}`)}`}</ThemedText>
                              </View>
                              <View
                                style={[
                                  styles.detailBox,
                                  {
                                    backgroundColor: theme.surfaceVariant,
                                    borderColor: theme.border,
                                  },
                                ]}
                              >
                                <ThemedText
                                  type="small"
                                  style={[
                                    styles.detailLabel,
                                    { color: theme.textSecondary },
                                  ]}
                                >
                                  تعداد روزهای تعلیق
                                </ThemedText>
                                <ThemedText
                                  type="smallBold"
                                  style={[
                                    styles.detailValue,
                                    { color: theme.text },
                                  ]}
                                >{`${formatNumber(item.daysCovered)} روز`}</ThemedText>
                              </View>
                              <View
                                style={[
                                  styles.detailBox,
                                  {
                                    backgroundColor: theme.surfaceVariant,
                                    borderColor: theme.border,
                                  },
                                ]}
                              >
                                <ThemedText
                                  type="small"
                                  style={[
                                    styles.detailLabel,
                                    { color: theme.textSecondary },
                                  ]}
                                >
                                  حداقل مزد روزانه
                                </ThemedText>
                                <ThemedText
                                  type="smallBold"
                                  style={[
                                    styles.detailValue,
                                    { color: theme.text },
                                  ]}
                                >
                                  {toPersianDigits(
                                    formatCurrency(item.dailyMinimumWage),
                                  )}
                                </ThemedText>
                              </View>
                              <View
                                style={[
                                  styles.detailBox,
                                  {
                                    backgroundColor: theme.surfaceVariant,
                                    borderColor: theme.border,
                                  },
                                ]}
                              >
                                <ThemedText
                                  type="small"
                                  style={[
                                    styles.detailLabel,
                                    { color: theme.textSecondary },
                                  ]}
                                >
                                  {workshopType === 'classified' ? 'پایه سنوات استحقاقی روزانه گروه شغلی' : 'پایه سنوات استحقاقی روزانه'}
                                </ThemedText>
                                <ThemedText
                                  type="smallBold"
                                  style={[
                                    styles.detailValue,
                                    { color: theme.text },
                                  ]}
                                >
                                  {toPersianDigits(
                                    formatCurrency(item.dailySeniority),
                                  )}
                                </ThemedText>
                              </View>
                              <View
                                style={[
                                  styles.detailBox,
                                  {
                                    backgroundColor: theme.surfaceVariant,
                                    borderColor: theme.border,
                                  },
                                ]}
                              >
                                <ThemedText
                                  type="small"
                                  style={[
                                    styles.detailLabel,
                                    { color: theme.textSecondary },
                                  ]}
                                >
                                  حق مسکن روزانه
                                </ThemedText>
                                <ThemedText
                                  type="smallBold"
                                  style={[
                                    styles.detailValue,
                                    { color: theme.text },
                                  ]}
                                >
                                  {toPersianDigits(
                                    formatCurrency(item.dailyHousingAllowance),
                                  )}
                                </ThemedText>
                              </View>
                              <View
                                style={[
                                  styles.detailBox,
                                  {
                                    backgroundColor: theme.surfaceVariant,
                                    borderColor: theme.border,
                                  },
                                ]}
                              >
                                <ThemedText
                                  type="small"
                                  style={[
                                    styles.detailLabel,
                                    { color: theme.textSecondary },
                                  ]}
                                >
                                  حق عائله‌مندی روزانه
                                </ThemedText>
                                <ThemedText
                                  type="smallBold"
                                  style={[
                                    styles.detailValue,
                                    { color: theme.text },
                                  ]}
                                >
                                  {toPersianDigits(
                                    formatCurrency(item.dailyChildAllowance),
                                  )}
                                </ThemedText>
                              </View>
                              <View
                                style={[
                                  styles.detailBox,
                                  {
                                    backgroundColor: theme.surfaceVariant,
                                    borderColor: theme.border,
                                  },
                                ]}
                              >
                                <ThemedText
                                  type="small"
                                  style={[
                                    styles.detailLabel,
                                    { color: theme.textSecondary },
                                  ]}
                                >
                                  بن کارگری روزانه
                                </ThemedText>
                                <ThemedText
                                  type="smallBold"
                                  style={[
                                    styles.detailValue,
                                    { color: theme.text },
                                  ]}
                                >
                                  {toPersianDigits(
                                    formatCurrency(item.dailyMonthlyAllowance),
                                  )}
                                </ThemedText>
                              </View>
                              <View
                                style={[
                                  styles.detailBox,
                                  {
                                    backgroundColor: theme.surfaceVariant,
                                    borderColor: theme.border,
                                  },
                                ]}
                              >
                                <ThemedText
                                  type="small"
                                  style={[
                                    styles.detailLabel,
                                    { color: theme.textSecondary },
                                  ]}
                                >
                                  حق تأهل روزانه
                                </ThemedText>
                                <ThemedText
                                  type="smallBold"
                                  style={[
                                    styles.detailValue,
                                    { color: theme.text },
                                  ]}
                                >
                                  {toPersianDigits(
                                    formatCurrency(item.dailyMaritalAllowance),
                                  )}
                                </ThemedText>
                              </View>
                              <View
                                style={[
                                  styles.detailBox,
                                  {
                                    backgroundColor: theme.primaryContainer,
                                    borderColor: theme.primary,
                                  },
                                ]}
                              >
                                <ThemedText
                                  type="small"
                                  style={[
                                    styles.detailLabel,
                                    { color: theme.textSecondary },
                                  ]}
                                >
                                  جمع مزد روزانه
                                </ThemedText>
                                <ThemedText
                                  type="smallBold"
                                  style={[
                                    styles.detailValue,
                                    { color: theme.primary },
                                  ]}
                                >
                                  {toPersianDigits(
                                    formatCurrency(item.dailyWage),
                                  )}
                                </ThemedText>
                              </View>
                              <View
                                style={[
                                  styles.detailBox,
                                  {
                                    backgroundColor: theme.primaryContainer,
                                    borderColor: theme.primary,
                                  },
                                ]}
                              >
                                <ThemedText
                                  type="small"
                                  style={[
                                    styles.detailLabel,
                                    { color: theme.textSecondary },
                                  ]}
                                >
                                  مبلغ این بازه
                                </ThemedText>
                                <ThemedText
                                  type="smallBold"
                                  style={[
                                    styles.detailValue,
                                    { color: theme.primary },
                                  ]}
                                >
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
        value={datePickerValue}
        title={datePickerTitle}
        onClose={closePicker}
        onSelect={handleDateSelect}
        availableYears={availableYears}
      />
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={{ backgroundColor: theme.error, borderRadius: Radius.md }}
      >
        {snackbarMessage}
      </Snackbar>
    </ThemedView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  safeArea: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing.four,
  },
  card: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  cardContent: {
    gap: Spacing.three,
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.three,
  },
  headerRow: { alignItems: "flex-start" },
  headerText: { flex: 1, gap: Spacing.one },
  pageTitle: { display: 'none', fontSize: 16, lineHeight: 22, fontFamily: "AppFont-Bold" },
  pageDescription: { fontSize: 13, lineHeight: 20 },
  formulaBox: {
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    gap: Spacing.one,
  },
  formulaLabel: { fontSize: 11 },
  formulaValue: { fontSize: 12, lineHeight: 20 },
  metricsRow: { flexDirection: "row", alignItems: "stretch", gap: Spacing.two },
  metricBox: {
    flex: 1,
    borderRadius: 12,
    padding: Spacing.two,
    gap: Spacing.one,
  },
  fieldGroup: { flex: 1, gap: Spacing.one },
  optionSection: {
    gap: Spacing.two,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.two,
  },
  workshopTypeSection: { gap: Spacing.two },
  sectionLabel: { fontSize: 11, fontFamily: "AppFont-Medium" },
  dateInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 48,
    gap: Spacing.one,
  },
  fieldValue: { flex: 1, fontSize: 13, lineHeight: 19 },
  optionsRow: { flexDirection: "row", gap: Spacing.two },
  optionButton: {
    flex: 1,
    minHeight: 44,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: Spacing.two,
    alignItems: "center",
    justifyContent: "center",
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.two,
  },
  checkText: { flex: 1, gap: Spacing.one },
  optionTitle: { fontSize: 13, lineHeight: 19, fontFamily: "AppFont-Bold" },
  optionDescription: {
    fontSize: 11,
    lineHeight: 20,
    fontFamily: "AppFont-Regular",
  },
  helpRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.one,
    marginTop: Spacing.one,
  },
  detailLabel: { fontSize: 10 },
  helpText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 20,
    fontFamily: "AppFont-Regular",
  },
  actionsGroup: {
    flexDirection: "row",
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  actionButton: { flex: 1, borderRadius: 12 },
  actionLabel: { fontFamily: "AppFont-Bold", fontSize: 12 },
  resultCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginTop: Spacing.two,
    overflow: "hidden",
  },
  resultContent: {
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
  },
  summaryBox: {
    width: "100%",
    alignItems: "center",
    gap: Spacing.one,
    padding: Spacing.two,
    borderRadius: 12,
    borderWidth: 1,
  },
  summaryLabel: { fontSize: 11 },
  amountValue: { fontSize: 18 },
  breakdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.one,
    paddingVertical: Spacing.one,
    gap: Spacing.one,
  },
  breakdownSectionTitle: { fontSize: 13, fontFamily: "AppFont-Bold" },
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  toggleButtonLabel: { fontSize: 11 },
  breakdownGrid: { gap: Spacing.two },
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
    borderBottomColor: "rgba(0, 0, 0, 0.12)",
  },
  breakdownItemTitle: { fontSize: 12, fontFamily: "AppFont-Bold" },
  breakdownDetailGrid: { gap: Spacing.one },
  detailBox: {
    alignItems: "center",
    gap: Spacing.half,
    padding: Spacing.one,
    borderRadius: 8,
    borderWidth: 1,
  },
  detailValue: { fontSize: 12 },
});
