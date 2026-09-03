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

function runDebouncedAction(lastPressRef: { current: number }, callback: () => void) {
    const now = Date.now();
    if (now - lastPressRef.current < 500) {
        return;
    }

    lastPressRef.current = now;
    callback();
}

export default function HomeTabScreen() {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const lastPressRef = useRef(0);

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
            detail: 'محاسبه حق مسکن ماهیانه موضوع مصوبه هیات وزیران به تناسب بازه زمانی انتخابی',
            onPress: () => router.push('/home/housing-allowance'),
        },
        {
            key: 'monthly-allowance',
            title: 'بن کارگری ماهیانه',
            icon: 'cash-multiple' as const,
            accent: '#8b5cf6',
            detail: 'محاسبه بن کارگری مصوبه شورای عالی کار به تناسب بازه زمانی انتخابی',
            onPress: () => router.push('/home/monthly-allowance'),
        },
        {
            key: 'family-allowance',
            title: 'حق عائله مندی',
            icon: 'family-tree' as const,
            accent: '#f59e0b',
            detail: 'محاسبه حق عائله مندی براساس بند۲ماده ۸۶قانون تامین اجتماعی',
            onPress: () => router.push('/home/family-allowance'),
        },
        {
            key: 'spousal-allowance',
            title: 'حق تاهل استحقاقی',
            icon: 'heart-outline' as const,
            accent: '#f43f5e',
            detail: 'محاسبه حق تاهل براساس تصریح مصوبات شورای عالی کار از سال ۱۴۰۳',
            onPress: () => router.push('/home/spousal-allowance'),
        },
        {
            key: 'monthly-shift-work',
            title: 'نوبت کاری ماهیانه',
            icon: 'calendar-clock' as const,
            accent: '#0f766e',
            detail: 'محاسبه نوبت‌کاری موضوع ماده ۵۵ قانون کار بر اساس ماده ۵۶ قانون کار',
            onPress: () => router.push('/home/monthly-shift-work'),
        },
        {
            key: 'minimum-bonus',
            title: 'حداقل عیدی و پاداش استحقاقی',
            icon: 'gift-outline' as const,
            accent: '#ef4444',
            detail: 'محاسبه حداقل عیدی و پاداش ماهیانه براساس ماده واحده قانون تعیین عیدی و پاداش، مصوب مجلس در سال ۱۳۷۰',
            onPress: () => router.push('/home/minimum-bonus'),
        },
        {
            key: 'maximum-bonus',
            title: 'حداکثر عیدی و پاداش استحقاقی',
            icon: 'gift' as const,
            accent: '#ec4899',
            detail: 'محاسبه حداکثر عیدی و پاداش ماهیانه براساس ماده واحده قانون تعیین عیدی و پاداش، مصوب مجلس در سال ۱۳۷۰',
            onPress: () => router.push('/home/maximum-bonus'),
        },
        {
            key: 'overtime-entitlement',
            title: 'اضافه کاری استحقاقی',
            icon: 'clock-alert-outline' as const,
            accent: '#f97316',
            detail: 'محاسبه فوق‌العاده اضافه‌کاری براساس شرح ماده ۵۹ قانون کار',
            onPress: () => router.push('/home/overtime-entitlement'),
        },
        {
            key: 'night-shift-entitlement',
            title: 'شب کاری استحقاقی',
            icon: 'weather-night' as const,
            accent: '#0ea5e9',
            detail: 'محاسبه فوق‌العاده شب‌کاری براساس شرح ماده ۵۸ قانون کار',
            onPress: () => router.push('/home/night-shift-entitlement'),
        },
        {
            key: 'unused-leave-entitlement',
            title: 'تعداد روزهای مرخصی ذخیره شده کارگر',
            icon: 'calendar-clock' as const,
            accent: '#e11d48',
            detail: 'محاسبه تعداد روزهای مرخصی ذخیره شده برای کارگر براساس ماده ۶۴ قانون کار',
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
            detail: 'محاسبه تعداد روزهای بیمه موضوع مفاد مواد ۳۹ و ۱۴۸ قانون کار',
            onPress: () => router.push('/home/insurance-days-entitlement'),
        },
        {
            key: 'end-of-service-years',
            title: 'سنوات پایان کار',
            icon: 'briefcase-clock' as const,
            accent: '#14b8a6',
            detail: 'محاسبه سنوات پایان کار براساس ماده ۲۴ قانون کار',
            onPress: () => router.push('/home/end-of-service-years'),
        },
        {
            key: 'friday-work',
            title: 'جمعه کاری',
            icon: 'calendar-star' as const,
            accent: '#f59e0b',
            detail: 'محاسبه مزد جمعه‌کاری‌های انجام‌شده براساس ماده ۶۲ قانون کار',
            onPress: () => router.push('/home/friday-work'),
        },
        {
            key: 'suspension-wage',
            title: 'محاسبه حق‌السعی ایام تعلیق',
            icon: 'pause-circle-outline' as const,
            accent: '#7c3aed',
            detail: 'محاسبه حق‌السعی ایام تعلیق موضوع ماده ۶۷ آیین دادرسی کار',
            onPress: () => router.push('/home/suspension-wage' as any),
        },
        {
            key: 'ordinary-work-hours',
            title: 'میزان ساعات کارکرد موظفی کارگر در مشاغل عادی',
            icon: 'calendar-check-outline' as const,
            accent: '#0891b2',
            detail: 'محاسبه میزان ساعات کارکرد موظفی کارگر در مشاغل عادی طبق ماده ۵۱ قانون کار',
            onPress: () => router.push('/home/ordinary-work-hours' as any),
        },
        {
            key: 'hazardous-work-hours',
            title: 'میزان ساعات کارکرد موظفی کارگر در مشاغل سخت و زیان‌آور',
            icon: 'hard-hat' as const,
            accent: '#d97706',
            detail: 'تعیین ساعات کارکرد موظفی کارگر طبق ماده ۵۲ قانون کار',
            onPress: () => router.push('/home/hazardous-work-hours' as any),
        },
        {
            key: 'young-worker-work-hours',
            title: 'میزان ساعات کارکرد موظفی کارگر نوجوان',
            icon: 'account-child' as const,
            accent: '#be123c',
            detail: 'تعیین ساعات کارکرد کارگر نوجوان طبق ماده ۸۰ قانون کار',
            onPress: () => router.push('/home/young-worker-work-hours' as any),
        },
        {
            key: 'official-holiday-work',
            title: 'مبلغ تعطیل کاری استحقاقی',
            icon: 'calendar-star' as const,
            accent: '#f97316',
            detail: 'محاسبه مبلغ تعطیل‌کاری استحقاقی بر اساس تعداد روزهای تعطیل رسمی و مبلغ اضافه‌کاری هر ساعت',
            onPress: () => router.push('/home/official-holiday-work'),
        },
        {
            key: 'illegal-foreign-worker-penalty',
            title: 'مبلغ جریمه به‌کارگیری اتباع بیگانه غیرمجاز',
            icon: 'account-alert-outline' as const,
            accent: '#dc2626',
            detail: 'محاسبه جریمه به‌کارگیری اتباع بیگانه غیرمجاز بر اساس تعداد کارگران، روزهای بازه و حداقل مزد همان سال',
            onPress: () => router.push('/home/illegal-foreign-worker-penalty'),
        },
        {
            key: 'article-87',
            title: 'مبلغ اعمال ماده ۸۷ قانون کار',
            icon: 'file-document-edit-outline' as const,
            accent: '#0ea5e9',
            detail: 'محاسبه مبلغ اعمال ماده ۸۷ قانون کار برای صدور پروانه کسب یا بهره‌برداری بر اساس متراژ زیربنا',
            onPress: () => router.push('/home/article-87'),
        },
        {
            key: 'social-security-premium-ceiling',
            title: 'سقف حق بیمه تامین اجتماعی',
            icon: 'shield-check-outline' as const,
            accent: '#10b981',
            detail: 'محاسبه سقف حق بیمه براساس حداقل مزد مصوب شورای عالی کار و تعداد روزهای ماه انتخابی',
            onPress: () => router.push('/home/social-security-premium-ceiling'),
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
                                onPress={() => runDebouncedAction(lastPressRef, action.onPress)}
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
