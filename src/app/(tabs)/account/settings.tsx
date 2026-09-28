import { StyleSheet, View } from 'react-native';
import { SegmentedButtons } from 'react-native-paper';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAppContext } from '@/hooks/use-app-context';
import { useTheme } from '@/hooks/use-theme';

export default function SettingsScreen() {
    const theme = useTheme();
    const { themePreference, setTheme } = useAppContext();

    return (
        <ThemedView style={styles.container}>
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.settingGroup}>
                    <ThemedText type="bodyBold">ظاهر برنامه</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                        حالت رنگی برنامه را انتخاب کنید.
                    </ThemedText>
                    <SegmentedButtons
                        value={themePreference}
                        onValueChange={(value) => setTheme(value as typeof themePreference)}
                        buttons={[
                            { value: 'light', label: 'روشن', icon: 'white-balance-sunny' },
                            { value: 'dark', label: 'تاریک', icon: 'moon-waning-crescent' },
                            { value: 'system', label: 'سیستم', icon: 'cellphone-cog' },
                        ]}
                        theme={{
                            colors: {
                                primary: theme.primary,
                                onSurface: theme.text,
                                surface: theme.surface,
                                outline: theme.border,
                            },
                        }}
                    />
                </View>
            </View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: Spacing.four, justifyContent: 'flex-start' },
    card: { borderRadius: 20, borderWidth: 1, padding: Spacing.four, gap: Spacing.four },
    settingGroup: { gap: Spacing.two },
});
