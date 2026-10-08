// Zoeken op de server: Firestore kan niet "bevat"- of fuzzy-zoeken, alleen "deze waarde zit
// in die lijst" (array-contains). Daarom krijgt elk ontwerp bij het opslaan een lijst
// `searchTerms`: elk begin van elk woord uit de naam en de tags ("s", "sn", "sna", …,
// "snake"). Zoeken op "sna" vindt dan "Snake". Typfouten worden zo niet opgevangen.
//
// Gewoon JavaScript (met searchTerms.d.ts ernaast), zodat het migratiescript in scripts/
// precies dezelfde termen maakt als de app.

// Langere woorden worden op deze lengte afgekapt; verder typen zoekt dan op dit begin.
export const MAX_TERM_LENGTH = 20;

// Kleine letters, zonder accenten ("Café" → "cafe"), opgeknipt in woorden.
export function searchWords(text) {
    return String(text ?? '')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter(Boolean);
}

// Alle zoektermen voor een ontwerp met deze naam en tags.
export function buildSearchTerms(name, tags = []) {
    const terms = new Set();
    for (const word of [...searchWords(name), ...tags.flatMap(searchWords)]) {
        const capped = word.slice(0, MAX_TERM_LENGTH);
        for (let length = 1; length <= capped.length; length++) {
            terms.add(capped.slice(0, length));
        }
    }
    return [...terms];
}

// Naam zoals die gesorteerd wordt: hoofdletter-, accent- en spatie-ongevoelig.
export function sortableName(name) {
    return searchWords(name).join(' ');
}

// Tag zoals erop gefilterd wordt: "Animal", "animal" en "#animal" zijn dezelfde tag.
export function normalizeTag(tag) {
    return searchWords(tag).join(' ');
}

// Velden die bij elke wijziging van naam of tags mee moeten in het ontwerp-document.
export function searchFields(name, tags = []) {
    return {
        searchTerms: buildSearchTerms(name, tags),
        nameLower: sortableName(name),
        tagsLower: [...new Set(tags.map(normalizeTag).filter(Boolean))],
    };
}

// Het woord waarop de server zoekt (Firestore kan op maar één term tegelijk filteren): het
// langste woord uit de zoekopdracht, want dat sluit het meeste uit. De rest van de woorden
// controleert de app daarna zelf op de gevonden ontwerpen.
export function serverSearchTerm(query) {
    const words = searchWords(query);
    if (words.length === 0) return null;
    return words.reduce((longest, word) => (word.length > longest.length ? word : longest)).slice(0, MAX_TERM_LENGTH);
}

// Past elk woord uit de zoekopdracht als begin van een woord uit naam of tags?
export function matchesSearch(name, tags, query) {
    const terms = new Set(buildSearchTerms(name, tags));
    return searchWords(query).every((word) => terms.has(word.slice(0, MAX_TERM_LENGTH)));
}
