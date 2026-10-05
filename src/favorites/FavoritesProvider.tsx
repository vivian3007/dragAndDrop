import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { collection, doc, increment, onSnapshot, serverTimestamp, writeBatch } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { db } from '../../firebase-config.js';
import { useAuth } from '../auth/AuthProvider';
import { useT } from '../i18n/LanguageProvider';

// Favorieten zijn persoonlijk: per gebruiker een subcollectie users/{uid}/favorites, met
// het id van het ontwerp als document-id. Vroeger was `favorite` één gedeeld veld op het
// ontwerp zelf, waardoor jouw hartje voor iedereen gold.
//
// Eén listener voor de hele app; kaarten, detailweergave en de Favorieten-pagina lezen
// hieruit, zodat een hartje overal tegelijk omslaat.
//
// Hoe vaak een ontwerp favoriet is, staat als teller `favoriteCount` op het ontwerp zelf
// (wie het favoriet maakte blijft privé). De teller gaat in dezelfde batch mee als de
// favoriet, en firestore.rules eist dat hij precies met +1/-1 meeloopt.

type FavoritesContextValue = {
    favoriteIds: ReadonlySet<string>;
    // `false` zolang de eerste snapshot nog niet binnen is.
    loaded: boolean;
    // `currentCount`: de teller zoals de aanroeper hem nu ziet. Alleen nodig om niet onder
    // nul te zakken bij een favoriet van vóór de teller bestond.
    toggleFavorite: (amigurumiId: string, currentCount?: number) => Promise<void>;
};

const EMPTY: ReadonlySet<string> = new Set();

const FavoritesContext = createContext<FavoritesContextValue>({
    favoriteIds: EMPTY,
    loaded: false,
    toggleFavorite: async () => {},
});

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
    const uid = useAuth().user?.uid;
    const t = useT();
    const [favoriteIds, setFavoriteIds] = useState<ReadonlySet<string>>(EMPTY);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        setFavoriteIds(EMPTY);
        setLoaded(false);
        if (!uid) return;
        return onSnapshot(
            collection(db, 'users', uid, 'favorites'),
            (snapshot) => {
                setFavoriteIds(new Set(snapshot.docs.map((d) => d.id)));
                setLoaded(true);
            },
            (error) => {
                console.error('Fout bij ophalen van favorieten:', error);
                setLoaded(true);
            }
        );
    }, [uid]);

    const toggleFavorite = useCallback(async (amigurumiId: string, currentCount = 0) => {
        if (!uid) return;
        const favoriteRef = doc(db, 'users', uid, 'favorites', amigurumiId);
        const designRef = doc(db, 'amigurumi', amigurumiId);
        const batch = writeBatch(db);
        if (favoriteIds.has(amigurumiId)) {
            batch.delete(favoriteRef);
            if (currentCount > 0) batch.update(designRef, { favoriteCount: increment(-1) });
        } else {
            batch.set(favoriteRef, { createdAt: serverTimestamp() });
            batch.update(designRef, { favoriteCount: increment(1) });
        }
        try {
            await batch.commit();
        } catch (error) {
            console.error('Fout bij bijwerken van favoriet:', error);
            toast.error(t('favorites.error'));
        }
    }, [uid, favoriteIds, t]);

    const value = useMemo(() => ({ favoriteIds, loaded, toggleFavorite }), [favoriteIds, loaded, toggleFavorite]);

    return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export const useFavorites = () => useContext(FavoritesContext);
