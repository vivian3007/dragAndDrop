import { useMemo } from 'react';
import { collection, query } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { db } from '../firebase-config.js';
import PatternBrowser from './PatternBrowser.tsx';
import { useFavorites } from './favorites/FavoritesProvider';
import { useT } from './i18n/LanguageProvider';

// Jouw persoonlijke favorieten (FavoritesProvider) uit alle ontwerpen. Bewust geen
// `where(documentId(), 'in', ids)`: dat kan maar 30 ids per query aan.
const Favorites = () => {
    const t = useT();
    const { favoriteIds, loaded: favoritesLoaded } = useFavorites();
    const [snapshot, designsLoading, error] = useCollection(query(collection(db, 'amigurumi')));
    const amigurumis = useMemo(
        () => snapshot
            ? (snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Amigurumi[])
                .filter((amigurumi) => favoriteIds.has(amigurumi.id))
            : [],
        [snapshot, favoriteIds]
    );

    return (
        <PatternBrowser
            amigurumis={amigurumis}
            loading={designsLoading || !favoritesLoaded}
            error={error}
            emptyMessage={t('favorites.empty')}
        />
    );
};

export default Favorites;
