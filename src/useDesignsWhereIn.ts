import { useEffect, useMemo, useRef, useState } from 'react';
import { collection, documentId, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase-config.js';

// Firestore staat maximaal 30 waarden toe in een `in`-filter.
const IN_LIMIT = 30;

// Ontwerpen waarvan het id ('id') of de eigenaar ('user_id') in `values` zit — bv. je
// favorieten, of de ontwerpen van wie je volgt. Per groep van 30 waarden één live query; de
// resultaten worden samengevoegd. Zo wordt alleen opgehaald wat nodig is, in plaats van alle
// ontwerpen te laden en daarna te filteren.
//
// Resultaten worden per groep (op inhoud) bewaard: verandert de lijst (een hartje erbij of
// eraf), dan blijven de ongewijzigde groepen gewoon staan en springt de pagina niet terug
// naar "laden".
export function useDesignsWhereIn(field: 'id' | 'user_id', values: Iterable<string>) {
    const key = [...new Set(values)].sort().join(',');
    const chunks = useMemo(() => {
        const ids = key ? key.split(',') : [];
        const result: string[] = [];
        for (let i = 0; i < ids.length; i += IN_LIMIT) result.push(ids.slice(i, i + IN_LIMIT).join(','));
        return result;
    }, [key]);

    const [byChunk, setByChunk] = useState<Record<string, Amigurumi[]>>({});
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        setError(null);
        const unsubscribes = chunks.map((chunk) =>
            onSnapshot(
                query(collection(db, 'amigurumi'), where(field === 'id' ? documentId() : 'user_id', 'in', chunk.split(','))),
                // Meteen ook groepen opruimen die niet meer bestaan.
                (snapshot) => setByChunk((prev) => ({
                    ...Object.fromEntries(Object.entries(prev).filter(([other]) => chunks.includes(other))),
                    [chunk]: snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Amigurumi),
                })),
                (err) => {
                    console.error('Fout bij ophalen van ontwerpen:', err);
                    setError(err);
                },
            ),
        );
        return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
    }, [chunks, field]);

    // Zolang een gewijzigde groep nog niet binnen is, het laatste volledige resultaat laten
    // staan (anders is de lijst heel even leeg).
    const lastComplete = useRef<Amigurumi[]>([]);
    const amigurumis = useMemo(() => {
        if (chunks.some((chunk) => !(chunk in byChunk))) return lastComplete.current;
        lastComplete.current = chunks.flatMap((chunk) => byChunk[chunk]);
        return lastComplete.current;
    }, [chunks, byChunk]);
    // Alleen de eerste keer "laden"; daarna blijven de kaarten staan terwijl een gewijzigde
    // groep (vrijwel meteen, uit de lokale cache) binnenkomt.
    const loading = !error && chunks.length > 0 && Object.keys(byChunk).length === 0;
    return { amigurumis, loading, error };
}
