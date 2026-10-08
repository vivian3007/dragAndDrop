import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Typography } from '@mui/material';
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
import { useDesignSearch } from './useDesignSearch.ts';
import { useStableArray } from './useStableArray.ts';
import { useResponsiveMinColumns } from './useResponsiveMinColumns.ts';
import { useT } from './i18n/LanguageProvider';
import { useFavorites } from './favorites/FavoritesProvider';

const messageSx = { px: { xs: '8px', sm: '24px', md: '40px' } };

const NO_DESIGNS: Amigurumi[] = [];

// "Favorieten eerst" verschilt per persoon; daar kan de server niet op sorteren.
const SERVER_SORT_OPTIONS: SortOption[] = ['newest', 'oldest', 'popular', 'name'];

// Knop om de volgende ontwerpen te laden. Komt hij in beeld (je scrolt naar onderen), dan
// laadt hij vanzelf; de knop blijft er voor wie met het toetsenbord navigeert.
const LoadMore = ({ onLoadMore, busy }: { onLoadMore: () => void; busy: boolean }) => {
    const t = useT();
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const element = ref.current;
        if (!element || busy) return;
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) onLoadMore();
        }, { rootMargin: '400px' });
        observer.observe(element);
        return () => observer.disconnect();
    }, [onLoadMore, busy]);
    return (
        <div ref={ref} className="load-more">
            <Button variant="outlined" onClick={onLoadMore} disabled={busy} sx={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}>
                {t(busy ? 'patterns.loadingMore' : 'patterns.loadMore')}
            </Button>
        </div>
    );
};

// Gedeelde weergave van een lijst ontwerpen: zoeken, tags, sorteren, pagina's, kaarten en de
// detail-popup. Home, Mijn patronen, Favorieten en Volgend verschillen alleen in wélke
// ontwerpen ze tonen (en wat er staat als er geen zijn).
//
// Twee manieren:
// - `amigurumis` meegeven (eigen pagina's: altijd een beperkt aantal): zoeken, filteren en
//   pagineren gebeurt hier in de browser, met typfout-tolerant zoeken.
// - `serverSide` (Home: álle ontwerpen): Firestore zoekt, filtert, sorteert en laadt per 24
//   (zie useDesignSearch). Zoeken is dan op woordbegin, zonder typfouten op te vangen.
const PatternBrowser = ({
    amigurumis = NO_DESIGNS,
    loading = false,
    error,
    serverSide = false,
    actions,
    emptyMessage,
}: {
    amigurumis?: Amigurumi[];
    loading?: boolean;
    error?: Error | null;
    serverSide?: boolean;
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

    const debouncedSearchTerm = useDebouncedValue(searchTerm, 250);

    const server = useDesignSearch({ search: debouncedSearchTerm, tags: selectedTags, sort: sortBy }, serverSide);

    // Tags om uit te kiezen. Op de server-variant kennen we alleen de tags van wat al geladen
    // is; die verzamelen we (en je kunt ook zelf een tag intypen).
    const [seenTags, setSeenTags] = useState<string[]>([]);
    useEffect(() => {
        if (!serverSide) return;
        setSeenTags((prev) => {
            const next = new Set(prev);
            server.amigurumis.forEach((a) => (a.tags ?? []).forEach((tag) => next.add(tag)));
            return next.size === prev.length ? prev : [...next];
        });
    }, [serverSide, server.amigurumis]);
    const availableTags = useStableArray(
        Array.from(new Set(serverSide ? [...seenTags, ...selectedTags] : amigurumis.flatMap((a) => a.tags ?? []))).sort()
    );

    const filteredAmigurumis = useMemo(
        () => serverSide ? server.amigurumis : filterAndSortAmigurumis(amigurumis, debouncedSearchTerm, selectedTags, sortBy, favoriteIds),
        [serverSide, server.amigurumis, amigurumis, debouncedSearchTerm, selectedTags, sortBy, favoriteIds]
    );

    const [page, setPage] = useState(1);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearchTerm, selectedTags, sortBy]);

    const totalPages = Math.max(1, Math.ceil(filteredAmigurumis.length / PAGE_SIZE));

    const pagedAmigurumis = useMemo(
        () => serverSide ? filteredAmigurumis : filteredAmigurumis.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
        [serverSide, filteredAmigurumis, page]
    );

    const isLoading = serverSide ? server.loading : loading;
    const loadError = serverSide ? server.error : error;

    const handlePatternClick = useCallback(async (amigurumi: Amigurumi) => {
        try {
            const shapesSnapshot = await getDocs(query(collection(db, 'shapes'), where('amigurumi_id', '==', amigurumi.id)));
            const shapes = shapesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Shape[];
            navigate(`/${amigurumi.id}/pattern`, { state: { amigurumi, shapes } });
        } catch (error) {
            console.error('Fout bij het ophalen van shapes:', error);
        }
    }, [navigate]);

    if (loadError) {
        return <Typography color="error">{t('patterns.loadError', { message: loadError.message })}</Typography>;
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
                sortOptions={serverSide ? SERVER_SORT_OPTIONS : undefined}
                freeSoloTags={serverSide}
                actions={actions}
            />
            {isLoading ? (
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
            {serverSide ? (
                !isLoading && server.hasMore && (
                    <LoadMore onLoadMore={server.loadMore} busy={server.updating} />
                )
            ) : (
                <PatternPagination page={page} totalPages={totalPages} onPageChange={setPage} />
            )}
            <PatternDetail
                amigurumi={selectedAmigurumi}
                open={!!selectedAmigurumi}
                onClose={() => setSelectedAmigurumi(null)}
            />
        </div>
    );
};

export default PatternBrowser;
