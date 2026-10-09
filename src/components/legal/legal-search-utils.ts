export function normalizeLegalSearchText(value: string): string {
    return value
        .normalize('NFC')
        .replace(/[يى]/g, 'ی')
        .replace(/ك/g, 'ک')
        .replace(/[\u064B-\u065F\u0670\u0640\u200C\u200D]/g, '')
        .toLocaleLowerCase()
        .trim();
}

export function matchesLegalSearch(query: string, ...values: string[]): boolean {
    const normalizedQuery = normalizeLegalSearchText(query);
    if (!normalizedQuery) return true;

    return values.some((value) => normalizeLegalSearchText(value).includes(normalizedQuery));
}
