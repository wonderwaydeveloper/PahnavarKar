import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WebBadge } from '@/components/web-badge';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function HomeTabScreen() {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const actions = [
        {
            key: 'yearly-info',
            title: 'اطلاعات سال کارکرد',
            icon: 'calendar-range' as const,
            accent: '#4f46e5',
            detail: 'مشاهده اطلاعات سال کارکرد و جزئیات آن',
            onPress: () => router.push('/home/yearly-info'),
        },
        {
            key: 'base-salary',
            title: 'محاسبه حقوق پایه',
            icon: 'calculator-variant' as const,
            accent: '#0f766e',
            detail: 'محاسبه حقوق پایه و نمایش جزئیات آن',
            onPress: () => router.push('/home/base-salary'),
        },
        {
            key: 'family-allowance',
            title: 'حق عائله‌مندی',
            icon: 'family-tree' as const,
            accent: '#d97706',
            detail: 'محاسبه حق عائله‌مندی و نمایش جزئیات آن',
            onPress: () => router.push('/home/family-allowance'),
        },
    ];

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <ScrollView
                    contentContainerStyle={[
                        styles.scrollContent,
                        {
                            paddingTop: Spacing.two,
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
                                    onPress={action.onPress}
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
            </SafeAreaView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1, paddingHorizontal: Spacing.four },
    scrollContent: { flexGrow: 1, paddingTop: Spacing.two },
    sectionWrap: {
        gap: Spacing.one,
    },
    sectionTitle: {
        marginHorizontal: Spacing.one,
    },
    listCard: {
        borderRadius: 22,
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
        fontSize: 15,
        lineHeight: 22,
    },
    itemDetail: {
        fontSize: 11,
        lineHeight: 16,
    },
});
