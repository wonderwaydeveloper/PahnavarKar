import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Snackbar } from 'react-native-paper';

import appConfig from '@/../app.json';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const profileActions = [
    { key: 'edit-profile', label: 'ویرایش پروفایل', subtitle: 'تغییر اطلاعات شخصی و حساب شما', icon: 'account-edit', color: '#4f46e5' },
    { key: 'settings', label: 'تنظیمات', subtitle: 'مدیریت ترجیحات و رفتار برنامه', icon: 'cog-outline', color: '#0f766e' },
    { key: 'support', label: 'پشتیبانی', subtitle: 'ارتباط سریع با تیم پشتیبانی', icon: 'lifebuoy', color: '#d97706' },
    { key: 'about-us', label: 'درباره ما', subtitle: 'معرفی پروژه و اهداف ما', icon: 'information-outline', color: '#ec4899' },
];

const profileFields = [
    { label: 'نام و نام خانوادگی', value: 'کاربر نمونه' },
    { label: 'نام کاربری', value: 'user_demo' },
    { label: 'ایمیل', value: 'user@example.com' },
    { label: 'شماره تلفن', value: '۰۹۱۲-۳۴۵-۶۷۸۹' },
    { label: 'نوع عضویت', value: 'عادی' },
    { label: 'تاریخ عضویت', value: '۱۴۰۳/۰۲/۰۱' },
    { label: 'وضعیت حساب', value: 'فعال', isStatus: true },
];

export default function AccountScreen() {
    const theme = useTheme();
    const router = useRouter();
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const appVersion = appConfig.expo?.version ?? '1.0.0';

    const handleUnavailableAction = (key: string) => {
        if (key === 'about-us' || key === 'app-info') {
            router.push(`/(tabs)/account/${key}` as any);
            return;
        }

        setSnackbarVisible(true);
    };

    return (
        <ThemedView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.sectionWrap}>
                    <ThemedText type="smallBold" style={[styles.sectionTitle, { color: theme.text }]}>اطلاعات کاربری</ThemedText>

                    <View style={[styles.profileCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <View style={[styles.profileHeader, { backgroundColor: theme.surface }]}>
                            <View style={[styles.avatarWrap, { backgroundColor: theme.primaryContainer }]}>
                                <MaterialCommunityIcons name="account-circle" size={54} color={theme.primary} />
                            </View>

                            <View style={styles.identityBlock}>
                                <ThemedText type="largeTitle" style={styles.name}>کاربر نمونه</ThemedText>
                                <ThemedText type="small" style={[styles.role, { color: theme.textSecondary }]}>کاربر حرفه‌ای</ThemedText>
                            </View>
                        </View>

                        <View style={styles.infoCard}>
                            {profileFields.map((field, index) => (
                                <View
                                    key={field.label}
                                    style={[
                                        styles.infoRow,
                                        index !== 0 && styles.infoRowSeparated,
                                        { borderTopColor: theme.border },
                                    ]}
                                >
                                    <ThemedText type="small" style={[styles.infoLabel, { color: theme.textSecondary }]}>
                                        {field.label}
                                    </ThemedText>

                                    {field.isStatus ? (
                                        <View style={styles.statusStack}>
                                            <View
                                                style={[
                                                    styles.valueChip,
                                                    { backgroundColor: `${theme.success}1A`, borderColor: `${theme.success}33` },
                                                ]}
                                            >
                                                <ThemedText type="smallBold" style={[styles.statusChipText, { color: theme.success }]}>
                                                    {field.value}
                                                </ThemedText>
                                            </View>
                                        </View>
                                    ) : (
                                        <ThemedText type="smallBold" style={[styles.infoValue, { color: theme.text }]}>
                                            {field.value}
                                        </ThemedText>
                                    )}
                                </View>
                            ))}
                        </View>
                    </View>
                </View>

                <View style={styles.sectionWrap}>
                    <ThemedText type="smallBold" style={[styles.sectionTitle, { color: theme.text }]}>اطلاعات برنامه</ThemedText>

                    <Pressable
                        onPress={() => router.push('/(tabs)/account/app-info' as any)}
                        style={({ pressed }) => [
                            styles.appInfoListItem,
                            {
                                backgroundColor: theme.surface,
                                borderColor: theme.border,
                                opacity: pressed ? 0.88 : 1,
                            },
                        ]}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: '#26C6DA1A' }]}>
                            <MaterialCommunityIcons name="information-outline" size={20} color={theme.primary} />
                        </View>

                        <View style={styles.actionTextWrap}>
                            <ThemedText type="smallBold" style={[styles.actionLabel, { color: theme.text }]}>
                                اطلاعات برنامه
                            </ThemedText>
                            <ThemedText type="small" style={[styles.actionSubtitle, { color: theme.textSecondary }]}>
                                نام، نسخه و وضعیت برنامه
                            </ThemedText>
                        </View>

                        <View style={styles.valuePill}>
                            <ThemedText type="smallBold" style={[styles.valueText, { color: theme.success }]}>
                                {appVersion}
                            </ThemedText>
                        </View>

                        <MaterialCommunityIcons name="chevron-left" size={18} color={theme.textSecondary} />
                    </Pressable>
                </View>

                <View style={styles.sectionWrap}>
                    <ThemedText type="smallBold" style={[styles.sectionTitle, { color: theme.text }]}>فعالیت‌ها</ThemedText>

                    <View style={[styles.actionsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        {profileActions.map((action, index) => (
                            <Pressable
                                key={action.key}
                                onPress={() => handleUnavailableAction(action.key)}
                                style={({ pressed }) => [
                                    styles.actionItem,
                                    index !== 0 && styles.actionItemSeparated,
                                    {
                                        opacity: pressed ? 0.88 : 1,
                                        borderTopColor: theme.border,
                                    },
                                ]}
                            >
                                <View style={[styles.actionIcon, { backgroundColor: `${action.color}1A` }]}>
                                    <MaterialCommunityIcons name={action.icon as any} size={20} color={action.color} />
                                </View>

                                <View style={styles.actionTextWrap}>
                                    <ThemedText type="smallBold" style={[styles.actionLabel, { color: theme.text }]}>
                                        {action.label}
                                    </ThemedText>
                                    <ThemedText type="small" style={[styles.actionSubtitle, { color: theme.textSecondary }]}>
                                        {action.subtitle}
                                    </ThemedText>
                                </View>

                                <MaterialCommunityIcons name="chevron-left" size={18} color={theme.textSecondary} />
                            </Pressable>
                        ))}
                    </View>
                </View>

                <Pressable
                    onPress={() => setSnackbarVisible(true)}
                    style={[styles.logoutButton, { backgroundColor: theme.error }]}
                >
                    <MaterialCommunityIcons name="logout" size={18} color="#ffffff" />
                    <ThemedText type="smallBold" style={styles.logoutText}>خروج از حساب</ThemedText>
                </Pressable>
            </ScrollView>

            <Snackbar
                visible={snackbarVisible}
                onDismiss={() => setSnackbarVisible(false)}
                duration={3000}
                style={{ backgroundColor: theme.error, borderRadius: Radius.md }}
                action={{
                    label: 'بستن',
                    onPress: () => setSnackbarVisible(false),
                    labelStyle: { color: theme.surface },
                }}
            >
                <ThemedText type="small" style={{ color: theme.surface }}>
                    به زودی فعال می‌شود
                </ThemedText>
            </Snackbar>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { flexGrow: 1, padding: Spacing.four, gap: Spacing.three },
    profileCard: {
        borderRadius: 20,
        borderWidth: 1,
        overflow: 'hidden',
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.three,
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.three,
    },
    avatarWrap: {
        width: 64,
        height: 64,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    identityBlock: {
        flex: 1,
        alignItems: 'flex-start',
        gap: Spacing.one,
    },
    name: {},
    role: {},
    metricRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: Spacing.two,
        paddingHorizontal: Spacing.four,
        paddingVertical: Spacing.two,
    },
    metricBox: {
        flex: 1,
        borderRadius: 16,
        paddingVertical: Spacing.two,
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.one,
    },
    metricNumber: {
        fontSize: 20,
    },
    metricLabel: {
        fontSize: 12,
    },
    infoCard: {
        paddingHorizontal: Spacing.three,
        paddingBottom: Spacing.three,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 0,
        paddingTop: Spacing.three,
        paddingBottom: Spacing.three,
    },
    infoRowSeparated: {
        borderTopWidth: 1,
    },
    infoLabel: {
        opacity: 0.82,
    },
    infoValue: {
        marginLeft: Spacing.two,
    },
    valueChip: {
        paddingHorizontal: Spacing.two,
        paddingVertical: Spacing.one,
        borderRadius: 999,
        borderWidth: 1,
        alignSelf: 'flex-end',
    },
    statusStack: {
        alignItems: 'flex-end',
        marginTop: Spacing.one,
    },
    statusChipText: {
        fontSize: 11,
    },
    appInfoCard: {
        borderRadius: 20,
        borderWidth: 1,
        padding: Spacing.three,
        gap: Spacing.two,
    },
    appInfoListItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.two,
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.three,
        borderRadius: 20,
        borderWidth: 1,
    },
    sectionWrap: {
        gap: Spacing.one,
    },
    actionsCard: {
        borderRadius: 20,
        borderWidth: 1,
        padding: Spacing.three,
        gap: Spacing.two,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.one,
    },
    sectionTitle: {
        marginBottom: Spacing.one,
    },
    appInfoRows: {
        gap: Spacing.one,
    },
    appInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        paddingTop: Spacing.three,
        paddingBottom: Spacing.one,
    },
    actionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.two,
        paddingVertical: Spacing.three,
        paddingHorizontal: Spacing.two,
        borderRadius: 14,
        borderTopWidth: 0,
    },
    actionItemSeparated: {
        borderTopWidth: 1,
    },
    actionIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionTextWrap: {
        flex: 1,
        gap: 2,
    },
    actionLabel: {
        flex: 1,
    },
    actionSubtitle: {
        fontSize: 11,
        lineHeight: 15,
    },
    valuePill: {
        paddingHorizontal: Spacing.two,
        paddingVertical: Spacing.one,
        borderRadius: 999,
        backgroundColor: '#E3F0F4',
    },
    valueText: {
        fontSize: 11,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.two,
        paddingVertical: Spacing.three,
        borderRadius: 16,
    },
    logoutText: {
        color: '#ffffff',
    },
});
