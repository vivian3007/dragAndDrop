import PatternBrowser from './PatternBrowser.tsx';
import { useDesignsWhereIn } from './useDesignsWhereIn.ts';
import { useFavorites } from './favorites/FavoritesProvider';
import { useT } from './i18n/LanguageProvider';

// Jouw persoonlijke favorieten (FavoritesProvider): alleen díe ontwerpen worden opgehaald.
const Favorites = () => {
    const t = useT();
    const { favoriteIds, loaded: favoritesLoaded } = useFavorites();
    const { amigurumis, loading, error } = useDesignsWhereIn('id', favoriteIds);

    return (
        <PatternBrowser
            amigurumis={amigurumis}
            loading={loading || !favoritesLoaded}
            error={error}
            emptyMessage={t('favorites.empty')}
        />
    );
};

export default Favorites;
