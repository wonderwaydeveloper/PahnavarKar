import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRef, useState, type ComponentProps } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
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

type DebouncedPressableProps = Omit<ComponentProps<typeof Pressable>, 'onPress'> & {
    onPress?: () => void;
};

function DebouncedPressable({ onPress, ...props }: DebouncedPressableProps) {
    const lastPressRef = useRef(0);

    return <Pressable {...props} onPress={() => runDebouncedAction(lastPressRef, () => onPress?.())} />;
}

function normalizeSearchText(value: string) {
    return value
        .trim()
        .toLocaleLowerCase('fa-IR')
        .replace(/ي/g, 'ی')
        .replace(/ى/g, 'ی')
        .replace(/ك/g, 'ک');
}

export default function HomeTabScreen() {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');

    const actions = [
        {
            key: 'yearly-info',
            title: 'اطلاعات جامع مزدی از سال ۱۳۶۹ تاکنون',
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
            key: 'entitled-seniority',
            title: 'پایه سنوات استحقاقی',
            icon: 'cash-plus' as const,
            accent: '#0d9488',
            detail: 'محاسبه پایه سنوات بر اساس تاریخ استخدام، تصفیه حساب تا پایان ۱۳۹۱ و طرح طبقه‌بندی مشاغل',
            onPress: () => router.push('/home/entitled-seniority' as any),
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
            title: 'میزان مرخصی ذخیره شده کارگر',
            icon: 'calendar-clock' as const,
            accent: '#e11d48',
            detail: 'محاسبه تعداد مرخصی ذخیره شده کارگر براساس مواد ۶۴ و ۶۹ قانون کار',
            onPress: () => router.push('/home/unused-leave-entitlement'),
        },
        {
            key: 'unused-leave-wage',
            title: 'مزد مرخصی ذخیره شده کارگر',
            icon: 'cash-clock' as const,
            accent: '#0891b2',
            detail: 'محاسبه مزد مرخصی ذخیره شده کارگر بر اساس آخرین ماه کارکرد',
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
            key: 'unemployment-insurance-entitlement',
            title: 'مدت زمان پرداخت مقرری بیمه بیکاری',
            icon: 'briefcase-account' as const,
            accent: '#0284c7',
            detail: 'محاسبه مدت زمان استحقاق دریافت مقرری بیمه بیکاری براساس ماده ۷ قانون بیمه بیکاری',
            onPress: () => router.push('/home/unemployment-insurance-entitlement' as any),
        },
        {
            key: 'unemployment-insurance-allowance',
            title: 'مبلغ مقرری بیمه بیکاری',
            icon: 'cash-clock' as const,
            accent: '#0f766e',
            detail: 'محاسبه مقرری بیمه بیکاری براساس بند ب ماده ۷ قانون بیمه بیکاری',
            onPress: () => router.push('/home/unemployment-insurance-allowance' as any),
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

    const normalizedSearchQuery = normalizeSearchText(searchQuery);
    const filteredActions = normalizedSearchQuery
        ? actions.filter((action) => normalizeSearchText(`${action.title} ${action.detail}`).includes(normalizedSearchQuery))
        : actions;
    const wageActionKeys = new Set([
        'yearly-info',
        'base-salary',
        'entitled-seniority',
        'housing-allowance',
        'monthly-allowance',
        'spousal-allowance',
        'family-allowance',
        'unemployment-insurance-allowance',
        'overtime-entitlement',
        'night-shift-entitlement',
        'monthly-shift-work',
        'minimum-bonus',
        'maximum-bonus',
        'end-of-service-years',
        'unused-leave-wage',
        'official-holiday-work',
        'suspension-wage',
    ]);
    const wageActions = filteredActions.filter((action) => wageActionKeys.has(action.key));
    const nonWageActions = filteredActions.filter((action) => !wageActionKeys.has(action.key));

    const renderActionList = (actionList: typeof actions) => (
        <View style={[styles.listCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {actionList.map((action, index) => (
                <DebouncedPressable
                    key={action.key}
                    onPress={action.onPress}
                    style={({ pressed }) => [
                        styles.listItem,
                        index === 0 && styles.firstListItem,
                        index === actionList.length - 1 && styles.lastListItem,
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
                </DebouncedPressable>
            ))}
        </View>
    );

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
                    <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <MaterialCommunityIcons name="magnify" size={21} color={theme.textSecondary} />
                        <TextInput
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholder="جست‌وجوی ابزارها"
                            placeholderTextColor={theme.textMuted}
                            style={[styles.searchInput, { color: theme.text }]}
                            returnKeyType="search"
                            accessibilityLabel="جست‌وجوی ابزارها"
                        />
                        {searchQuery.length > 0 ? (
                            <Pressable
                                onPress={() => setSearchQuery('')}
                                accessibilityRole="button"
                                accessibilityLabel="پاک‌کردن جست‌وجو"
                                hitSlop={8}
                            >
                                <MaterialCommunityIcons name="close-circle" size={19} color={theme.textSecondary} />
                            </Pressable>
                        ) : null}
                    </View>

                    {filteredActions.length > 0 ? (
                        <>
                            {wageActions.length > 0 ? (
                                <View style={styles.categorySection}>
                                    <ThemedText type="smallBold" style={[styles.sectionTitle, { color: theme.text }]}>ویترین اقلام مزدی</ThemedText>
                                    {renderActionList(wageActions)}
                                </View>
                            ) : null}
                            {nonWageActions.length > 0 ? (
                                <View style={styles.categorySection}>
                                    <ThemedText type="smallBold" style={[styles.sectionTitle, { color: theme.text }]}>ویترین اقلام غیر مزدی</ThemedText>
                                    {renderActionList(nonWageActions)}
                                </View>
                            ) : null}
                        </>
                    ) : (
                        <View style={[styles.listCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <View style={styles.emptyState}>
                                <MaterialCommunityIcons name="text-search" size={28} color={theme.textMuted} />
                                <ThemedText type="smallBold" style={{ color: theme.text }}>ابزاری پیدا نشد</ThemedText>
                                <ThemedText type="small" style={{ color: theme.textSecondary }}>عبارت دیگری را جست‌وجو کنید.</ThemedText>
                            </View>
                        </View>
                    )}
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
    categorySection: {
        gap: Spacing.one,
        marginTop: Spacing.three - Spacing.one,
    },
    sectionTitle: {
        marginHorizontal: Spacing.one,
    },
    searchBox: {
        minHeight: 48,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.two,
        paddingHorizontal: Spacing.two,
        borderRadius: 12,
        borderWidth: StyleSheet.hairlineWidth,
    },
    searchInput: {
        flex: 1,
        minHeight: 44,
        paddingVertical: 0,
        fontFamily: 'Vazirmatn-Regular',
        fontSize: 14,
        textAlign: 'right',
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
    emptyState: {
        minHeight: 150,
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.one,
        padding: Spacing.four,
    },
});
