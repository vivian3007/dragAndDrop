import { useCallback, useEffect, useMemo, useState } from 'react';
import { collection, limit, onSnapshot, orderBy, query, QueryConstraint, where } from 'firebase/firestore';
import { db } from '../firebase-config.js';
import { SortOption } from './filterAmigurumis.ts';
import { matchesSearch, normalizeTag, serverSearchTerm } from './searchTerms.js';

// Aantal ontwerpen per keer "meer laden".
export const SERVER_PAGE_SIZE = 24;

// Firestore staat maximaal 30 waarden toe in een `array-contains-any`-filter.
const MAX_TAG_FILTER = 30;

export type DesignFilters = { search: string; tags: string[]; sort: SortOption };

// Sortering op de server. "Favorieten eerst" verschilt per persoon en kan de server niet;
// die valt hier terug op nieuwste eerst (de optie wordt op Home ook niet aangeboden).
function sortConstraint(sort: SortOption): QueryConstraint {
    switch (sort) {
        case 'oldest':
            return orderBy('createdAt', 'asc');
        case 'popular':
            return orderBy('favoriteCount', 'desc');
        case 'name':
            return orderBy('nameLower', 'asc');
        default:
            return orderBy('createdAt', 'desc');
    }
}

// Ontwerpen van iedereen, gezocht, gefilterd, gesorteerd en per pagina geladen door
// Firestore — in plaats van alles op te halen en in de browser te filteren.
//
// Firestore kan maar op één "zit in lijst"-voorwaarde tegelijk filteren. Met een zoekterm
// filtert de server daarop (zie searchTerms.js) en controleert de app de tags en de overige
// zoekwoorden zelf op wat binnenkomt; zonder zoekterm filtert de server op de tags.
//
// "Meer laden" vergroot de limiet van één live query. Zo blijven alle geladen kaarten live
// (bv. het aantal favorieten), en met de lokale cache komen eerder geladen ontwerpen niet
// opnieuw van de server.
export function useDesignSearch(filters: DesignFilters, enabled: boolean) {
    const [paging, setPaging] = useState<{ key: string; pages: number }>({ key: '', pages: 1 });
    const [result, setResult] = useState<{ key: string; docs: Amigurumi[] } | null>(null);
    const [error, setError] = useState<Error | null>(null);

    const term = serverSearchTerm(filters.search);
    const tagKeys = useMemo(
        () => [...new Set(filters.tags.map(normalizeTag).filter(Boolean))].slice(0, MAX_TAG_FILTER),
        [filters.tags],
    );
    const filterKey = JSON.stringify([term, tagKeys, filters.sort]);

    // Andere zoekopdracht: weer bij de eerste pagina beginnen.
    const pages = paging.key === filterKey ? paging.pages : 1;
    const pageLimit = pages * SERVER_PAGE_SIZE;
    const queryKey = `${filterKey}|${pageLimit}`;

    useEffect(() => {
        if (!enabled) return;
        const constraints: QueryConstraint[] = [];
        if (term) constraints.push(where('searchTerms', 'array-contains', term));
        else if (tagKeys.length > 0) constraints.push(where('tagsLower', 'array-contains-any', tagKeys));
        constraints.push(sortConstraint(filters.sort));
        // Eén extra ophalen om te weten of er nog meer is.
        constraints.push(limit(pageLimit + 1));

        setError(null);
        return onSnapshot(
            query(collection(db, 'amigurumi'), ...constraints),
            (snapshot) => setResult({
                key: queryKey,
                docs: snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Amigurumi),
            }),
            (err) => {
                console.error('Fout bij zoeken naar ontwerpen:', err);
                setError(err);
            },
        );
    // `queryKey` bevat alles waar de query van afhangt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, queryKey]);

    const hasMore = (result?.docs.length ?? 0) > pageLimit;

    const amigurumis = useMemo(() => {
        const docs = (result?.docs ?? []).slice(0, pageLimit);
        if (!term) return docs;
        // De server zocht op één woord; de overige woorden en de tags hier.
        return docs.filter((amigurumi) =>
            matchesSearch(amigurumi.name ?? '', amigurumi.tags ?? [], filters.search)
            && (tagKeys.length === 0 || (amigurumi.tags ?? []).some((tag) => tagKeys.includes(normalizeTag(tag)))));
    }, [result, pageLimit, term, filters.search, tagKeys]);

    const loadMore = useCallback(() => setPaging({ key: filterKey, pages: pages + 1 }), [filterKey, pages]);

    return {
        amigurumis,
        // Nog niets binnen voor deze zoekopdracht (de vorige resultaten blijven zolang staan).
        loading: enabled && !error && result === null,
        // Wacht op een nieuwe zoekopdracht of op een volgende pagina.
        updating: enabled && !error && result !== null && result.key !== queryKey,
        hasMore,
        loadMore,
        error,
    };
}
