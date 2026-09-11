import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Fragment, memo, useRef, useState, type ComponentProps } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabBar, TabView, type NavigationState, type SceneRendererProps } from 'react-native-tab-view';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WebBadge } from '@/components/web-badge';
import { Spacing } from '@/constants/theme';
import { getToolRoute } from '@/constants/tool-routes';
import { useTheme } from '@/hooks/use-theme';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];
type HomeTab = 'all' | 'wage' | 'nonWage' | 'yearlyInfo' | 'rules';

type HomeRoute = {
    key: HomeTab;
    label: string;
};

type HomeAction = {
    key: string;
    title: string;
    detail: string;
    icon: IconName;
    accent: string;
    onPress: () => void;
};

const TAB_DIRECTION = 'rtl' as const;

const HOME_ROUTES: HomeRoute[] = [
    { key: 'all', label: 'همه' },
    { key: 'yearlyInfo', label: 'اطلاعات سال کارکرد' },
    { key: 'wage', label: 'اقلام مزدی' },
    { key: 'nonWage', label: 'اقلام غیر مزدی' },
    { key: 'rules', label: 'قوانین و مقررات' },
];

const WAGE_ACTION_KEYS = new Set([
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
    'friday-work',
    'suspension-wage',
]);

function runDebouncedAction(lastPressRef: { current: number }, callback: () => void) {
    const now = Date.now();
    if (now - lastPressRef.current < 500) {
        return;
    }

    lastPressRef.current = now;
    callback();
}

function createHomeActions(router: ReturnType<typeof useRouter>): HomeAction[] {
    const definitions: [string, string, string, IconName, string, string][] = [
        ['yearly-info', 'اطلاعات جامع مزدی از سال ۱۳۶۹ تاکنون', 'جزئیاتی جامع از مصوبات شورای عالی کار از سال ۱۳۶۹ تاکنون', 'calendar-range', '#4f46e5', '/home/yearly-info'],
        ['base-salary', 'حقوق پایه', 'محاسبه حقوق پایه و نمایش جزئیات آن', 'calculator-variant', '#0f766e', '/home/base-salary'],
        ['entitled-seniority', 'پایه سنوات استحقاقی', 'محاسبه پایه سنوات بر اساس تاریخ استخدام، تصفیه حساب تا پایان ۱۳۹۱ و طرح طبقه‌بندی مشاغل', 'cash-plus', '#0d9488', '/home/entitled-seniority'],
        ['housing-allowance', 'حق مسکن ماهیانه', 'محاسبه حق مسکن ماهیانه موضوع مصوبه هیات وزیران به تناسب بازه زمانی انتخابی', 'home-city', '#2563eb', '/home/housing-allowance'],
        ['monthly-allowance', 'بن کارگری ماهیانه', 'محاسبه بن کارگری مصوبه شورای عالی کار به تناسب بازه زمانی انتخابی', 'cash-multiple', '#8b5cf6', '/home/monthly-allowance'],
        ['family-allowance', 'حق عائله مندی', 'محاسبه حق عائله مندی براساس بند۲ماده ۸۶قانون تامین اجتماعی', 'family-tree', '#f59e0b', '/home/family-allowance'],
        ['spousal-allowance', 'حق تاهل استحقاقی', 'محاسبه حق تاهل براساس تصریح مصوبات شورای عالی کار از سال ۱۴۰۳', 'heart-outline', '#f43f5e', '/home/spousal-allowance'],
        ['monthly-shift-work', 'نوبت کاری ماهیانه', 'محاسبه نوبت‌کاری موضوع ماده ۵۵ قانون کار بر اساس ماده ۵۶ قانون کار', 'calendar-clock', '#0f766e', '/home/monthly-shift-work'],
        ['minimum-bonus', 'حداقل عیدی و پاداش استحقاقی', 'محاسبه حداقل عیدی و پاداش ماهیانه براساس ماده واحده قانون تعیین عیدی و پاداش، مصوب مجلس در سال ۱۳۷۰', 'gift-outline', '#ef4444', '/home/minimum-bonus'],
        ['maximum-bonus', 'حداکثر عیدی و پاداش استحقاقی', 'محاسبه حداکثر عیدی و پاداش ماهیانه براساس ماده واحده قانون تعیین عیدی و پاداش، مصوب مجلس در سال ۱۳۷۰', 'gift', '#ec4899', '/home/maximum-bonus'],
        ['overtime-entitlement', 'اضافه کاری استحقاقی', 'محاسبه فوق‌العاده اضافه‌کاری براساس شرح ماده ۵۹ قانون کار', 'clock-alert-outline', '#f97316', '/home/overtime-entitlement'],
        ['night-shift-entitlement', 'شب کاری استحقاقی', 'محاسبه فوق‌العاده شب‌کاری براساس شرح ماده ۵۸ قانون کار', 'weather-night', '#0ea5e9', '/home/night-shift-entitlement'],
        ['unused-leave-entitlement', 'میزان مرخصی ذخیره شده کارگر', 'محاسبه تعداد مرخصی ذخیره شده کارگر براساس مواد ۶۴ و ۶۹ قانون کار', 'calendar-clock', '#e11d48', '/home/unused-leave-entitlement'],
        ['unused-leave-wage', 'مزد مرخصی ذخیره شده کارگر', 'محاسبه مزد مرخصی ذخیره شده کارگر بر اساس آخرین ماه کارکرد', 'cash-clock', '#0891b2', '/home/unused-leave-wage'],
        ['insurance-days-entitlement', 'تعداد روزهای بیمه استحقاقی', 'محاسبه تعداد روزهای بیمه موضوع مفاد مواد ۳۹ و ۱۴۸ قانون کار', 'shield-check', '#22c55e', '/home/insurance-days-entitlement'],
        ['unemployment-insurance-entitlement', 'مدت زمان پرداخت مقرری بیمه بیکاری', 'محاسبه مدت زمان استحقاق دریافت مقرری بیمه بیکاری براساس ماده ۷ قانون بیمه بیکاری', 'briefcase-account', '#0284c7', '/home/unemployment-insurance-entitlement'],
        ['unemployment-insurance-allowance', 'مبلغ مقرری بیمه بیکاری', 'محاسبه مقرری بیمه بیکاری براساس بند ب ماده ۷ قانون بیمه بیکاری', 'cash-clock', '#0f766e', '/home/unemployment-insurance-allowance'],
        ['end-of-service-years', 'سنوات پایان کار', 'محاسبه سنوات پایان کار براساس ماده ۲۴ قانون کار', 'briefcase-clock', '#14b8a6', '/home/end-of-service-years'],
        ['friday-work', 'جمعه کاری', 'محاسبه مزد جمعه‌کاری‌های انجام‌شده براساس ماده ۶۲ قانون کار', 'calendar-star', '#f59e0b', '/home/friday-work'],
        ['suspension-wage', 'محاسبه حق‌السعی ایام تعلیق', 'محاسبه حق‌السعی ایام تعلیق موضوع ماده ۶۷ آیین دادرسی کار', 'pause-circle-outline', '#7c3aed', '/home/suspension-wage'],
        ['ordinary-work-hours', 'میزان ساعات کارکرد موظفی کارگر در مشاغل عادی', 'محاسبه میزان ساعات کارکرد موظفی کارگر در مشاغل عادی طبق ماده ۵۱ قانون کار', 'calendar-check-outline', '#0891b2', '/home/ordinary-work-hours'],
        ['hazardous-work-hours', 'میزان ساعات کارکرد موظفی کارگر در مشاغل سخت و زیان‌آور', 'تعیین ساعات کارکرد موظفی کارگر طبق ماده ۵۲ قانون کار', 'hard-hat', '#d97706', '/home/hazardous-work-hours'],
        ['young-worker-work-hours', 'میزان ساعات کارکرد موظفی کارگر نوجوان', 'تعیین ساعات کارکرد کارگر نوجوان طبق ماده ۸۰ قانون کار', 'account-child', '#be123c', '/home/young-worker-work-hours'],
        ['official-holiday-work', 'مبلغ تعطیل کاری استحقاقی', 'محاسبه مبلغ تعطیل‌کاری استحقاقی بر اساس تعداد روزهای تعطیل رسمی و مبلغ اضافه‌کاری هر ساعت', 'calendar-star', '#f97316', '/home/official-holiday-work'],
        ['illegal-foreign-worker-penalty', 'مبلغ جریمه به‌کارگیری اتباع بیگانه غیرمجاز', 'محاسبه جریمه به‌کارگیری اتباع بیگانه غیرمجاز بر اساس تعداد کارگران، روزهای بازه و حداقل مزد همان سال', 'account-alert-outline', '#dc2626', '/home/illegal-foreign-worker-penalty'],
        ['article-87', 'مبلغ اعمال ماده ۸۷ قانون کار', 'محاسبه مبلغ اعمال ماده ۸۷ قانون کار برای صدور پروانه کسب یا بهره‌برداری بر اساس متراژ زیربنا', 'file-document-edit-outline', '#0ea5e9', '/home/article-87'],
        ['social-security-premium-ceiling', 'سقف حق بیمه تامین اجتماعی', 'محاسبه سقف حق بیمه براساس حداقل مزد مصوب شورای عالی کار و تعداد روزهای ماه انتخابی', 'shield-check-outline', '#10b981', '/home/social-security-premium-ceiling'],
    ];

    return definitions.map(([key, title, detail, icon, accent, route]) => ({
        key,
        title,
        detail,
        icon,
        accent,
        onPress: () => router.push(getToolRoute(route) as never),
    }));
}

function filterActions(actions: HomeAction[], tab: HomeTab) {
    if (tab === 'all') return actions;
    if (tab === 'wage') return actions.filter((action) => WAGE_ACTION_KEYS.has(action.key));
    if (tab === 'nonWage') return actions.filter((action) => !WAGE_ACTION_KEYS.has(action.key) && action.key !== 'yearly-info');
    if (tab === 'yearlyInfo') return actions.filter((action) => action.key === 'yearly-info');
    return [];
}

function DebouncedPressable({ onPress, ...props }: Omit<ComponentProps<typeof Pressable>, 'onPress'> & { onPress?: () => void }) {
    const lastPressRef = useRef(0);
    return <Pressable {...props} onPress={() => runDebouncedAction(lastPressRef, () => onPress?.())} />;
}

type SceneProps = {
    tab: HomeTab;
    actions: HomeAction[];
    theme: ReturnType<typeof useTheme>;
    bottomInset: number;
};

const HomeScene = memo(function HomeScene({ tab, actions, theme, bottomInset }: SceneProps) {
    const tabActions = filterActions(actions, tab);
    const wageActions = tabActions.filter((action) => WAGE_ACTION_KEYS.has(action.key));
    const nonWageActions = tabActions.filter((action) => !WAGE_ACTION_KEYS.has(action.key) && action.key !== 'yearly-info');
    const yearlyInfoActions = tabActions.filter((action) => action.key === 'yearly-info');

    const renderActionList = (items: HomeAction[]) => (
        <View style={[styles.listCard, { backgroundColor: theme.surface }]}>
            {items.map((action, index) => (
                <Fragment key={action.key}>
                    <DebouncedPressable
                        onPress={action.onPress}
                        style={({ pressed }) => [
                            styles.listItem,
                            index === 0 && styles.firstListItem,
                            { backgroundColor: pressed ? theme.surfaceVariant : theme.surface },
                        ]}
                    >
                        <View style={[styles.itemIcon, { backgroundColor: `${action.accent}1A`, borderColor: `${action.accent}55` }]}>
                            <MaterialCommunityIcons name={action.icon} size={23} color={action.accent} />
                        </View>
                        <View style={styles.itemTextWrap}>
                            <ThemedText type="smallBold" numberOfLines={1} style={{ color: theme.text }}>{action.title}</ThemedText>
                            <ThemedText type="small" style={{ color: theme.textSecondary }}>{action.detail}</ThemedText>
                        </View>
                    </DebouncedPressable>
                    {index < items.length - 1 ? <View style={[styles.chatSeparator, { backgroundColor: theme.border }]} /> : null}
                </Fragment>
            ))}
        </View>
    );

    const renderSection = (items: HomeAction[]) => items.length > 0 ? (
        <View style={styles.categorySection}>
            {renderActionList(items)}
        </View>
    ) : null;

    return (
        <ScrollView
            style={styles.sceneScroll}
            contentContainerStyle={[styles.sceneContent, { paddingBottom: bottomInset + Spacing.four }]}
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.page}>
                {tabActions.length > 0 ? (
                    <>
                        {renderSection(wageActions)}
                        {renderSection(nonWageActions)}
                        {renderSection(yearlyInfoActions)}
                    </>
                ) : (
                    <View style={[styles.listCard, { backgroundColor: theme.surface }]}>
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons name="book-open-page-variant-outline" size={28} color={theme.textMuted} />
                            <ThemedText type="smallBold" style={{ color: theme.text }}>قوانین و مقررات به‌زودی اضافه می‌شود</ThemedText>
                        </View>
                    </View>
                )}
            </View>
            {Platform.OS === 'web' && <WebBadge />}
        </ScrollView>
    );
});

export default function HomeTabScreen() {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { width } = useWindowDimensions();
    const [tabIndex, setTabIndex] = useState(0);
    const actions = createHomeActions(router);

    const renderScene = ({ route }: { route: HomeRoute }) => (
        <HomeScene tab={route.key} actions={actions} theme={theme} bottomInset={insets.bottom} />
    );

    const renderTabBar = (props: SceneRendererProps & { navigationState: NavigationState<HomeRoute> }) => (
        <TabBar
            {...props}
            direction={TAB_DIRECTION}
            scrollEnabled
            gap={Spacing.one}
            activeColor={theme.primary}
            inactiveColor={theme.textSecondary}
            indicatorStyle={[styles.tabIndicator, { backgroundColor: theme.primary }]}
            style={[styles.tabBar, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}
            tabStyle={styles.tabStyle}
            contentContainerStyle={styles.tabBarContent}
        />
    );

    return (
        <ThemedView style={styles.container}>
            <TabView
                navigationState={{ index: tabIndex, routes: HOME_ROUTES }}
                onIndexChange={setTabIndex}
                renderScene={renderScene}
                renderTabBar={renderTabBar}
                direction={TAB_DIRECTION}
                commonOptions={{
                    label: ({ route, color }) => (
                        <ThemedText type="smallBold" style={[styles.tabLabel, { color }]}>{route.label}</ThemedText>
                    ),
                }}
                initialLayout={{ width }}
                lazy
                renderLazyPlaceholder={() => <View style={[styles.lazyPlaceholder, { backgroundColor: theme.background }]} />}
                style={styles.tabView}
            />
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    tabView: { flex: 1 },
    tabBar: { borderBottomWidth: StyleSheet.hairlineWidth, elevation: 0 },
    tabBarContent: { paddingHorizontal: Spacing.two },
    tabStyle: { width: 'auto', minHeight: 54, paddingHorizontal: Spacing.two },
    tabLabel: { fontFamily: 'Vazirmatn-Medium', fontSize: 12, textTransform: 'none' },
    tabIndicator: { height: 3, borderRadius: 2 },
    sceneScroll: { flex: 1 },
    sceneContent: { flexGrow: 1 },
    lazyPlaceholder: { flex: 1 },
    page: { gap: Spacing.one },
    categorySection: { gap: Spacing.one, marginTop: 0 },
    listCard: { overflow: 'hidden', borderRadius: Spacing.two },
    listItem: { minHeight: 84, flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingHorizontal: Spacing.three, paddingVertical: Spacing.three },
    firstListItem: { borderTopWidth: 0 },
    chatSeparator: { height: StyleSheet.hairlineWidth, marginStart: Spacing.three + 50 + Spacing.two },
    itemIcon: { width: 50, height: 50, borderRadius: 25, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    itemTextWrap: { flex: 1, minWidth: 0, gap: Spacing.one },
    emptyState: { minHeight: 150, alignItems: 'center', justifyContent: 'center', gap: Spacing.one, padding: Spacing.four },
});
