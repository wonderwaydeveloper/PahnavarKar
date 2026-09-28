import { MaterialCommunityIcons } from '@expo/vector-icons';
import { type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { ToolDefinition } from '@/constants/tool-definitions';
import { useTheme } from '@/hooks/use-theme';

interface ToolListItemProps {
    tool: ToolDefinition;
    onPress: () => void;
    titleContent?: ReactNode;
    detailContent?: ReactNode;
    showBottomBorder?: boolean;
}

export function ToolListItem({
    tool,
    onPress,
    titleContent,
    detailContent,
    showBottomBorder = false,
}: ToolListItemProps) {
    const theme = useTheme();

    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
                styles.item,
                {
                    backgroundColor: pressed ? theme.surfaceVariant : theme.surface,
                    borderBottomColor: theme.border,
                },
                showBottomBorder && styles.withBottomBorder,
            ]}
            accessibilityRole="button"
            accessibilityLabel={tool.title}
        >
            <View style={[styles.icon, { backgroundColor: tool.accent, borderColor: tool.accent }]}>
                <MaterialCommunityIcons name={tool.icon} size={23} color="#FFFFFF" />
            </View>
            <View style={styles.textWrap}>
                {titleContent ?? (
                    <ThemedText type="smallBold" style={{ color: theme.text }}>
                        {tool.title}
                    </ThemedText>
                )}
                {detailContent ?? (
                    <ThemedText type="small" style={{ color: theme.textSecondary, fontSize: 13, lineHeight: 19 }}>
                        {tool.detail}
                    </ThemedText>
                )}
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    item: {
        minHeight: 84,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.two,
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.three,
    },
    withBottomBorder: {
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    icon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textWrap: {
        flex: 1,
        minWidth: 0,
        gap: Spacing.one,
    },
});
