import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';

interface HiddenCalculationGuideProps {
    title?: string;
    children: ReactNode;
}

export function HiddenCalculationGuide({
    title = 'فرمول محاسبه',
    children,
}: HiddenCalculationGuideProps) {
    return (
        <View style={styles.box} accessible={false}>
            <ThemedText type="smallBold" themeColor="textSecondary">
                {title}
            </ThemedText>
            <ThemedText type="small">{children}</ThemedText>
        </View>
    );
}

const styles = StyleSheet.create({
    box: {
        display: 'none',
        borderRadius: 12,
        borderWidth: StyleSheet.hairlineWidth,
        padding: Spacing.two,
        gap: Spacing.one,
    },
});
