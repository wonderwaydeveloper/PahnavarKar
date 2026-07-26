import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { Card } from 'react-native-paper';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import type { PeriodRecord } from '@/database/types';
import { periodUiLabels } from '@/database/ui';
import { useTheme } from '@/hooks/use-theme';

type PeriodDetailRow =
  | { kind: 'row'; label: string; value: number | string | null | undefined; currency?: boolean }
  | {
      kind: 'group';
      title: string;
      items: { label: string; value: number | string | null | undefined; currency?: boolean }[];
    };

interface PeriodCardProps {
  period: PeriodRecord;
  index: number;
  isExpanded: boolean;
  isWide: boolean;
  periodsLength: number;
  periodKey: string;
  onToggle: (periodKey: string) => void;
}

export function PeriodCard({
  period,
  index,
  isExpanded,
  isWide,
  periodsLength,
  periodKey,
  onToggle,
}: PeriodCardProps) {
  const theme = useTheme();

  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';

  const toPersianDigits = (value: string) =>
    value.replace(/\d/g, (digit) => persianDigits[Number(digit)]);

  const formatCurrency = (value: number | null | undefined) => {
    if (value == null) {
      return '-';
    }

    return `${value.toLocaleString('fa-IR')} ریال`;
  };

  const formatValue = (value: number | string | null | undefined, useCurrency = false) => {
    if (value == null || value === '') {
      return '-';
    }

    if (typeof value === 'number') {
      return useCurrency ? formatCurrency(value) : value.toLocaleString('fa-IR');
    }

    return toPersianDigits(String(value));
  };

  const getCompactTextStyle = (text: string, isValue = false, isTitle = false) => {
    const isLongText = text.length > 28;
    return {
      fontSize: isLongText ? 11.5 : 12.5,
      lineHeight: isLongText ? 16 : 18,
      textAlign: 'left' as const,
      fontFamily: isTitle || isValue ? 'Vazirmatn-Bold' : 'Vazirmatn-Regular',
      ...(isValue ? { fontSize: isLongText ? 12 : 13 } : {}),
    };
  };

  const getPeriodDetailRows = (periodItem: PeriodRecord): PeriodDetailRow[] => [
    { kind: 'row', label: periodUiLabels.month_count, value: periodItem.month_count },
    { kind: 'row', label: periodUiLabels.daily_minimum_wage, value: periodItem.daily_minimum_wage ?? null, currency: true },
    { kind: 'row', label: periodUiLabels.friday_work_per_day, value: periodItem.friday_work_per_day ?? null, currency: true },
    {
      kind: 'group',
      title: periodUiLabels.monthly_shift_work_group,
      items: [
        { label: periodUiLabels.monthly_shift_work_morning_evening_10, value: periodItem.monthly_shift_work_morning_evening_10, currency: true },
        { label: periodUiLabels.monthly_shift_work_morning_evening_night_15, value: periodItem.monthly_shift_work_morning_evening_night_15, currency: true },
        { label: periodUiLabels.monthly_shift_work_morning_night_or_evening_night_225, value: periodItem.monthly_shift_work_morning_night_or_evening_night_225, currency: true },
      ],
    },
    { kind: 'row', label: periodUiLabels.total_official_holidays, value: periodItem.total_official_holidays },
    { kind: 'row', label: periodUiLabels.seniority_base, value: periodItem.seniority_base, currency: true },
    { kind: 'row', label: periodUiLabels.overtime_per_hour, value: periodItem.overtime_per_hour, currency: true },
    { kind: 'row', label: periodUiLabels.night_work_per_hour, value: periodItem.night_work_per_hour, currency: true },
    {
      kind: 'group',
      title: periodUiLabels.monthly_allowance,
      items: [
        { label: 'مجرد', value: periodItem.monthly_single_allowance, currency: true },
        { label: 'متاهل', value: periodItem.monthly_married_allowance, currency: true },
      ],
    },
    {
      kind: 'group',
      title: periodUiLabels.housing_allowance,
      items: [
        { label: 'مجرد', value: periodItem.monthly_housing_single, currency: true },
        { label: 'متاهل', value: periodItem.monthly_housing_married, currency: true },
      ],
    },
    { kind: 'row', label: periodUiLabels.marital_allowance, value: periodItem.marital_allowance, currency: true },
    { kind: 'row', label: periodUiLabels.child_allowance, value: periodItem.child_allowance, currency: true },
    { kind: 'row', label: periodUiLabels.min_monthly_bonus, value: periodItem.min_monthly_bonus, currency: true },
    { kind: 'row', label: periodUiLabels.max_monthly_bonus, value: periodItem.max_monthly_bonus, currency: true },
    { kind: 'row', label: periodUiLabels.formula_increase, value: periodItem.formula_increase },
    { kind: 'row', label: periodUiLabels.min_wage_decree_reference, value: periodItem.min_wage_decree_reference },
  ];

  const getGroupedPeriodDisplayEntries = (title: string, items: { label: string; value: string }[]) => {
    if (items.length === 0) {
      return [];
    }

    const hasSameValue = items.length > 1 && items.every(item => item.value === items[0].value);

    if (hasSameValue) {
      return [{ kind: 'row' as const, label: title, value: items[0].value }];
    }

    return [{ kind: 'group' as const, title, items }];
  };

  const renderDetailItem = (
    item: { kind: 'row'; label: string; value: string } | { kind: 'group'; title: string; items: { label: string; value: string }[] },
    detailIndex: number,
  ) => {
    if (item.kind === 'group') {
      return (
        <View
          key={item.title}
          style={[
            styles.detailBox,
            {
              borderColor: theme.borderStrong,
              width: isWide ? '48%' : '100%',
              maxWidth: isWide ? '48%' : '100%',
              backgroundColor: detailIndex % 2 === 0 ? theme.surfaceVariant : theme.surface,
            },
          ]}
        >
          <View style={[styles.detailRow, { marginBottom: Spacing.one }]}> 
            <ThemedText
              type="smallBold"
              themeColor="textSecondary"
              style={[styles.detailRowLabel, getCompactTextStyle(item.title, false, true)]}
              numberOfLines={2}
            >
              {item.title}
            </ThemedText>
          </View>

          {item.items.map((subItem, subIndex) => (
            <View
              key={`${item.title}-${subItem.label}`}
              style={[
                styles.detailRow,
                subIndex < item.items.length - 1
                  ? { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.borderStrong, paddingVertical: Spacing.three }
                  : { paddingVertical: Spacing.three },
              ]}
            >
              <ThemedText
                type="small"
                themeColor="textSecondary"
                style={[styles.detailRowLabel, getCompactTextStyle(subItem.label)]}
                numberOfLines={2}
              >
                {subItem.label}
              </ThemedText>
              <ThemedText
                type="smallBold"
                style={[styles.detailRowValue, getCompactTextStyle(subItem.value, true)]}
                numberOfLines={2}
              >
                {subItem.value}
              </ThemedText>
            </View>
          ))}
        </View>
      );
    }

    return (
      <View
        key={item.label}
        style={[
          styles.detailBox,
          {
            borderColor: theme.borderStrong,
            width: isWide ? '48%' : '100%',
            maxWidth: isWide ? '48%' : '100%',
            backgroundColor: detailIndex % 2 === 0 ? theme.surfaceVariant : theme.surface,
          },
          ]}
        >
        <View style={styles.detailRow}>
          <ThemedText
            type="small"
            themeColor="textSecondary"
            style={[styles.detailRowLabel, getCompactTextStyle(item.label)]}
            numberOfLines={2}
          >
            {item.label}
          </ThemedText>
          <ThemedText
            type="smallBold"
            style={[styles.detailRowValue, getCompactTextStyle(item.value, true)]}
            numberOfLines={2}
          >
            {item.value}
          </ThemedText>
        </View>
      </View>
    );
  };

  const periodDetails: ({ kind: 'row'; label: string; value: string } | { kind: 'group'; title: string; items: { label: string; value: string }[] })[] = [];

  getPeriodDetailRows(period).forEach((row) => {
    if (row.kind === 'group') {
      const normalizedItems = row.items
        .map(item => ({
          label: item.label,
          value: formatValue(item.value, item.currency ?? false),
        }))
        .filter(item => item.value !== '-');

      if (normalizedItems.length > 0) {
        periodDetails.push(...getGroupedPeriodDisplayEntries(row.title, normalizedItems));
      }
      return;
    }

    const value = formatValue(row.value, row.currency ?? false);
    if (value !== '-') {
      periodDetails.push({ kind: 'row', label: row.label, value });
    }
  });

  return (
    <Card
      key={periodKey}
      elevation={1}
      style={[
        styles.periodCard,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          borderWidth: StyleSheet.hairlineWidth,
        },
      ]}
    >
      <Card.Content style={styles.cardContent}>
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <ThemedText type="bodyBold" style={[styles.pageTitle, { color: theme.text }]}>
              دوره دستمزد
            </ThemedText>
            <ThemedText type="small" style={[styles.pageDescription, { color: theme.textSecondary }]}>
              {periodsLength === 1 
                ? 'تمام داده‌های حقوقی برای این دوره'
                : `داده‌های حقوقی برای دوره شماره ${new Intl.NumberFormat('fa-IR').format(index + 1)}`
              }
            </ThemedText>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={[styles.metricBox, { backgroundColor: theme.surfaceVariant }]}>
            <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              شماره دوره
            </ThemedText>
            <View style={styles.metricContent}>
              <MaterialCommunityIcons name="calendar-range-outline" size={20} color={theme.primary} />
              <ThemedText type="bodyBold" style={[styles.fieldValue, { color: theme.text }]}>
                {periodsLength === 1 ? 'دوره کامل' : new Intl.NumberFormat('fa-IR').format(index + 1)}
              </ThemedText>
            </View>
          </View>

          <View style={[styles.metricBox, { backgroundColor: theme.surfaceVariant }]}>
            <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              مدت زمان
            </ThemedText>
            <View style={styles.metricContent}>
              <MaterialCommunityIcons name="calendar-month" size={20} color={theme.primary} />
              <ThemedText type="bodyBold" style={[styles.fieldValue, { color: theme.text }]}>
                {`${period.month_count?.toLocaleString('fa-IR') ?? '-'} ماه`}
              </ThemedText>
            </View>
          </View>
        </View>

        <Pressable
          onPress={() => onToggle(periodKey)}
          style={({ pressed }) => [
            styles.actionButton,
            {
              backgroundColor: pressed ? theme.primaryContainer : theme.primary,
            },
          ]}
        >
          <MaterialCommunityIcons 
            name={isExpanded ? 'chevron-up' : 'chevron-down'} 
            size={18} 
            color={theme.surface} 
          />
          <ThemedText type="labelBold" style={{ color: theme.surface }}>
            {isExpanded ? 'عدم نمایش' : 'نمایش جزئیات'}
          </ThemedText>
        </Pressable>

        {isExpanded ? (
          <View style={styles.expandedSection}>
            <View style={[styles.expandedDivider, { backgroundColor: theme.border }]} />
            <View style={styles.periodDetailsGrid}>
              {periodDetails.map((item, detailIndex) => renderDetailItem(item, detailIndex))}
            </View>
          </View>
        ) : null}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  periodCard: {
    borderRadius: 20,
    marginBottom: Spacing.two,
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
    fontWeight: '600',
  },
  pageDescription: {
    fontWeight: '400',
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
    fontSize: 12,
    fontWeight: '500',
  },
  metricContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  fieldValue: {
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  expandedSection: {
    marginTop: Spacing.one,
  },
  expandedDivider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: Spacing.two,
  },
  periodDetailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  detailBox: {
    minWidth: 0,
    flexShrink: 1,
    alignItems: 'flex-start',
    gap: Spacing.one,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  detailRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.one,
  },
  detailRowLabel: {
    flex: 1,
    minWidth: 0,
    textAlign: 'right',
    lineHeight: 20,
    fontFamily: 'Vazirmatn-Medium',
  },
  detailRowValue: {
    flexShrink: 0,
    textAlign: 'left',
    maxWidth: '45%',
    lineHeight: 20,
    fontFamily: 'Vazirmatn-Medium',
  },
  detailBoxIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  detailGroupBox: {
    alignItems: 'flex-start',
  },
  detailGroupHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    width: '100%',
  },
  detailGroupHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  detailGroupTitle: {
    width: '100%',
    textAlign: 'right',
    lineHeight: 20,
    fontWeight: '700',
    fontFamily: 'Vazirmatn-Bold',
  },
  detailGroupItems: {
    width: '100%',
    gap: Spacing.one,
    marginTop: Spacing.one,
  },
  detailGroupRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.one,
  },
  detailGroupItemLabel: {
    flex: 1,
    minWidth: 0,
    textAlign: 'right',
    lineHeight: 18,
    fontFamily: 'Vazirmatn-Regular',
  },
  detailGroupItemValue: {
    flexShrink: 0,
    textAlign: 'left',
    maxWidth: '45%',
    lineHeight: 18,
    fontFamily: 'Vazirmatn-Bold',
  },
});
