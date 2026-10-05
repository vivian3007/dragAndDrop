import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { collection, doc, getCountFromServer, onSnapshot, serverTimestamp, writeBatch } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { db } from '../../firebase-config.js';
import { useAuth } from '../auth/AuthProvider';
import { useT } from '../i18n/LanguageProvider';

// Andere gebruikers volgen. Elke volg-relatie staat twee keer in de database, in één batch
// geschreven: users/{ik}/following/{ander} (wie volg ik — voor de Volgend-pagina) en
// users/{ander}/followers/{ik} (wie volgt mij — om volgers te kunnen tellen). De
// Firestore-regels eisen dat die twee altijd samen bestaan.

type FollowingContextValue = {
    followingIds: ReadonlySet<string>;
    // `false` zolang de eerste snapshot nog niet binnen is.
    loaded: boolean;
    toggleFollow: (targetUid: string) => Promise<void>;
};

const EMPTY: ReadonlySet<string> = new Set();

const FollowingContext = createContext<FollowingContextValue>({
    followingIds: EMPTY,
    loaded: false,
    toggleFollow: async () => {},
});

export function FollowingProvider({ children }: { children: React.ReactNode }) {
    const uid = useAuth().user?.uid;
    const t = useT();
    const [followingIds, setFollowingIds] = useState<ReadonlySet<string>>(EMPTY);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        setFollowingIds(EMPTY);
        setLoaded(false);
        if (!uid) return;
        return onSnapshot(
            collection(db, 'users', uid, 'following'),
            (snapshot) => {
                setFollowingIds(new Set(snapshot.docs.map((d) => d.id)));
                setLoaded(true);
            },
            (error) => {
                console.error('Fout bij ophalen van wie je volgt:', error);
                setLoaded(true);
            }
        );
    }, [uid]);

    const toggleFollow = useCallback(async (targetUid: string) => {
        if (!uid || targetUid === uid) return;
        const followingRef = doc(db, 'users', uid, 'following', targetUid);
        const followerRef = doc(db, 'users', targetUid, 'followers', uid);
        const batch = writeBatch(db);
        if (followingIds.has(targetUid)) {
            batch.delete(followingRef);
            batch.delete(followerRef);
        } else {
            batch.set(followingRef, { createdAt: serverTimestamp() });
            batch.set(followerRef, { createdAt: serverTimestamp() });
        }
        try {
            await batch.commit();
        } catch (error) {
            console.error('Fout bij volgen:', error);
            toast.error(t('follow.error'));
        }
    }, [uid, followingIds, t]);

    const value = useMemo(() => ({ followingIds, loaded, toggleFollow }), [followingIds, loaded, toggleFollow]);

    return <FollowingContext.Provider value={value}>{children}</FollowingContext.Provider>;
}

export const useFollowing = () => useContext(FollowingContext);

// Aantal volgers en gevolgden van een profiel. Geteld op de server (zonder alle documenten op
// te halen); opnieuw geteld als jij die persoon net (ont)volgd hebt. `undefined` zolang het
// telt, `null` als tellen mislukte (dan laat het profiel de aantallen gewoon weg).
export function useFollowCounts(uid: string): { followers: number; following: number } | null | undefined {
    const { followingIds } = useFollowing();
    const iFollow = followingIds.has(uid);
    const [counts, setCounts] = useState<{ followers: number; following: number } | null | undefined>(undefined);

    useEffect(() => {
        let cancelled = false;
        Promise.all([
            getCountFromServer(collection(db, 'users', uid, 'followers')),
            getCountFromServer(collection(db, 'users', uid, 'following')),
        ])
            .then(([followers, following]) => {
                if (!cancelled) setCounts({ followers: followers.data().count, following: following.data().count });
            })
            .catch((error) => {
                console.error('Fout bij tellen van volgers:', error);
                if (!cancelled) setCounts(null);
            });
        return () => {
            cancelled = true;
        };
    }, [uid, iFollow]);

    return counts;
}
