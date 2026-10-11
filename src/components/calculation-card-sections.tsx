import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface CalculationDescriptionBoxProps {
    children: ReactNode;
}

export function CalculationDescriptionBox({ children }: CalculationDescriptionBoxProps) {
    const theme = useTheme();

    return (
        <View
            style={[
                styles.descriptionBox,
                {
                    backgroundColor: theme.surfaceVariant,
                    borderColor: theme.border,
                },
            ]}
        >
            {children}
        </View>
    );
}

interface CalculationResultHeadingProps {
    topRadius?: number;
}

export function CalculationResultHeading({ topRadius = 12 }: CalculationResultHeadingProps) {
    const theme = useTheme();

    return (
        <View
            style={[
                styles.resultHeading,
                {
                    borderTopLeftRadius: topRadius,
                    borderTopRightRadius: topRadius,
                },
                {
                    backgroundColor: theme.surfaceVariant,
                    borderColor: theme.border,
                },
            ]}
        >
            <ThemedText type="smallBold" style={{ color: theme.textSecondary }}>
                نتیجه ی محاسبه
            </ThemedText>
        </View>
    );
}

const styles = StyleSheet.create({
    descriptionBox: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        borderWidth: StyleSheet.hairlineWidth,
        elevation: 2,
        marginTop: -Spacing.four,
        marginHorizontal: -Spacing.three,
        paddingHorizontal: Spacing.two,
        paddingVertical: Spacing.two,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 3,
    },
    resultHeading: {
        alignItems: 'center',
        borderWidth: StyleSheet.hairlineWidth,
        elevation: 2,
        marginTop: -Spacing.three,
        marginHorizontal: -Spacing.two,
        paddingHorizontal: Spacing.two,
        paddingVertical: Spacing.two,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 3,
    },
});
