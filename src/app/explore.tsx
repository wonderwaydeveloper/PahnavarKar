import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import {
  ActivityIndicator,
  Card,
  Snackbar
} from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PeriodCard, YearSelectorCard } from '@/components/ui/exploer';
import { WebBadge } from '@/components/web-badge';
import { Radius, Spacing } from '@/constants/theme';
import { fetchPeriodsByYearId, fetchYears, seedFromJsonAsset } from '@/database';
import type { PeriodRecord, YearRecord } from '@/database/types';
import { useTheme } from '@/hooks/use-theme';

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWide = width >= 960;
  const theme = useTheme();

  // State management
  const [years, setYears] = useState<YearRecord[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<number | null>(null);
  const [periods, setPeriods] = useState<PeriodRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPeriods, setLoadingPeriods] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);
  const [expandedPeriods, setExpandedPeriods] = useState<Record<string, boolean>>({});
  const [yearPickerVisible, setYearPickerVisible] = useState(false);

  const selectedYear = useMemo(() => {
    if (selectedYearId == null) {
      return [...years].sort((a, b) => b.year - a.year)[0] ?? null;
    }

    return years.find((year) => year.id === selectedYearId) ?? [...years].sort((a, b) => b.year - a.year)[0] ?? null;
  }, [selectedYearId, years]);

  const loadPeriodsForYear = async (year: YearRecord | null, showLoading = true) => {
    if (showLoading) {
      setLoadingPeriods(true);
    }

    try {
      if (!year) {
        setPeriods([]);
        return;
      }

      const yearPeriods = await fetchPeriodsByYearId(year.id);
      setPeriods(yearPeriods);
      setError(null);
    } catch (err) {
      const errorMsg = String(err);
      setError(errorMsg);
      setShowError(true);
      setPeriods([]);
    } finally {
      if (showLoading) {
        setLoadingPeriods(false);
      }
    }
  };

  // Load database on mount
  useEffect(() => {
    async function loadDatabase() {
      try {
        await seedFromJsonAsset();
        const yearRows = await fetchYears();
        const sortedYearRows = [...yearRows].sort((a, b) => b.year - a.year);
        setYears(yearRows);
        const latestYear = sortedYearRows[0] ?? null;
        setSelectedYearId(latestYear?.id ?? null);
        setError(null);
        await loadPeriodsForYear(latestYear ?? null, false);
      } catch (err) {
        const errorMsg = String(err);
        setError(errorMsg);
        setShowError(true);
      } finally {
        setLoading(false);
      }
    }

    void loadDatabase();
  }, []);

  const sortedYears = [...years].sort((a, b) => a.year - b.year);

  const handleYearSelection = (year: YearRecord | null) => {
    setSelectedYearId(year?.id ?? null);
    void loadPeriodsForYear(year, true);
  };

  const contentPlatformStyle = Platform.select({
    android: {
      paddingTop: Spacing.three,
      paddingLeft: Spacing.four,
      paddingRight: Spacing.four,
      paddingBottom: Spacing.four,
    },
    web: {
      paddingTop: Spacing.six,
      paddingBottom: Spacing.four,
      paddingLeft: Spacing.four,
      paddingRight: Spacing.four,
    },
  });

  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';

  const toPersianDigits = (value: string) =>
    value.replace(/\d/g, (digit) => persianDigits[Number(digit)]);

  const formatYear = (value: number | string | null | undefined) => {
    if (value == null || value === '') {
      return '-';
    }

    const numericYear = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(numericYear)) {
      return toPersianDigits(String(value));
    }

    const englishYear = String(Math.trunc(numericYear));
    return englishYear.replace(/\d/g, (digit) => persianDigits[Number(digit)]);
  };

  const togglePeriodExpanded = (periodKey: string) => {
    setExpandedPeriods(prev => ({
      ...prev,
      [periodKey]: !prev[periodKey],
    }));
  };

  const renderPeriodCard = (period: PeriodRecord, index: number) => {
    const periodKey = period.id?.toString() ?? `${index}-${period.month_count ?? 'x'}`;
    const isExpanded = expandedPeriods[periodKey] ?? false;

    return (
      <PeriodCard
        key={periodKey}
        period={period}
        index={index}
        isExpanded={isExpanded}
        isWide={isWide}
        periodsLength={periods.length}
        periodKey={periodKey}
        onToggle={togglePeriodExpanded}
      />
    );
  };

  return (
    <>
      <ThemedView style={[styles.screen, { backgroundColor: theme.background }]}>
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator animating size="large" color={theme.primary} />
            <ThemedText type="small" style={styles.loadingText}>در حال بارگذاری داده‌ها...</ThemedText>
          </View>
        ) : (
          <SafeAreaView style={styles.safeArea}>
            <ScrollView
              style={[styles.scrollView, { backgroundColor: theme.background }]}
              contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}
              showsVerticalScrollIndicator={false}
            >
              <YearSelectorCard
              selectedYear={selectedYear}
              years={sortedYears}
              visible={yearPickerVisible}
              onOpen={() => setYearPickerVisible(true)}
              onClose={() => setYearPickerVisible(false)}
              onSelectYear={handleYearSelection}
              formatYear={formatYear}
            />

            {/* Periods Section */}
            <View style={{ marginTop: Spacing.two }}>
              <View style={styles.periodsSectionHeader}>
                <ThemedText type="smallBold" themeColor="text" style={styles.periodsSectionTitle}>جزئیات دوره‌ها</ThemedText>
                {loadingPeriods && <ActivityIndicator size="small" color={theme.primary} />}
              </View>

              {loadingPeriods ? (
                <View style={styles.centerContainer}>
                  <ActivityIndicator animating size="large" color={theme.primary} />
                </View>
              ) : periods.length === 0 ? (
                <Card style={[styles.emptyStateCard, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                  <Card.Content style={styles.emptyStateContent}>
                    <View style={[styles.emptyStateIcon, { backgroundColor: theme.primaryContainer }]}>
                      <MaterialCommunityIcons name="calendar-blank" size={24} color={theme.primary} />
                    </View>
                    <ThemedText type="smallBold" style={styles.emptyText}>برای این سال دوره‌ای ثبت نشده است</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary" style={styles.emptySubText}>
                      با افزودن داده‌های جدید، جزئیات دوره‌ها اینجا به‌صورت خودکار ظاهر می‌شود.
                    </ThemedText>
                  </Card.Content>
                </Card>
              ) : (
                <View style={styles.periodsGrid}>
                  {periods.map((period, index) => renderPeriodCard(period, index))}
                </View>
              )}
            </View>

            {Platform.OS === 'web' && <WebBadge />}
            </ScrollView>
          </SafeAreaView>
        )}
      </ThemedView>

      {/* Error Snackbar */}
      <Snackbar
        visible={showError}
        onDismiss={() => setShowError(false)}
        duration={10000}
        style={{ backgroundColor: theme.error, borderRadius: Radius.md }}
        action={{
          label: 'بستن',
          onPress: () => setShowError(false),
          labelStyle: { color: theme.surface },
        }}
      >
        <ThemedText type="small" style={{ color: theme.surface }}>
          {error ?? 'خطایی رخ داده است.'}
        </ThemedText>
      </Snackbar>

    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: Spacing.six,
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.three,
  },
  loadingText: {
    marginTop: Spacing.three,
  },
  periodsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  periodsSectionTitle: {
    fontWeight: '600',
    fontSize: 14,
    marginBottom: Spacing.two,
  },
  periodsGrid: {
    gap: Spacing.two,
  },
  emptyStateCard: {
    borderRadius: Radius.md,
  },
  emptyStateContent: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.four,
  },
  emptyStateIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
  },
  emptySubText: {
    textAlign: 'center',
  },
});
