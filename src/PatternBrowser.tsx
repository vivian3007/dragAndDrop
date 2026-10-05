import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Typography } from '@mui/material';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase-config.js';
import AmigurumiCard from './AmigurumiCard.tsx';
import MasonryGrid from './MasonryGrid.tsx';
import { CardGridSkeleton } from './Skeletons.tsx';
import PatternDetail from './PatternDetail.tsx';
import PatternFilters from './PatternFilters.tsx';
import PatternPagination, { PAGE_SIZE } from './PatternPagination.tsx';
import { filterAndSortAmigurumis, SortOption } from './filterAmigurumis.ts';
import { useDebouncedValue } from './useDebouncedValue.ts';
import { useStableArray } from './useStableArray.ts';
import { useResponsiveMinColumns } from './useResponsiveMinColumns.ts';
import { useT } from './i18n/LanguageProvider';
import { useFavorites } from './favorites/FavoritesProvider';

const messageSx = { px: { xs: '8px', sm: '24px', md: '40px' } };

// Gedeelde weergave van een lijst ontwerpen: zoeken, tags, sorteren, pagina's, kaarten en de
// detail-popup. Home, Mijn patronen, Favorieten en Volgend verschillen alleen in wélke
// ontwerpen ze tonen (en wat er staat als er geen zijn).
const PatternBrowser = ({
    amigurumis,
    loading,
    error,
    yarnInfo,
    intersections,
    actions,
    emptyMessage,
}: {
    amigurumis: Amigurumi[];
    loading: boolean;
    error?: Error | null;
    yarnInfo: Yarn;
    intersections: Intersection[];
    // Extra knop(pen) in de filterbalk, bv. "Nieuw patroon".
    actions?: React.ReactNode;
    // Getoond als er überhaupt geen ontwerpen zijn (los van zoeken/filteren).
    emptyMessage?: React.ReactNode;
}) => {
    const navigate = useNavigate();
    const minColumns = useResponsiveMinColumns();
    const t = useT();
    const { favoriteIds } = useFavorites();
    const [selectedAmigurumi, setSelectedAmigurumi] = useState<Amigurumi | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState<SortOption>('newest');

    const availableTags = useStableArray(
        Array.from(new Set(amigurumis.flatMap((a) => a.tags ?? []))).sort()
    );

    const debouncedSearchTerm = useDebouncedValue(searchTerm, 250);

    const filteredAmigurumis = useMemo(
        () => filterAndSortAmigurumis(amigurumis, debouncedSearchTerm, selectedTags, sortBy, favoriteIds),
        [amigurumis, debouncedSearchTerm, selectedTags, sortBy, favoriteIds]
    );

    const [page, setPage] = useState(1);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearchTerm, selectedTags, sortBy]);

    const totalPages = Math.max(1, Math.ceil(filteredAmigurumis.length / PAGE_SIZE));

    const pagedAmigurumis = useMemo(
        () => filteredAmigurumis.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
        [filteredAmigurumis, page]
    );

    const handlePatternClick = useCallback(async (amigurumi: Amigurumi) => {
        try {
            const shapesSnapshot = await getDocs(query(collection(db, 'shapes'), where('amigurumi_id', '==', amigurumi.id)));
            const shapes = shapesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Shape[];
            navigate(`/${amigurumi.id}/pattern`, { state: { amigurumi, shapes, yarnInfo, intersections } });
        } catch (error) {
            console.error('Fout bij het ophalen van shapes:', error);
        }
    }, [navigate, yarnInfo, intersections]);

    if (error) {
        return <Typography color="error">{t('patterns.loadError', { message: error.message })}</Typography>;
    }

    return (
        <div className="my-pattern">
            <PatternFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                availableTags={availableTags}
                selectedTags={selectedTags}
                onTagsChange={setSelectedTags}
                sortBy={sortBy}
                onSortChange={setSortBy}
                actions={actions}
            />
            {loading ? (
                <CardGridSkeleton className="my-pattern-container" />
            ) : amigurumis.length === 0 && emptyMessage ? (
                <Typography component="div" sx={messageSx}>{emptyMessage}</Typography>
            ) : filteredAmigurumis.length === 0 ? (
                <Typography sx={messageSx}>{t('patterns.noResults')}</Typography>
            ) : (
                <MasonryGrid
                    className="my-pattern-container"
                    items={pagedAmigurumis}
                    columnWidth={300}
                    minColumns={minColumns}
                    compactGap={10}
                    gap={20}
                    renderItem={(amigurumi) => (
                        <AmigurumiCard
                            key={amigurumi.id}
                            amigurumi={amigurumi}
                            onPatternClick={handlePatternClick}
                            onCardClick={setSelectedAmigurumi}
                        />
                    )}
                />
            )}
            <PatternPagination page={page} totalPages={totalPages} onPageChange={setPage} />
            <PatternDetail
                amigurumi={selectedAmigurumi}
                open={!!selectedAmigurumi}
                onClose={() => setSelectedAmigurumi(null)}
            />
        </div>
    );
};

export default PatternBrowser;
