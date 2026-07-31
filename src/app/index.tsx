import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { Platform, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Button } from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WebBadge } from '@/components/web-badge';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function HomeScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const isWide = width >= 720;
  const appVersion = Constants.expoConfig?.version ?? 'نامشخص';

  const actions = [
    {
      key: 'explore',
      label: 'کاوش',
      icon: 'compass-outline' as const,
      mode: 'contained' as const,
      onPress: () => router.push('/explore'),
    },
    {
      key: 'calculations',
      label: 'محاسبات',
      icon: 'calculator' as const,
      mode: 'outlined' as const,
      onPress: () => router.push('/calculations'),
    },
  ];

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + Spacing.four,
            paddingBottom: insets.bottom + Spacing.four,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <SafeAreaView style={[styles.safeArea, isWide && styles.safeAreaWide]}>
          <View style={[styles.heroSection, isWide && styles.heroSectionWide]}>
            <View style={styles.heroText}>
              <ThemedText type="largeTitle" style={styles.welcomeTitle}>
                خوش‌آمدید
              </ThemedText>
              <ThemedText type="bodyBold" style={styles.subtitle}>
                پهناور کار | محاسبه حقوق و دستمزد
              </ThemedText>
              <ThemedText type="small" style={styles.description}>
                ابزاری جامع و قابل اعتماد برای محاسبه حقوق و دستمزد بر اساس آخرین تعرفه‌های حداقل مزد. داده‌های دوره‌های مختلف را کاوش کنید یا محاسبات خود را برای بازه‌های زمانی مختلف انجام دهید.
              </ThemedText>
            </View>
          </View>

          <View style={[styles.actionGroup, isWide && styles.actionGroupWide]}>
            {actions.map((action) => {
              const isOutlined = action.key === 'calculations';

              return (
                <Button
                  key={action.key}
                  icon={action.icon}
                  mode={isOutlined ? 'outlined' : 'contained'}
                  style={[
                    styles.actionButton,
                    isOutlined && styles.outlinedActionButton,
                  ]}
                  labelStyle={styles.actionLabel}
                  buttonColor={isOutlined ? theme.surface : theme.primary}
                  textColor={isOutlined ? theme.primary : theme.surface}
                  onPress={action.onPress}
                >
                  {action.label}
                </Button>
              );
            })}
          </View>



          {Platform.OS === 'web' && <WebBadge />}
        </SafeAreaView>
      </ScrollView>
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
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  safeAreaWide: {
    paddingHorizontal: Spacing.six,
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.four,
    marginBottom: Spacing.four,
  },
  heroSectionWide: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroText: {
    maxWidth: 640,
    width: '100%',
    alignItems: 'center',
  },
  welcomeTitle: {
    textAlign: 'center',
  },
  subtitle: {
    marginTop: Spacing.two,
    textAlign: 'center',
  },
  description: {
    marginTop: Spacing.two,
    textAlign: 'center',
  },
  actionGroup: {
    width: '100%',
    gap: Spacing.two,
  },
  actionGroupWide: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    borderRadius: Spacing.three,
  },
  outlinedActionButton: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  actionLabel: {
    fontFamily: 'Vazirmatn-Medium',
    fontSize: 14,
  },
  helpCard: {
    borderRadius: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
  },
  helpTitle: {
    marginBottom: Spacing.two,
  },
  dialogText: {
    marginBottom: Spacing.two,
  },
});
