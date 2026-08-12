import { ScrollView, StyleSheet, View } from 'react-native';
import { Avatar, Card, Divider, Text } from 'react-native-paper';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const aboutSections = [
    {
        title: 'ماموریت ما',
        description: 'ایجاد یک تجربه ساده، دقیق و قابل اعتماد برای محاسبه حقوق و مزایای کارکنان در مسیر مدیریت منابع انسانی و برنامه‌ریزی مالی.',
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
                <Card elevation={1} style={[styles.heroCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Card.Content style={styles.heroCardContent}>
                        <Avatar.Image
                            size={88}
                            source={require('@/assets/images/icon.png')}
                            style={[styles.avatar, { backgroundColor: theme.primaryContainer }]}
                        />

                        <View style={styles.brandBlock}>
                            <Text variant="titleLarge" style={[styles.titleText, { color: theme.text }]}>درباره پهناور کار</Text>
                        </View>

                        <Text variant="bodyMedium" style={[styles.heroText, { color: theme.textSecondary }]}>
                            ما با هدف ساده‌سازی محاسبات مالی و حقوق و دستمزد، ابزارهایی کاربردی و قابل اعتماد برای کاربران فراهم کرده‌ایم.
                        </Text>
                    </Card.Content>
                </Card>

                <Card elevation={1} style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Card.Content style={styles.infoCardContent}>
                        {aboutSections.map((section, index) => (
                            <View key={section.title}>
                                <View style={styles.sectionRow}>
                                    <Avatar.Icon
                                        size={42}
                                        icon={section.icon as any}
                                        color={theme.primary}
                                        style={[styles.iconWrap, { backgroundColor: theme.primaryContainer }]}
                                    />

                                    <View style={styles.textBlock}>
                                        <Text variant="titleSmall" style={{ color: theme.text }}>{section.title}</Text>
                                        <Text variant="bodyMedium" style={[styles.sectionDescription, { color: theme.textSecondary }]}>
                                            {section.description}
                                        </Text>
                                    </View>
                                </View>

                                {index < aboutSections.length - 1 && (
                                    <Divider style={[styles.divider, { backgroundColor: theme.border }]} />
                                )}
                            </View>
                        ))}
                    </Card.Content>
                </Card>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { flexGrow: 1, padding: Spacing.four, gap: Spacing.three },
    heroCardContent: { alignItems: 'center', gap: Spacing.two },
    infoCardContent: { gap: Spacing.two, alignItems: 'stretch' },
    heroCard: {
        borderRadius: 24,
        borderWidth: 1,
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
