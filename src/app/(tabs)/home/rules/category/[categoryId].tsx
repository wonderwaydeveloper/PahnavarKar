import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { LegalBreadcrumbs } from '@/components/legal/legal-breadcrumbs';
import { LegalDescriptionCard, LegalEmptyState, LegalListCard, LegalListRow, LegalScreen, LegalSearchInput } from '@/components/legal/legal-browser';
import { getLegalRouteHref, parseLegalRouteId } from '@/components/legal/legal-route-utils';
import { matchesLegalSearch } from '@/components/legal/legal-search-utils';
import { fetchLegalBreadcrumbs, fetchLegalCategory, fetchLegalTitles } from '@/database';
import { useLegalQuery } from '@/hooks/use-legal-query';
import { useTheme } from '@/hooks/use-theme';

export default function LegalCategoryScreen() {
    const { categoryId: rawCategoryId } = useLocalSearchParams<{ categoryId: string }>();
    const categoryId = parseLegalRouteId(rawCategoryId);
    const router = useRouter();
    const theme = useTheme();
    const [search, setSearch] = useState('');
    const loadCategory = useCallback(async () => {
        if (categoryId === null) throw new Error('شناسهٔ دسته معتبر نیست.');
        const [category, titles, breadcrumbs] = await Promise.all([
            fetchLegalCategory(categoryId),
            fetchLegalTitles(categoryId),
            fetchLegalBreadcrumbs('category', categoryId),
        ]);
        return { category, titles, breadcrumbs };
    }, [categoryId]);
    const { value, loading, error, retry } = useLegalQuery(loadCategory);
    const filteredTitles = useMemo(
        () => value?.titles.filter((item) => matchesLegalSearch(search, item.title)) ?? [],
        [search, value?.titles]
    );

    return (
        <LegalScreen loading={loading} error={error} onRetry={retry}>
            {!value?.category ? (
                <LegalEmptyState message="این دستهٔ قوانین و مقررات پیدا نشد." />
            ) : (
                <>
                    <LegalBreadcrumbs items={value.breadcrumbs} />
                    <LegalDescriptionCard>
                        عنوان قانونی موردنظر را برای مشاهدهٔ فصل‌ها و مواد انتخاب کنید.
                    </LegalDescriptionCard>
                    <LegalSearchInput
                        value={search}
                        onChangeText={setSearch}
                        placeholder="جست‌وجو در عنوان‌های قانونی"
                    />
                    {!value.titles.length ? (
                        <LegalEmptyState message="برای این دسته هنوز عنوان قانونی ثبت نشده است." />
                    ) : filteredTitles.length === 0 ? (
                        <LegalEmptyState message="عنوان قانونی با این عبارت پیدا نشد." />
                    ) : (
                        <LegalListCard>
                            {filteredTitles.map((title, index) => (
                                <View key={title.id}>
                                    <LegalListRow
                                        title={title.title}
                                        subtitle={title.chapter_count > 0
                                            ? `${title.chapter_count} فصل · ${title.article_count} ماده`
                                            : `${title.article_count} ماده`}
                                        icon="file-document-outline"
                                        onPress={() => router.push(getLegalRouteHref('title', title.id, title.title) as never)}
                                    />
                                    {index < filteredTitles.length - 1 ? (
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
