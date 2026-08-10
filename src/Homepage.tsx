import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {CircularProgress, Typography} from '@mui/material';
import {doc, getDocs, updateDoc, where} from 'firebase/firestore';
import { db } from '../firebase-config.js';
import { useCollection } from 'react-firebase-hooks/firestore';
import { query, collection } from 'firebase/firestore';
import {useNavigate} from "react-router-dom";
import AmigurumiCard from "./AmigurumiCard.tsx";
import MasonryGrid from "./MasonryGrid.tsx";
import PatternDetail from "./PatternDetail.tsx";
import PatternFilters from "./PatternFilters.tsx";
import PatternPagination, { PAGE_SIZE } from "./PatternPagination.tsx";
import { filterAndSortAmigurumis, SortOption } from "./filterAmigurumis.ts";
import { useDebouncedValue } from "./useDebouncedValue.ts";
import { useStableArray } from "./useStableArray.ts";

const Homepage = ({yarnInfo, intersections} : {yarnInfo: Yarn, intersections: any}) => {
    const navigate = useNavigate();
    const [selectedAmigurumi, setSelectedAmigurumi] = useState<Amigurumi | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState<SortOption>('newest');

    const [snapshot, loading, error] = useCollection(query(collection(db, 'amigurumi')));
    const amigurumis = snapshot
        ? snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as Amigurumi[]
        : [];

    const availableTags = useStableArray(
        Array.from(new Set(amigurumis.flatMap((a) => a.tags ?? []))).sort()
    );

    const debouncedSearchTerm = useDebouncedValue(searchTerm, 250);

    const filteredAmigurumis = useMemo(
        () => filterAndSortAmigurumis(amigurumis, debouncedSearchTerm, selectedTags, sortBy),
        [amigurumis, debouncedSearchTerm, selectedTags, sortBy]
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

    const handleFavoriteChange = useCallback(async (amigurumi: Amigurumi) => {
        try {
            console.log(`Updating favorite for ${amigurumi.id}: ${!amigurumi.favorite}`);
            const newFavoriteStatus = !amigurumi.favorite;
            await updateDoc(doc(db, 'amigurumi', amigurumi.id), {
                favorite: newFavoriteStatus,
            });
            console.log(`Updated favorite for ${amigurumi.id} successfully`);
        } catch (error) {
            console.error('Error updating favorite:', error);
        }
    }, []);

    const handlePatternClick = useCallback(async (amigurumi: Amigurumi) => {
        try {
            const shapesQuery = query(collection(db, 'shapes'), where('amigurumi_id', '==', amigurumi.id));
            const shapesSnapshot = await getDocs(shapesQuery);
            const shapes = shapesSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Shape[];

            console.log('Shapes voor amigurumi', amigurumi.id, ':', shapes);

            navigate(`/${amigurumi.id}/pattern`, { state: { amigurumi, shapes, yarnInfo, intersections } });
        } catch (error) {
            console.error('Fout bij het ophalen van shapes:', error);
        }
    }, [navigate, yarnInfo, intersections]);

    const handleCardClick = useCallback((amigurumi: Amigurumi) => {
        setSelectedAmigurumi(amigurumi);
    }, []);

    if (loading) {
        return <CircularProgress />;
    }

    if (error) {
        return <Typography color="error">Fout bij het ophalen van patronen: {error.message}</Typography>;
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
            />
            {filteredAmigurumis.length === 0 ? (
                <Typography sx={{ px: '40px' }}>Geen patronen gevonden voor deze zoekopdracht/filter.</Typography>
            ) : (
                <MasonryGrid
                    className="my-pattern-container"
                    items={pagedAmigurumis}
                    columnWidth={300}
                    gap={20}
                    renderItem={(amigurumi) => (
                        <AmigurumiCard
                            key={amigurumi.id}
                            amigurumi={amigurumi}
                            onFavoriteChange={handleFavoriteChange}
                            onPatternClick={handlePatternClick}
                            onCardClick={handleCardClick}
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

export default Homepage;