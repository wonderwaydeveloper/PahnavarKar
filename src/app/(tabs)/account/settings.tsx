import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Snackbar } from 'react-native-paper';

import type { FontPreference } from '@/context/app.context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useAppContext } from '@/hooks/use-app-context';
import { useTheme } from '@/hooks/use-theme';
import { getAppFontFamily, loadAppFonts } from '@/services/font-service';

type SettingRowProps = {
    icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
    title: string;
    selected: boolean;
    previewFont?: FontPreference;
    disabled?: boolean;
    showDivider?: boolean;
    onPress: () => void;
};

function SettingRow({
    icon,
    title,
    selected,
    previewFont,
    disabled = false,
    showDivider = true,
    onPress,
}: SettingRowProps) {
    const theme = useTheme();

    return (
        <Pressable
            accessibilityRole="radio"
            accessibilityState={{ selected, disabled }}
            disabled={disabled}
            onPress={onPress}
            style={({ pressed }) => [
                styles.optionRow,
                showDivider && { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth },
                disabled && styles.disabledRow,
                pressed && !disabled && { backgroundColor: theme.surfaceVariant },
            ]}
        >
            <View style={[styles.optionIcon, { backgroundColor: selected ? theme.primaryContainer : theme.surfaceVariant }]}>
                <MaterialCommunityIcons
                    name={icon}
                    size={21}
                    color={selected ? theme.primary : theme.textSecondary}
                />
            </View>
            <View style={styles.optionText}>
                {previewFont ? (
                    <Text
                        style={[
                            styles.fontPreview,
                            {
                                color: theme.text,
                                fontFamily: previewFont === 'system' ? undefined : getAppFontFamily(previewFont, 'Bold'),
                                fontWeight: previewFont === 'system' ? '700' : 'normal',
                            },
                        ]}
                    >
                        {title}
                    </Text>
                ) : (
                    <ThemedText type="smallBold">{title}</ThemedText>
                )}
            </View>
            <MaterialCommunityIcons
                name={selected ? 'radiobox-marked' : 'radiobox-blank'}
                size={22}
                color={selected ? theme.primary : theme.textMuted}
            />
        </Pressable>
    );
}

export default function SettingsScreen() {
    const theme = useTheme();
    const {
        themePreference,
        setTheme,
        fontPreference,
        setFontPreference,
        fontError: fontLoadError,
        clearFontError,
    } = useAppContext();
    const [fontActionError, setFontActionError] = useState('');
    const [fontChangePending, setFontChangePending] = useState(false);

    useEffect(() => {
        let isMounted = true;

        void Promise.all([
            loadAppFonts('iransans'),
            loadAppFonts('vazir'),
            loadAppFonts('shabnam'),
        ]).catch((error: unknown) => {
            console.error('Unable to load font previews', error);
            if (isMounted) {
                const reason = error instanceof Error && error.message ? ` (${error.message})` : '';
                setFontActionError(`بارگذاری نمونهٔ فونت‌ها انجام نشد${reason}`);
            }
        });

        return () => {
            isMounted = false;
        };
    }, []);

    const handleFontChange = async (value: FontPreference) => {
        if (value === fontPreference || fontChangePending) return;

        setFontChangePending(true);
        setFontActionError('');
        try {
            await setFontPreference(value);
        } catch (error) {
            const reason = error instanceof Error && error.message ? ` (${error.message})` : '';
            setFontActionError(`بارگذاری یا ذخیرهٔ فونت انتخاب‌شده انجام نشد${reason}`);
        } finally {
            setFontChangePending(false);
        }
    };

    const dismissFontError = () => {
        setFontActionError('');
        clearFontError();
    };

    return (
        <ThemedView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.section}>
                    <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
                        ظاهر برنامه
                    </ThemedText>
                    <View style={[styles.optionsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <SettingRow
                            icon="white-balance-sunny"
                            title="روشن"
                            selected={themePreference === 'light'}
                            onPress={() => setTheme('light')}
                        />
                        <SettingRow
                            icon="moon-waning-crescent"
                            title="تاریک"
                            selected={themePreference === 'dark'}
                            onPress={() => setTheme('dark')}
                        />
                        <SettingRow
                            icon="cellphone-cog"
                            title="سیستم"
                            selected={themePreference === 'system'}
                            showDivider={false}
                            onPress={() => setTheme('system')}
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
                        فونت برنامه
                    </ThemedText>
                    <View
                        accessibilityRole="radiogroup"
                        style={[styles.optionsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                    >
                        <SettingRow
                            icon="format-font"
                            title="ایران سنس"
                            selected={fontPreference === 'iransans'}
                            previewFont="iransans"
                            disabled={fontChangePending}
                            onPress={() => void handleFontChange('iransans')}
                        />
                        <SettingRow
                            icon="format-font"
                            title="وزیر"
                            selected={fontPreference === 'vazir'}
                            previewFont="vazir"
                            disabled={fontChangePending}
                            onPress={() => void handleFontChange('vazir')}
                        />
                        <SettingRow
                            icon="format-font"
                            title="شبنم"
                            selected={fontPreference === 'shabnam'}
                            previewFont="shabnam"
                            disabled={fontChangePending}
                            onPress={() => void handleFontChange('shabnam')}
                        />
                        <SettingRow
                            icon="format-font"
                            title="فونت پیش‌فرض سیستم"
                            selected={fontPreference === 'system'}
                            previewFont="system"
                            disabled={fontChangePending}
                            showDivider={false}
                            onPress={() => void handleFontChange('system')}
                        />
                    </View>
                </View>
            </ScrollView>

            <Snackbar
                visible={fontActionError.length > 0 || !!fontLoadError}
                onDismiss={dismissFontError}
                duration={5000}
            >
                {fontActionError || fontLoadError}
            </Snackbar>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: {
        width: '100%',
        maxWidth: 680,
        alignSelf: 'center',
        paddingHorizontal: Spacing.four,
        paddingTop: Spacing.four,
        paddingBottom: Spacing.five,
        gap: Spacing.three,
    },
    section: { gap: Spacing.two },
    sectionTitle: { paddingHorizontal: Spacing.one },
    optionsCard: {
        overflow: 'hidden',
        borderRadius: 20,
        borderWidth: 1,
    },
    optionRow: {
        minHeight: 60,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.two,
        paddingHorizontal: Spacing.three,
        paddingVertical: 12,
    },
    optionIcon: {
        width: 36,
        height: 36,
        borderRadius: Radius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    optionText: { flex: 1 },
    fontPreview: { fontSize: 14, lineHeight: 20 },
    disabledRow: { opacity: 0.55 },
});
