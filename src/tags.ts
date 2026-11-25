import { normalizeTag } from './searchTerms.js';

// Tags netjes en eenduidig: "dier", " Dier " en "#dier" zijn dezelfde tag en worden als "Dier"
// getoond en opgeslagen. Vergelijken gaat via normalizeTag (hoofdletter- en accentongevoelig,
// net als het filteren op de server via `tagsLower`).

// Zoals een tag getoond en opgeslagen wordt: zonder # of dubbele spaties, met een hoofdletter.
export function formatTag(tag: string): string {
    const clean = tag.trim().replace(/^#+/, '').replace(/\s+/g, ' ');
    return clean.charAt(0).toLocaleUpperCase('nl') + clean.slice(1);
}

// Dezelfde tags op één na (hoofdletterongevoelig), in de nette vorm, in de oorspronkelijke volgorde.
export function uniqueTags(tags: readonly string[]): string[] {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const tag of tags) {
        const key = normalizeTag(tag);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        result.push(formatTag(tag));
    }
    return result;
}

// Is dit dezelfde tag (hoofdletterongevoelig)?
export function sameTag(a: string, b: string): boolean {
    return normalizeTag(a) === normalizeTag(b);
}
