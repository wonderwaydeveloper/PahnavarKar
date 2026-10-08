import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, SectionList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { AppTextInput } from '@/components/app-text';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ToolListItem } from '@/components/tool-list-item';
import { Spacing } from '@/constants/theme';
import { TOOL_DEFINITIONS, type ToolDefinition } from '@/constants/tool-definitions';
import { getToolRoute } from '@/constants/tool-routes';
import { useTheme } from '@/hooks/use-theme';

type SearchAction = ToolDefinition & {
    searchText: string;
    titleSearchText: string;
    detailSearchText: string;
};

const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
const latinDigits = '0123456789';
const SEARCH_DEBOUNCE_MS = 300;
const ARABIC_DIACRITICS_PATTERN = /[\u064B-\u065F\u0670\u06D6-\u06ED]/g;
const SEARCH_WHITESPACE_PATTERN = /[\u200C\s]+/g;

function normalizeSearchText(value: string) {
    return value
        .normalize('NFKC')
        .toLocaleLowerCase('fa-IR')
        .replace(/[يى]/g, 'ی')
        .replace(/ك/g, 'ک')
        .replace(ARABIC_DIACRITICS_PATTERN, '')
        .replace(/[۰-۹]/g, (digit) => latinDigits[persianDigits.indexOf(digit)])
        .replace(SEARCH_WHITESPACE_PATTERN, ' ')
        .trim();
}

const ACTION_DEFINITIONS: SearchAction[] = TOOL_DEFINITIONS.map((tool) => ({
    ...tool,
    searchText: normalizeSearchText(`${tool.title} ${tool.detail}`),
    titleSearchText: normalizeSearchText(tool.title),
    detailSearchText: normalizeSearchText(tool.detail),
}));

export default function SearchTabScreen() {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setDebouncedQuery(query);
        }, SEARCH_DEBOUNCE_MS);

        return () => clearTimeout(timeoutId);
    }, [query]);

    const normalizedQuery = normalizeSearchText(debouncedQuery);

    const sections = useMemo(() => {
        const matchingActions = ACTION_DEFINITIONS
            .map((action, originalIndex) => {
                if (!normalizedQuery) {
                    return { action, originalIndex, relevance: 0 };
                }

                const titleMatch = action.titleSearchText.indexOf(normalizedQuery);
                const detailMatch = action.detailSearchText.indexOf(normalizedQuery);

                if (titleMatch === -1 && detailMatch === -1) {
                    return null;
                }

                const relevance = titleMatch === 0
                    ? 0
                    : titleMatch > 0
                        ? 1
                        : detailMatch === 0
                            ? 2
                            : 3;

                return { action, originalIndex, relevance };
            })
            .filter((entry): entry is { action: SearchAction; originalIndex: number; relevance: number } => entry !== null)
            .sort((left, right) => left.relevance - right.relevance || left.originalIndex - right.originalIndex)
            .map((entry) => entry.action);

        return [{ title: '', data: matchingActions }];
    }, [normalizedQuery]);

    const handleClearQuery = useCallback(() => {
        setQuery('');
        setDebouncedQuery('');
    }, []);

    const renderSearchBox = useCallback(() => (
        <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <MaterialCommunityIcons name="magnify" size={21} color={theme.textSecondary} />
            <AppTextInput
                autoFocus
                value={query}
                onChangeText={setQuery}
                placeholder="جستجو"
                placeholderTextColor={theme.textMuted}
                style={[styles.searchInput, { color: theme.text }]}
                returnKeyType="search"
                accessibilityLabel="جست‌وجوی ابزارها"
            />
            {query.length > 0 ? (
                <Pressable onPress={handleClearQuery} accessibilityRole="button" accessibilityLabel="پاک‌کردن جست‌وجو" hitSlop={8}>
                    <MaterialCommunityIcons name="close-circle" size={19} color={theme.textSecondary} />
                </Pressable>
            ) : null}
        </View>
    ), [handleClearQuery, query, theme.border, theme.surface, theme.text, theme.textMuted, theme.textSecondary]);

    const renderHighlightedText = useCallback((value: string, style: object) => {
        const matchQuery = normalizeSearchText(debouncedQuery);
        const matchIndex = value.toLocaleLowerCase('fa-IR').indexOf(matchQuery);

        if (!matchQuery || matchIndex < 0) {
            return <ThemedText style={style}>{value}</ThemedText>;
        }

        return (
            <ThemedText style={style}>
                {value.slice(0, matchIndex)}
                <ThemedText style={{ color: theme.primary, fontFamily: 'AppFont-Bold' }}>
                    {value.slice(matchIndex, matchIndex + matchQuery.length)}
                </ThemedText>
                {value.slice(matchIndex + matchQuery.length)}
            </ThemedText>
        );
    }, [debouncedQuery, theme.primary]);

    const renderItem = useCallback(({ item, index, section }: { item: SearchAction; index: number; section: { data: SearchAction[] } }) => (
        <ToolListItem
            tool={item}
            onPress={() => router.push(getToolRoute(item.route) as never)}
            showBottomBorder={index < section.data.length - 1}
            titleContent={renderHighlightedText(item.title, { color: theme.text, fontSize: 14, lineHeight: 20, fontFamily: 'AppFont-Bold' })}
            detailContent={renderHighlightedText(item.detail, { color: theme.textSecondary, fontSize: 13, lineHeight: 19, fontFamily: 'AppFont-Regular' })}
        />
    ), [renderHighlightedText, router, theme.text, theme.textSecondary]);

    const emptyState = useMemo(() => (
        <View style={[styles.emptyState, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <MaterialCommunityIcons name="text-search" size={28} color={theme.textMuted} />
            <ThemedText type="smallBold">ابزاری پیدا نشد</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">عبارت دیگری را جست‌وجو کنید.</ThemedText>
        </View>
    ), [theme.border, theme.surface, theme.textMuted]);

    return (
        <ThemedView style={styles.container}>
            <AppHeader centerContent={renderSearchBox()} />
            <SectionList
                style={styles.resultsList}
                sections={sections}
                keyExtractor={(item) => item.key}
                renderItem={renderItem}
                ListEmptyComponent={emptyState}
                contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.four }]}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                showsVerticalScrollIndicator={false}
                stickySectionHeadersEnabled={false}
                initialNumToRender={12}
                maxToRenderPerBatch={12}
                windowSize={5}
            />
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    resultsList: { flex: 1 },
    content: { flexGrow: 1 },
    searchBox: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingHorizontal: Spacing.two, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth },
    searchInput: { flex: 1, minHeight: 42, paddingVertical: 0, fontFamily: 'AppFont-Regular', fontSize: 15, textAlign: 'right' },
    emptyState: { flex: 1, minHeight: 180, alignItems: 'center', justifyContent: 'center', gap: Spacing.one, padding: Spacing.four, borderRadius: 16, borderWidth: 1 },
});
