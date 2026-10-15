import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';

export default function EditProfileScreen() {
    return (
        <ThemedView style={styles.container}>
            <View style={styles.card}>
                <ThemedText type="largeTitle">ویرایش پروفایل</ThemedText>
                <ThemedText type="body" style={styles.subtitle}>در این صفحه فرم ویرایش اطلاعات حساب کاربری در آینده قرار می‌گیرد.</ThemedText>
            </View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: Spacing.four, justifyContent: 'center' },
    card: { backgroundColor: '#fff', borderRadius: Radius.md, padding: Spacing.four, gap: Spacing.two },
    subtitle: { lineHeight: 24 },
});
