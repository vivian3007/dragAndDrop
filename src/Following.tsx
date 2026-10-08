import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { db } from '../firebase-config.js';
import PatternBrowser from './PatternBrowser.tsx';
import { useFollowing } from './follows/FollowingProvider';
import { useT } from './i18n/LanguageProvider';

// Firestore staat maximaal 30 waarden toe in een `in`-filter.
const IN_LIMIT = 30;

// Ontwerpen van iedereen die je volgt. Per groep van 30 gebruikers één live query; de
// resultaten worden samengevoegd. Zolang niet elke groep antwoord heeft, telt het als laden.
function useDesignsByUsers(uids: string[]): { amigurumis: Amigurumi[]; loading: boolean; error: Error | null } {
    const key = [...uids].sort().join(',');
    const [byChunk, setByChunk] = useState<Record<number, Amigurumi[]>>({});
    const [error, setError] = useState<Error | null>(null);

    const chunks = useMemo(() => {
        const ids = key ? key.split(',') : [];
        const result: string[][] = [];
        for (let i = 0; i < ids.length; i += IN_LIMIT) result.push(ids.slice(i, i + IN_LIMIT));
        return result;
    }, [key]);

    useEffect(() => {
        setByChunk({});
        setError(null);
        const unsubscribes = chunks.map((chunk, index) =>
            onSnapshot(
                query(collection(db, 'amigurumi'), where('user_id', 'in', chunk)),
                (snapshot) => setByChunk((prev) => ({
                    ...prev,
                    [index]: snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Amigurumi),
                })),
                (err) => {
                    console.error('Fout bij ophalen van ontwerpen van wie je volgt:', err);
                    setError(err);
                }
            )
        );
        return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
    }, [chunks]);

    const amigurumis = useMemo(() => Object.values(byChunk).flat(), [byChunk]);
    const loading = !error && Object.keys(byChunk).length < chunks.length;
    return { amigurumis, loading, error };
}

const Following = () => {
    const t = useT();
    const { followingIds, loaded } = useFollowing();
    const uids = useMemo(() => Array.from(followingIds), [followingIds]);
    const { amigurumis, loading, error } = useDesignsByUsers(uids);

    return (
        <PatternBrowser
            amigurumis={amigurumis}
            loading={!loaded || loading}
            error={error}
            emptyMessage={
                uids.length === 0 ? (
                    <>
                        {t('following.emptyNoOne')}{' '}
                        <Link to="/home" className="inline-link">{t('following.discover')}</Link>
                    </>
                ) : t('following.emptyNoDesigns')
            }
        />
    );
};

export default Following;
