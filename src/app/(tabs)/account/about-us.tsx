import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const aboutSections = [
    {
        title: 'ماموریت ما',
        description: 'ایجاد یک تجربه ساده، دقیق و قابل اعتماد برای محاسبه حقوق و مزایای کارکنان در مسیر مدیریت منابع انسانی و برنامه‌ریزی.',
        icon: 'target',
    },
    {
        title: 'چرا ما',
        description: 'با تمرکز بر دقت، رابط کاربری روان و سازگاری با نیازهای ایرانی، ابزارهایی طراحی کرده‌ایم که محاسبات را سریع‌تر و شفاف‌تر می‌کنند.',
        icon: 'lightbulb-on-outline',
    },
    {
        title: 'ارزش‌های ما',
        description: 'شفافیت، دقت در داده‌ها، سادگی استفاده و پشتیبانی از تجربه‌ی فارسی برای کاربران ایرانی.',
        icon: 'heart-outline',
    },
];

export default function AboutUsScreen() {
    const theme = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={[styles.heroCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={styles.heroCardContent}>
                        <Image
                            source={require('@/assets/images/icon.png')}
                            style={[styles.avatar, { backgroundColor: theme.primaryContainer, width: 64, height: 64, borderRadius: 16 }]}
                        />

                        <View style={styles.brandBlock}>
                            <ThemedText type="bodyBold" style={[styles.titleText, { color: theme.text }]}>درباره پهناور کار</ThemedText>
                        </View>

                        <ThemedText type="body" style={[styles.heroText, { color: theme.textSecondary }]}>
                            ما با هدف ساده‌سازی محاسبات حقوق و دستمزد، ابزارهایی کاربردی و قابل اعتماد برای کاربران فراهم کرده‌ایم.
                        </ThemedText>
                    </View>
                </View>

                <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={[styles.infoCardContent, { padding: Spacing.three }]}>
                        {aboutSections.map((section, index) => (
                            <View key={section.title}>
                                <View style={styles.sectionRow}>
                                    <View style={[styles.iconWrap, { backgroundColor: theme.primaryContainer, borderRadius: 999, width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }]}>
                                        <MaterialCommunityIcons name={section.icon as any} size={20} color={theme.primary} />
                                    </View>

                                    <View style={styles.textBlock}>
                                        <ThemedText type="labelBold" style={{ color: theme.text }}>{section.title}</ThemedText>
                                        <ThemedText type="body" style={[styles.sectionDescription, { color: theme.textSecondary }]}>
                                            {section.description}
                                        </ThemedText>
                                    </View>
                                </View>

                                {index < aboutSections.length - 1 && (
                                    <View style={[styles.divider, { backgroundColor: theme.border }]} />
                                )}
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { flexGrow: 1, padding: Spacing.four, gap: Spacing.three },
    heroCardContent: { alignItems: 'center', gap: Spacing.two, padding: Spacing.three },
    infoCardContent: { gap: Spacing.two, alignItems: 'stretch' },
    heroCard: {
        borderRadius: 20,
        borderWidth: 1,
        padding: 0,
    },
    infoCard: {
        borderRadius: 20,
        borderWidth: 1,
    },
    avatar: {
        marginTop: Spacing.one,
    },
    brandBlock: {
        alignItems: 'center',
        gap: Spacing.one,
    },
    titleText: {},
    subtitleText: {},
    heroText: { lineHeight: 24 },
    sectionRow: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.two,
        paddingVertical: Spacing.one,
    },
    iconWrap: {
        marginTop: Spacing.one,
    },
    textBlock: { flex: 1, gap: Spacing.one, alignItems: 'flex-start' },
    sectionDescription: { lineHeight: 24 },
    divider: {
        marginVertical: Spacing.one,
        height: 1,
    },
});
