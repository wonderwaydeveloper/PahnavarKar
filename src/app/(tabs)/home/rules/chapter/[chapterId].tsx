import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { LegalBreadcrumbs } from '@/components/legal/legal-breadcrumbs';
import { LegalDescriptionCard, LegalEmptyState, LegalListCard, LegalListRow, LegalScreen, LegalSearchInput } from '@/components/legal/legal-browser';
import { getLegalRouteHref, parseLegalRouteId } from '@/components/legal/legal-route-utils';
import { matchesLegalSearch } from '@/components/legal/legal-search-utils';
import { fetchLegalBreadcrumbs, fetchLegalChapterContents } from '@/database';
import { useLegalQuery } from '@/hooks/use-legal-query';
import { useTheme } from '@/hooks/use-theme';

export default function LegalChapterScreen() {
    const { chapterId: rawChapterId } = useLocalSearchParams<{ chapterId: string }>();
    const chapterId = parseLegalRouteId(rawChapterId);
    const router = useRouter();
    const theme = useTheme();
    const [search, setSearch] = useState('');
    const loadChapter = useCallback(async () => {
        if (chapterId === null) return Promise.reject(new Error('شناسهٔ فصل معتبر نیست.'));
        const [contents, breadcrumbs] = await Promise.all([
            fetchLegalChapterContents(chapterId),
            fetchLegalBreadcrumbs('chapter', chapterId),
        ]);
        return { ...contents, breadcrumbs };
    }, [chapterId]);
    const { value, loading, error, retry } = useLegalQuery(loadChapter);
    const filteredTopics = useMemo(
        () => value?.topics.filter((topic) => matchesLegalSearch(search, topic.title)) ?? [],
        [search, value?.topics]
    );
    const filteredArticles = useMemo(
        () => value?.articles.filter((article) => matchesLegalSearch(search, article.title)) ?? [],
        [search, value?.articles]
    );

    return (
        <LegalScreen loading={loading} error={error} onRetry={retry}>
            {!value?.chapter ? (
                <LegalEmptyState message="این فصل پیدا نشد." />
            ) : (
                <>
                    <LegalBreadcrumbs items={value.breadcrumbs} />
                    <LegalDescriptionCard>
                        {value.topics.length > 0
                            ? 'برای مشاهدهٔ مواد، مبحث موردنظر را انتخاب کنید.'
                            : 'مواد این فصل در ادامه آمده است.'}
                    </LegalDescriptionCard>
                    <LegalSearchInput
                        value={search}
                        onChangeText={setSearch}
                        placeholder={value.topics.length > 0 ? 'جست‌وجو در مباحث' : 'جست‌وجو در مواد'}
                    />
                    {value.topics.length > 0 ? (
                        filteredTopics.length === 0 ? (
                            <LegalEmptyState message="مبحثی با این عبارت پیدا نشد." />
                        ) : <LegalListCard>
                            {filteredTopics.map((topic, index) => (
                                <View key={topic.id}>
                                    <LegalListRow
                                        title={topic.title}
                                        subtitle={`${topic.article_count} ماده`}
                                        icon="format-list-bulleted"
                                        onPress={() => router.push(getLegalRouteHref('topic', topic.id, topic.title) as never)}
                                    />
                                    {index < filteredTopics.length - 1 ? (
                                        <View style={[styles.separator, { backgroundColor: theme.border }]} />
                                    ) : null}
                                </View>
                            ))}
                        </LegalListCard>
                    ) : filteredArticles.length > 0 ? (
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
                    ) : (
                        <LegalEmptyState message={value.articles.length > 0
                            ? 'ماده‌ای با این عبارت پیدا نشد.'
                            : 'برای این فصل هنوز ماده‌ای ثبت نشده است.'} />
                    )}
                </>
            )}
        </LegalScreen>
    );
}

const styles = StyleSheet.create({
    separator: { height: StyleSheet.hairlineWidth, marginStart: 68 },
});
