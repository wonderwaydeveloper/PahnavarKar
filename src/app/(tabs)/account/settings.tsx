import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export default function SettingsScreen() {
    return (
        <ThemedView style={styles.container}>
            <View style={styles.card}>
                <ThemedText type="largeTitle">تنظیمات</ThemedText>
                <ThemedText type="body" style={styles.subtitle}>در این صفحه تنظیمات حساب و اعلان‌ها آینده‌دار خواهد بود.</ThemedText>
            </View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: Spacing.four, justifyContent: 'center' },
    card: { backgroundColor: '#fff', borderRadius: 20, padding: Spacing.four, gap: Spacing.two },
    subtitle: { lineHeight: 24 },
});
