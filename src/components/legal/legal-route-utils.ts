export function parseLegalRouteId(value: string | string[] | undefined): number | null {
    if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) return null;
    const id = Number(value);
    return Number.isSafeInteger(id) ? id : null;
}

export function getLegalRouteHref(
    type: 'category' | 'title' | 'chapter' | 'topic' | 'article',
    id: number,
    title: string,
    footnoteId?: number
): string {
    const footnoteParam = footnoteId === undefined ? '' : `&footnoteId=${footnoteId}`;
    return `/home/rules/${type}/${id}?headerTitle=${encodeURIComponent(title)}${footnoteParam}`;
}
