import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState, type ComponentProps } from 'react';
import { Pressable, SectionList, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { getToolRoute } from '@/constants/tool-routes';
import { useTheme } from '@/hooks/use-theme';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];
type SearchCategory = 'wage' | 'other';

type SearchAction = {
    key: string;
    title: string;
    detail: string;
    searchText: string;
    titleSearchText: string;
    detailSearchText: string;
    icon: IconName;
    accent: string;
    route: string;
    category: SearchCategory;
};

const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
const latinDigits = '0123456789';
const SEARCH_DEBOUNCE_MS = 300;
const ARABIC_DIACRITICS_PATTERN = /[\u064B-\u065F\u0670\u06D6-\u06ED]/g;
const SEARCH_WHITESPACE_PATTERN = /[\u200C\s]+/g;

function normalizeSearchText(value: string) {
    return value
        .normalize('NFKC')
        .toLocaleLowerCase('fa-IR')
        .replace(/[يى]/g, 'ی')
        .replace(/ك/g, 'ک')
        .replace(ARABIC_DIACRITICS_PATTERN, '')
        .replace(/[۰-۹]/g, (digit) => latinDigits[persianDigits.indexOf(digit)])
        .replace(SEARCH_WHITESPACE_PATTERN, ' ')
        .trim();
}

const ACTION_DEFINITIONS: SearchAction[] = ([
    ['yearly-info', 'اطلاعات جامع مزدی از سال ۱۳۶۹ تاکنون', 'جزئیاتی جامع از مصوبات شورای عالی کار از سال ۱۳۶۹ تاکنون', 'calendar-range', '#4f46e5', '/home/yearly-info', 'wage'],
    ['base-salary', 'حقوق پایه', 'محاسبه حقوق پایه و نمایش جزئیات آن', 'calculator-variant', '#0f766e', '/home/base-salary', 'wage'],
    ['entitled-seniority', 'پایه سنوات استحقاقی', 'محاسبه پایه سنوات بر اساس تاریخ استخدام، تصفیه حساب تا پایان ۱۳۹۱ و طرح طبقه‌بندی مشاغل', 'cash-plus', '#0d9488', '/home/entitled-seniority', 'wage'],
    ['housing-allowance', 'حق مسکن ماهیانه', 'محاسبه حق مسکن ماهیانه موضوع مصوبه هیات وزیران به تناسب بازه زمانی انتخابی', 'home-city', '#2563eb', '/home/housing-allowance', 'wage'],
    ['monthly-allowance', 'بن کارگری ماهیانه', 'محاسبه بن کارگری مصوبه شورای عالی کار به تناسب بازه زمانی انتخابی', 'cash-multiple', '#8b5cf6', '/home/monthly-allowance', 'wage'],
    ['family-allowance', 'حق عائله مندی', 'محاسبه حق عائله مندی براساس بند۲ماده ۸۶قانون تامین اجتماعی', 'family-tree', '#f59e0b', '/home/family-allowance', 'wage'],
    ['spousal-allowance', 'حق تاهل استحقاقی', 'محاسبه حق تاهل براساس تصریح مصوبات شورای عالی کار از سال ۱۴۰۳', 'heart-outline', '#f43f5e', '/home/spousal-allowance', 'wage'],
    ['monthly-shift-work', 'نوبت کاری ماهیانه', 'محاسبه نوبت‌کاری موضوع ماده ۵۵ قانون کار بر اساس ماده ۵۶ قانون کار', 'calendar-clock', '#0f766e', '/home/monthly-shift-work', 'wage'],
    ['minimum-bonus', 'حداقل عیدی و پاداش استحقاقی', 'محاسبه حداقل عیدی و پاداش ماهیانه براساس ماده واحده قانون تعیین عیدی و پاداش، مصوب مجلس در سال ۱۳۷۰', 'gift-outline', '#ef4444', '/home/minimum-bonus', 'wage'],
    ['maximum-bonus', 'حداکثر عیدی و پاداش استحقاقی', 'محاسبه حداکثر عیدی و پاداش ماهیانه براساس ماده واحده قانون تعیین عیدی و پاداش، مصوب مجلس در سال ۱۳۷۰', 'gift', '#ec4899', '/home/maximum-bonus', 'wage'],
    ['overtime-entitlement', 'اضافه کاری استحقاقی', 'محاسبه فوق‌العاده اضافه‌کاری براساس شرح ماده ۵۹ قانون کار', 'clock-alert-outline', '#f97316', '/home/overtime-entitlement', 'wage'],
    ['night-shift-entitlement', 'شب کاری استحقاقی', 'محاسبه فوق‌العاده شب‌کاری براساس شرح ماده ۵۸ قانون کار', 'weather-night', '#0ea5e9', '/home/night-shift-entitlement', 'wage'],
    ['unused-leave-entitlement', 'میزان مرخصی ذخیره شده کارگر', 'محاسبه تعداد مرخصی ذخیره شده کارگر براساس مواد ۶۴ و ۶۹ قانون کار', 'calendar-clock', '#e11d48', '/home/unused-leave-entitlement', 'wage'],
    ['unused-leave-wage', 'مزد مرخصی ذخیره شده کارگر', 'محاسبه مزد مرخصی ذخیره شده کارگر بر اساس آخرین ماه کارکرد', 'cash-clock', '#0891b2', '/home/unused-leave-wage', 'wage'],
    ['insurance-days-entitlement', 'تعداد روزهای بیمه استحقاقی', 'محاسبه تعداد روزهای بیمه موضوع مفاد مواد ۳۹ و ۱۴۸ قانون کار', 'shield-check', '#22c55e', '/home/insurance-days-entitlement', 'other'],
    ['unemployment-insurance-entitlement', 'مدت زمان پرداخت مقرری بیمه بیکاری', 'محاسبه مدت زمان استحقاق دریافت مقرری بیمه بیکاری براساس ماده ۷ قانون بیمه بیکاری', 'briefcase-account', '#0284c7', '/home/unemployment-insurance-entitlement', 'other'],
    ['unemployment-insurance-allowance', 'مبلغ مقرری بیمه بیکاری', 'محاسبه مقرری بیمه بیکاری براساس بند ب ماده ۷ قانون بیمه بیکاری', 'cash-clock', '#0f766e', '/home/unemployment-insurance-allowance', 'wage'],
    ['end-of-service-years', 'سنوات پایان کار', 'محاسبه سنوات پایان کار براساس ماده ۲۴ قانون کار', 'briefcase-clock', '#14b8a6', '/home/end-of-service-years', 'wage'],
    ['friday-work', 'جمعه کاری', 'محاسبه مزد جمعه‌کاری‌های انجام‌شده براساس ماده ۶۲ قانون کار', 'calendar-star', '#f59e0b', '/home/friday-work', 'wage'],
    ['suspension-wage', 'محاسبه حق‌السعی ایام تعلیق', 'محاسبه حق‌السعی ایام تعلیق موضوع ماده ۶۷ آیین دادرسی کار', 'pause-circle-outline', '#7c3aed', '/home/suspension-wage', 'wage'],
    ['ordinary-work-hours', 'میزان ساعات کارکرد موظفی کارگر در مشاغل عادی', 'محاسبه میزان ساعات کارکرد موظفی کارگر در مشاغل عادی طبق ماده ۵۱ قانون کار', 'calendar-check-outline', '#0891b2', '/home/ordinary-work-hours', 'other'],
    ['hazardous-work-hours', 'میزان ساعات کارکرد موظفی کارگر در مشاغل سخت و زیان‌آور', 'تعیین ساعات کارکرد موظفی کارگر طبق ماده ۵۲ قانون کار', 'hard-hat', '#d97706', '/home/hazardous-work-hours', 'other'],
    ['young-worker-work-hours', 'میزان ساعات کارکرد موظفی کارگر نوجوان', 'تعیین ساعات کارکرد کارگر نوجوان طبق ماده ۸۰ قانون کار', 'account-child', '#be123c', '/home/young-worker-work-hours', 'other'],
    ['official-holiday-work', 'مبلغ تعطیل کاری استحقاقی', 'محاسبه مبلغ تعطیل‌کاری استحقاقی بر اساس تعداد روزهای تعطیل رسمی و مبلغ اضافه‌کاری هر ساعت', 'calendar-star', '#f97316', '/home/official-holiday-work', 'wage'],
    ['illegal-foreign-worker-penalty', 'مبلغ جریمه به‌کارگیری اتباع بیگانه غیرمجاز', 'محاسبه جریمه به‌کارگیری اتباع بیگانه غیرمجاز بر اساس تعداد کارگران، روزهای بازه و حداقل مزد همان سال', 'account-alert-outline', '#dc2626', '/home/illegal-foreign-worker-penalty', 'other'],
    ['article-87', 'مبلغ اعمال ماده ۸۷ قانون کار', 'محاسبه مبلغ اعمال ماده ۸۷ قانون کار برای صدور پروانه کسب یا بهره‌برداری بر اساس متراژ زیربنا', 'file-document-edit-outline', '#0ea5e9', '/home/article-87', 'other'],
    ['social-security-premium-ceiling', 'سقف حق بیمه تامین اجتماعی', 'محاسبه سقف حق بیمه براساس حداقل مزد مصوب شورای عالی کار و تعداد روزهای ماه انتخابی', 'shield-check-outline', '#10b981', '/home/social-security-premium-ceiling', 'other'],
] as [string, string, string, IconName, string, string, SearchCategory][]).map(([key, title, detail, icon, accent, route, category]) => ({
    key,
    title,
    detail,
    searchText: normalizeSearchText(`${title} ${detail}`),
    titleSearchText: normalizeSearchText(title),
    detailSearchText: normalizeSearchText(detail),
    icon,
    accent,
    route,
    category,
}));

export default function SearchTabScreen() {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setDebouncedQuery(query);
        }, SEARCH_DEBOUNCE_MS);

        return () => clearTimeout(timeoutId);
    }, [query]);

    const normalizedQuery = normalizeSearchText(debouncedQuery);

    const sections = useMemo(() => {
        const matchingActions = ACTION_DEFINITIONS
            .map((action, originalIndex) => {
                if (!normalizedQuery) {
                    return { action, originalIndex, relevance: 0 };
                }

                const titleMatch = action.titleSearchText.indexOf(normalizedQuery);
                const detailMatch = action.detailSearchText.indexOf(normalizedQuery);

                if (titleMatch === -1 && detailMatch === -1) {
                    return null;
                }

                const relevance = titleMatch === 0
                    ? 0
                    : titleMatch > 0
                        ? 1
                        : detailMatch === 0
                            ? 2
                            : 3;

                return { action, originalIndex, relevance };
            })
            .filter((entry): entry is { action: SearchAction; originalIndex: number; relevance: number } => entry !== null)
            .sort((left, right) => left.relevance - right.relevance || left.originalIndex - right.originalIndex)
            .map((entry) => entry.action);

        return [{ title: '', data: matchingActions }];
    }, [normalizedQuery]);

    const handleClearQuery = useCallback(() => {
        setQuery('');
        setDebouncedQuery('');
    }, []);

    const renderSearchBox = useCallback(() => (
        <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <MaterialCommunityIcons name="magnify" size={21} color={theme.textSecondary} />
            <TextInput
                autoFocus
                value={query}
                onChangeText={setQuery}
                placeholder="جستجو"
                placeholderTextColor={theme.textMuted}
                style={[styles.searchInput, { color: theme.text }]}
                returnKeyType="search"
                accessibilityLabel="جست‌وجوی ابزارها"
            />
            {query.length > 0 ? (
                <Pressable onPress={handleClearQuery} accessibilityRole="button" accessibilityLabel="پاک‌کردن جست‌وجو" hitSlop={8}>
                    <MaterialCommunityIcons name="close-circle" size={19} color={theme.textSecondary} />
                </Pressable>
            ) : null}
        </View>
    ), [handleClearQuery, query, theme.border, theme.surface, theme.text, theme.textMuted, theme.textSecondary]);

    const renderHighlightedText = useCallback((value: string, style: object) => {
        const matchQuery = normalizeSearchText(debouncedQuery);
        const matchIndex = value.toLocaleLowerCase('fa-IR').indexOf(matchQuery);

        if (!matchQuery || matchIndex < 0) {
            return <ThemedText style={style}>{value}</ThemedText>;
        }

        return (
            <ThemedText style={style}>
                {value.slice(0, matchIndex)}
                <ThemedText style={{ color: theme.primary, fontFamily: 'Vazirmatn-Bold' }}>
                    {value.slice(matchIndex, matchIndex + matchQuery.length)}
                </ThemedText>
                {value.slice(matchIndex + matchQuery.length)}
            </ThemedText>
        );
    }, [debouncedQuery, theme.primary]);

    const renderItem = useCallback(({ item, index, section }: { item: SearchAction; index: number; section: { data: SearchAction[] } }) => (
        <Pressable
            onPress={() => router.push(getToolRoute(item.route) as never)}
            style={({ pressed }) => [
                styles.listItem,
                { backgroundColor: pressed ? theme.surfaceVariant : theme.surface, borderBottomColor: theme.border },
                index === section.data.length - 1 && styles.lastListItem,
            ]}
            accessibilityRole="button"
            accessibilityLabel={item.title}
        >
            <View style={[styles.itemIcon, { backgroundColor: `${item.accent}1A`, borderColor: `${item.accent}55` }]}>
                <MaterialCommunityIcons name={item.icon} size={23} color={item.accent} />
            </View>
            <View style={styles.itemTextWrap}>
                {renderHighlightedText(item.title, { color: theme.text, fontSize: 14, lineHeight: 20, fontFamily: 'Vazirmatn-Bold' })}
                {renderHighlightedText(item.detail, { color: theme.textSecondary, fontSize: 14, lineHeight: 20, fontFamily: 'Vazirmatn-Regular' })}
            </View>
        </Pressable>
    ), [renderHighlightedText, router, theme.border, theme.surface, theme.surfaceVariant, theme.text, theme.textSecondary]);

    const emptyState = useMemo(() => (
        <View style={[styles.emptyState, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <MaterialCommunityIcons name="text-search" size={28} color={theme.textMuted} />
            <ThemedText type="smallBold">ابزاری پیدا نشد</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">عبارت دیگری را جست‌وجو کنید.</ThemedText>
        </View>
    ), [theme.border, theme.surface, theme.textMuted]);

    return (
        <ThemedView style={styles.container}>
            <View style={[styles.searchHeader, { backgroundColor: theme.background, paddingTop: insets.top }]}>
                {renderSearchBox()}
            </View>
            <SectionList
                style={styles.resultsList}
                sections={sections}
                keyExtractor={(item) => item.key}
                renderItem={renderItem}
                ListEmptyComponent={emptyState}
                contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.four }]}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                showsVerticalScrollIndicator={false}
                stickySectionHeadersEnabled={false}
                initialNumToRender={12}
                maxToRenderPerBatch={12}
                windowSize={5}
            />
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    searchHeader: { zIndex: 1 },
    resultsList: { flex: 1 },
    content: { flexGrow: 1 },
    searchBox: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingHorizontal: Spacing.two, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth },
    searchInput: { flex: 1, minHeight: 60, paddingVertical: 0, fontFamily: 'Vazirmatn-Regular', fontSize: 16, textAlign: 'right' },
    listItem: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingHorizontal: Spacing.three, paddingVertical: Spacing.three, borderBottomWidth: StyleSheet.hairlineWidth },
    lastListItem: { borderBottomWidth: 0, marginBottom: Spacing.three },
    itemIcon: { width: 50, height: 50, borderRadius: 25, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    itemTextWrap: { flex: 1, minWidth: 0, gap: Spacing.one },
    emptyState: { flex: 1, minHeight: 180, alignItems: 'center', justifyContent: 'center', gap: Spacing.one, padding: Spacing.four, borderRadius: 16, borderWidth: 1 },
});
