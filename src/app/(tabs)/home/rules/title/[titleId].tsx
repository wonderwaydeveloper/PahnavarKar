import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { LegalBreadcrumbs } from '@/components/legal/legal-breadcrumbs';
import { LegalDescriptionCard, LegalEmptyState, LegalListCard, LegalListRow, LegalScreen, LegalSearchInput } from '@/components/legal/legal-browser';
import { getLegalRouteHref, parseLegalRouteId } from '@/components/legal/legal-route-utils';
import { matchesLegalSearch } from '@/components/legal/legal-search-utils';
import { fetchLegalBreadcrumbs, fetchLegalTitleContents } from '@/database';
import { useLegalQuery } from '@/hooks/use-legal-query';
import { useTheme } from '@/hooks/use-theme';

export default function LegalTitleScreen() {
    const { titleId: rawTitleId } = useLocalSearchParams<{ titleId: string }>();
    const titleId = parseLegalRouteId(rawTitleId);
    const router = useRouter();
    const theme = useTheme();
    const [search, setSearch] = useState('');
    const loadTitle = useCallback(async () => {
        if (titleId === null) return Promise.reject(new Error('شناسهٔ عنوان قانونی معتبر نیست.'));
        const [contents, breadcrumbs] = await Promise.all([
            fetchLegalTitleContents(titleId),
            fetchLegalBreadcrumbs('title', titleId),
        ]);
        return { ...contents, breadcrumbs };
    }, [titleId]);
    const { value, loading, error, retry } = useLegalQuery(loadTitle);
    const filteredChapters = useMemo(
        () => value?.chapters.filter((chapter) => matchesLegalSearch(search, chapter.title)) ?? [],
        [search, value?.chapters]
    );
    const filteredDirectArticles = useMemo(
        () => value?.directArticles.filter((article) => matchesLegalSearch(search, article.title)) ?? [],
        [search, value?.directArticles]
    );

    return (
        <LegalScreen loading={loading} error={error} onRetry={retry}>
            {!value?.title ? (
                <LegalEmptyState message="این عنوان قانونی پیدا نشد." />
            ) : (
                <>
                    <LegalBreadcrumbs items={value.breadcrumbs} />
                    <LegalDescriptionCard>
                        {value.chapters.length > 0
                            ? 'برای دیدن محتوا، فصل موردنظر را انتخاب کنید.'
                            : 'مواد این قانون مستقیماً در این صفحه نمایش داده می‌شوند.'}
                    </LegalDescriptionCard>
                    <LegalSearchInput
                        value={search}
                        onChangeText={setSearch}
                        placeholder={value.chapters.length > 0 ? 'جست‌وجو در فصل‌ها' : 'جست‌وجو در مواد'}
                    />

                    {value.chapters.length > 0 ? (
                        filteredChapters.length === 0 ? (
                            <LegalEmptyState message="فصلی با این عبارت پیدا نشد." />
                        ) : <LegalListCard>
                            {filteredChapters.map((chapter, index) => (
                                <View key={chapter.id}>
                                    <LegalListRow
                                        title={chapter.title}
                                        subtitle={chapter.topic_count > 0
                                            ? `${chapter.topic_count} مبحث`
                                            : `${chapter.article_count} ماده`}
                                        icon="bookmark-multiple-outline"
                                        onPress={() => router.push(getLegalRouteHref('chapter', chapter.id, chapter.title) as never)}
                                    />
                                    {index < filteredChapters.length - 1 ? (
                                        <View style={{ height: StyleSheet.hairlineWidth, marginStart: 68, backgroundColor: theme.border }} />
                                    ) : null}
                                </View>
                            ))}
                        </LegalListCard>
                    ) : filteredDirectArticles.length > 0 ? (
                        <LegalListCard>
                            {filteredDirectArticles.map((article, index) => (
                                <View key={article.id}>
                                    <LegalListRow
                                        title={article.title}
                                        subtitle={article.footnote_count > 0 ? `${article.footnote_count} تبصره` : 'متن ماده'}
                                        icon="file-document-outline"
                                        onPress={() => router.push(getLegalRouteHref('article', article.id, article.title) as never)}
                                    />
                                    {index < filteredDirectArticles.length - 1 ? (
                                        <View style={{ height: StyleSheet.hairlineWidth, marginStart: 68, backgroundColor: theme.border }} />
                                    ) : null}
                                </View>
                            ))}
                        </LegalListCard>
                    ) : (
                        <LegalEmptyState message={value.directArticles.length > 0
                            ? 'ماده‌ای با این عبارت پیدا نشد.'
                            : 'برای این عنوان هنوز ماده‌ای ثبت نشده است.'} />
                    )}
                </>
            )}
        </LegalScreen>
    );
}
