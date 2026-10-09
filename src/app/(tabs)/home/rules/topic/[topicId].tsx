import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { LegalBreadcrumbs } from '@/components/legal/legal-breadcrumbs';
import { LegalDescriptionCard, LegalEmptyState, LegalListCard, LegalListRow, LegalScreen, LegalSearchInput } from '@/components/legal/legal-browser';
import { getLegalRouteHref, parseLegalRouteId } from '@/components/legal/legal-route-utils';
import { matchesLegalSearch } from '@/components/legal/legal-search-utils';
import { fetchLegalBreadcrumbs, fetchLegalTopic, fetchLegalTopicArticles } from '@/database';
import { useLegalQuery } from '@/hooks/use-legal-query';
import { useTheme } from '@/hooks/use-theme';

export default function LegalTopicScreen() {
    const { topicId: rawTopicId } = useLocalSearchParams<{ topicId: string }>();
    const topicId = parseLegalRouteId(rawTopicId);
    const router = useRouter();
    const theme = useTheme();
    const [search, setSearch] = useState('');
    const loadTopic = useCallback(async () => {
        if (topicId === null) throw new Error('شناسهٔ مبحث معتبر نیست.');
        const [topic, articles, breadcrumbs] = await Promise.all([
            fetchLegalTopic(topicId),
            fetchLegalTopicArticles(topicId),
            fetchLegalBreadcrumbs('topic', topicId),
        ]);
        return { topic, articles, breadcrumbs };
    }, [topicId]);
    const { value, loading, error, retry } = useLegalQuery(loadTopic);
    const filteredArticles = useMemo(
        () => value?.articles.filter((article) => matchesLegalSearch(search, article.title)) ?? [],
        [search, value?.articles]
    );

    return (
        <LegalScreen loading={loading} error={error} onRetry={retry}>
            {!value?.topic ? (
                <LegalEmptyState message="این مبحث پیدا نشد." />
            ) : (
                <>
                    <LegalBreadcrumbs items={value.breadcrumbs} />
                    <LegalDescriptionCard>مواد این مبحث</LegalDescriptionCard>
                    <LegalSearchInput
                        value={search}
                        onChangeText={setSearch}
                        placeholder="جست‌وجو در مواد"
                    />
                    {!value.articles.length ? (
                        <LegalEmptyState message="برای این مبحث هنوز ماده‌ای ثبت نشده است." />
                    ) : !filteredArticles.length ? (
                        <LegalEmptyState message="ماده‌ای با این عبارت پیدا نشد." />
                    ) : (
                        <LegalListCard>
                            {filteredArticles.map((article, index) => (
                                <View key={article.id}>
                                    <LegalListRow
                                        title={article.title}
                                        subtitle={article.footnote_count > 0 ? `${article.footnote_count} تبصره` : 'متن ماده'}
                                        icon="file-document-outline"
                                        onPress={() => router.push(getLegalRouteHref('article', article.id, article.title) as never)}
                                    />
                                    {index < filteredArticles.length - 1 ? (
                                        <View style={[styles.separator, { backgroundColor: theme.border }]} />
                                    ) : null}
                                </View>
                            ))}
                        </LegalListCard>
                    )}
                </>
            )}
        </LegalScreen>
    );
}

const styles = StyleSheet.create({
    separator: { height: StyleSheet.hairlineWidth, marginStart: 68 },
});
