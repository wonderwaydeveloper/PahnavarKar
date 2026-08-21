import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRef } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WebBadge } from '@/components/web-badge';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function HomeTabScreen() {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const lastPressRef = useRef(0);

    const handleActionPress = (callback: () => void) => {
        const now = Date.now();
        if (now - lastPressRef.current < 500) {
            return;
        }

        lastPressRef.current = now;
        callback();
    };

    const actions = [
        {
            key: 'yearly-info',
            title: 'اطلاعات سال کارکرد',
            icon: 'calendar-range' as const,
            accent: '#4f46e5',
            detail: 'جزئیاتی جامع از مصوبات شورای عالی کار از سال ۱۳۶۹ تاکنون',
            onPress: () => router.push('/home/yearly-info'),
        },
        {
            key: 'base-salary',
            title: 'حقوق پایه',
            icon: 'calculator-variant' as const,
            accent: '#0f766e',
            detail: 'محاسبه حقوق پایه و نمایش جزئیات آن',
            onPress: () => router.push('/home/base-salary'),
        },
        {
            key: 'housing-allowance',
            title: 'حق مسکن ماهیانه',
            icon: 'home-city' as const,
            accent: '#2563eb',
            detail: 'محاسبه حق مسکن ماهیانه بر اساس وضعیت تأهل و بازه زمانی',
            onPress: () => router.push('/home/housing-allowance'),
        },
        {
            key: 'monthly-allowance',
            title: 'بن ماهیانه',
            icon: 'cash-multiple' as const,
            accent: '#8b5cf6',
            detail: 'محاسبه بن ماهیانه بر اساس تعداد ماه‌های کارکرد و وضعیت تأهل',
            onPress: () => router.push('/home/monthly-allowance'),
        },
        {
            key: 'family-allowance',
            title: 'حق عائله مندی',
            icon: 'family-tree' as const,
            accent: '#f59e0b',
            detail: 'محاسبه حق عائله‌مندی و نمایش جزئیات آن',
            onPress: () => router.push('/home/family-allowance'),
        },
        {
            key: 'spousal-allowance',
            title: 'حق تاهل استحقاقی',
            icon: 'heart-outline' as const,
            accent: '#f43f5e',
            detail: 'محاسبه حق تاهل استحقاقی بر اساس تعداد ماه‌های کارکرد',
            onPress: () => router.push('/home/spousal-allowance'),
        },
        {
            key: 'monthly-shift-work',
            title: 'نوبت کاری ماهیانه',
            icon: 'calendar-clock' as const,
            accent: '#0f766e',
            detail: 'محاسبه نوبت کاری ماهیانه با انتخاب نوع نوبت کاری و بازه زمانی',
            onPress: () => router.push('/home/monthly-shift-work'),
        },
        {
            key: 'minimum-bonus',
            title: 'حداقل عیدی و پاداش استحقاقی',
            icon: 'gift-outline' as const,
            accent: '#ef4444',
            detail: 'محاسبه حداقل عیدی و پاداش استحقاقی بر اساس تعداد ماه‌های کارکرد',
            onPress: () => router.push('/home/minimum-bonus'),
        },
        {
            key: 'maximum-bonus',
            title: 'حداکثر عیدی و پاداش استحقاقی',
            icon: 'gift' as const,
            accent: '#ec4899',
            detail: 'محاسبه حداکثر عیدی و پاداش استحقاقی با درج تعداد ماه‌های کارکرد و گزینه روزهای شمول',
            onPress: () => router.push('/home/maximum-bonus'),
        },
        {
            key: 'overtime-entitlement',
            title: 'اضافه کاری استحقاقی',
            icon: 'clock-alert-outline' as const,
            accent: '#f97316',
            detail: 'محاسبه اضافه کاری استحقاقی بر اساس ساعت روزانه، مبلغ هر ساعت و روزهای کارکرد',
            onPress: () => router.push('/home/overtime-entitlement'),
        },
        {
            key: 'night-shift-entitlement',
            title: 'شب کاری استحقاقی',
            icon: 'weather-night' as const,
            accent: '#0ea5e9',
            detail: 'محاسبه شب کاری استحقاقی بر اساس ۷.۳۳ ضریب، مبلغ هر ساعت و روزهای کارکرد',
            onPress: () => router.push('/home/night-shift-entitlement'),
        },
        {
            key: 'unused-leave-entitlement',
            title: 'تعداد روزهای مرخصی استفاده نشده',
            icon: 'calendar-clock' as const,
            accent: '#e11d48',
            detail: 'محاسبه تعداد روزهای مرخصی استفاده نشده بر اساس بازه زمانی کارکرد',
            onPress: () => router.push('/home/unused-leave-entitlement'),
        },
        {
            key: 'unused-leave-wage',
            title: 'مزد مرخصی استفاده نشده',
            icon: 'cash-clock' as const,
            accent: '#0891b2',
            detail: 'محاسبه مزد مرخصی استفاده نشده بر اساس آخرین ماه کارکرد',
            onPress: () => router.push('/home/unused-leave-wage'),
        },
        {
            key: 'insurance-days-entitlement',
            title: 'تعداد روزهای بیمه استحقاقی',
            icon: 'shield-check' as const,
            accent: '#22c55e',
            detail: 'محاسبه تعداد روزهای بیمه استحقاقی بر اساس ساعات کاری روزانه و بازه زمانی',
            onPress: () => router.push('/home/insurance-days-entitlement'),
        },
        {
            key: 'end-of-service-years',
            title: 'سنوات پایان کار',
            icon: 'briefcase-clock' as const,
            accent: '#14b8a6',
            detail: 'محاسبه سنوات پایان کار بر اساس تعداد ماه‌های کارکرد و پایه سنوات',
            onPress: () => router.push('/home/end-of-service-years'),
        },
        {
            key: 'friday-work',
            title: 'جمعه کاری',
            icon: 'calendar-star' as const,
            accent: '#f59e0b',
            detail: 'محاسبه جمعه کاری بر اساس تعداد جمعه کاری و مبلغ مصوب همان سال',
            onPress: () => router.push('/home/friday-work'),
        },
    ];

    return (
        <ThemedView style={styles.container}>
            <ScrollView
                contentContainerStyle={[
                    styles.scrollContent,
                    {
                        paddingBottom: insets.bottom + Spacing.four,
                    },
                ]}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.sectionWrap}>
                    <ThemedText type="smallBold" style={[styles.sectionTitle, { color: theme.text }]}>ابزارها</ThemedText>

                    <View style={[styles.listCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        {actions.map((action, index) => (
                            <Pressable
                                key={action.key}
                                onPress={() => handleActionPress(action.onPress)}
                                style={({ pressed }) => [
                                    styles.listItem,
                                    index === 0 && styles.firstListItem,
                                    index === actions.length - 1 && styles.lastListItem,
                                    { opacity: pressed ? 0.88 : 1, borderTopColor: theme.border },
                                ]}
                            >
                                <View style={[styles.itemIcon, { backgroundColor: `${action.accent}1A` }]}>
                                    <MaterialCommunityIcons name={action.icon} size={22} color={action.accent} />
                                </View>

                                <View style={styles.itemTextWrap}>
                                    <ThemedText type="smallBold" style={[styles.itemTitle, { color: theme.text }]}>
                                        {action.title}
                                    </ThemedText>
                                    <ThemedText type="small" style={[styles.itemDetail, { color: theme.textSecondary }]}>
                                        {action.detail}
                                    </ThemedText>
                                </View>

                                <MaterialCommunityIcons name="chevron-left" size={18} color={theme.textSecondary} />
                            </Pressable>
                        ))}
                    </View>
                </View>

                {Platform.OS === 'web' && <WebBadge />}
            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: Spacing.four,
        paddingTop: Spacing.four,
        gap: Spacing.three,
    },
    sectionWrap: {
        gap: Spacing.one,
    },
    sectionTitle: {
        marginHorizontal: Spacing.one,
    },
    listCard: {
        borderRadius: 20,
        borderWidth: 1,
        overflow: 'hidden',
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.two,
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.three,
        borderTopWidth: 1,
    },
    firstListItem: {
        borderTopWidth: 0,
    },
    lastListItem: {
        borderBottomWidth: 0,
    },
    itemIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemTextWrap: {
        flex: 1,
        gap: Spacing.one,
    },
    itemTitle: {
        fontSize: 14,
        lineHeight: 20,
    },
    itemDetail: {
        fontSize: 11,
        lineHeight: 15,
    },
});
