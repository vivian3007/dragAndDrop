import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
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

type FavoritesContextValue = {
    favoriteIds: ReadonlySet<string>;
    // `false` zolang de eerste snapshot nog niet binnen is.
    loaded: boolean;
    toggleFavorite: (amigurumiId: string) => Promise<void>;
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

    const toggleFavorite = useCallback(async (amigurumiId: string) => {
        if (!uid) return;
        const ref = doc(db, 'users', uid, 'favorites', amigurumiId);
        try {
            if (favoriteIds.has(amigurumiId)) {
                await deleteDoc(ref);
            } else {
                await setDoc(ref, { createdAt: serverTimestamp() });
            }
        } catch (error) {
            console.error('Fout bij bijwerken van favoriet:', error);
            toast.error(t('favorites.error'));
        }
    }, [uid, favoriteIds, t]);

    const value = useMemo(() => ({ favoriteIds, loaded, toggleFavorite }), [favoriteIds, loaded, toggleFavorite]);

    return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export const useFavorites = () => useContext(FavoritesContext);
