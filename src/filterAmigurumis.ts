export type SortOption = 'newest' | 'oldest' | 'popular' | 'favorite' | 'name';

const getTime = (amigurumi: Amigurumi) =>
    amigurumi.createdAt?.toDate ? amigurumi.createdAt.toDate().getTime() : 0;

// Edit distance between two short strings, used to tolerate small typos in search.
const levenshteinDistance = (a: string, b: string): number => {
    const rows = a.length + 1;
    const cols = b.length + 1;
    const dp: number[][] = Array.from({ length: rows }, () => new Array(cols).fill(0));

    for (let i = 0; i < rows; i++) dp[i][0] = i;
    for (let j = 0; j < cols; j++) dp[0][j] = j;

    for (let i = 1; i < rows; i++) {
        for (let j = 1; j < cols; j++) {
            dp[i][j] = a[i - 1] === b[j - 1]
                ? dp[i - 1][j - 1]
                : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
    }

    return dp[rows - 1][cols - 1];
};

const maxAllowedDistance = (termLength: number): number => {
    if (termLength <= 4) return 1;
    if (termLength <= 8) return 2;
    return 3;
};

// Matches on exact substring first (fast path), falls back to a typo-tolerant
// word-by-word comparison so a small spelling mistake still finds results.
const fuzzyMatches = (text: string, term: string): boolean => {
    if (!term) return true;
    const value = text.toLowerCase();
    if (value.includes(term)) return true;

    const maxDistance = maxAllowedDistance(term.length);
    return value.split(/\s+/).some((word) => levenshteinDistance(word, term) <= maxDistance);
};

const matchesSearch = (amigurumi: Amigurumi, term: string): boolean => {
    if (!term) return true;
    if (fuzzyMatches(amigurumi.name ?? '', term)) return true;
    return (amigurumi.tags ?? []).some((tag) => fuzzyMatches(tag, term));
};

export const filterAndSortAmigurumis = (
    amigurumis: Amigurumi[],
    searchTerm: string,
    selectedTags: string[],
    sortBy: SortOption,
    // Persoonlijke favorieten (FavoritesProvider), voor sorteren op 'favorite'.
    favoriteIds: ReadonlySet<string> = new Set()
): Amigurumi[] => {
    const term = searchTerm.trim().toLowerCase();

    const filtered = amigurumis.filter((amigurumi) => {
        const matchesTags = selectedTags.length === 0 || (amigurumi.tags ?? []).some((tag) => selectedTags.includes(tag));
        return matchesSearch(amigurumi, term) && matchesTags;
    });

    return [...filtered].sort((a, b) => {
        switch (sortBy) {
            case 'oldest':
                return getTime(a) - getTime(b);
            case 'popular':
                return (b.favoriteCount ?? 0) - (a.favoriteCount ?? 0) || getTime(b) - getTime(a);
            case 'favorite':
                return Number(favoriteIds.has(b.id)) - Number(favoriteIds.has(a.id)) || getTime(b) - getTime(a);
            case 'name':
                return (a.name ?? '').localeCompare(b.name ?? '');
            case 'newest':
            default:
                return getTime(b) - getTime(a);
        }
    });
};
