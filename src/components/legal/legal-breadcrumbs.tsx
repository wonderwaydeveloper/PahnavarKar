import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { getLegalRouteHref } from '@/components/legal/legal-route-utils';
import type { LegalBreadcrumbItem } from '@/database';
import { useTheme } from '@/hooks/use-theme';

export function LegalBreadcrumbs({ items }: { items: LegalBreadcrumbItem[] }) {
    const router = useRouter();
    const theme = useTheme();

    if (items.length === 0) return null;

    return (
        <View
            accessibilityLabel={`مسیر: ${items.map((item) => item.title).join('، ')}`}
            style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 4, rowGap: 2 }}
        >
            {items.map((item, index) => {
                const isCurrent = index === items.length - 1;
                const itemId = item.id;
                const color = isCurrent ? theme.primary : theme.textSecondary;
                const title = (
                    <ThemedText
                        type={isCurrent ? 'smallBold' : 'small'}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                        style={{ color, maxWidth: 260 }}
                    >
                        {item.title}
                    </ThemedText>
                );

                return (
                    <View
                        key={`${item.type}-${item.id ?? 'current'}`}
                        style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4, maxWidth: '100%' }}
                    >
                        {index > 0 ? (
                            <MaterialCommunityIcons name="chevron-left" size={16} color={theme.textMuted} />
                        ) : null}
                        {isCurrent ? (
                            title
                        ) : (
                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel={`رفتن به ${item.title}`}
                                onPress={() => {
                                    router.push(getLegalRouteHref(item.type, itemId, item.title) as never);
                                }}
                            >
                                {title}
                            </Pressable>
                        )}
                    </View>
                );
            })}
        </View>
    );
}
