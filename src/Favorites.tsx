import React, {useCallback} from 'react';
import {CircularProgress, Typography} from '@mui/material';
import {doc, getDocs, updateDoc, where} from 'firebase/firestore';
import { db } from '../firebase-config.js';
import { useCollection } from 'react-firebase-hooks/firestore';
import { query, collection } from 'firebase/firestore';
import {useNavigate} from "react-router-dom";
import AmigurumiCard from "./AmigurumiCard.tsx";

const Favorites = ({yarnInfo, intersections} : {yarnInfo: Yarn, intersections: any}) => {
    const navigate = useNavigate();

    const [snapshot, loading, error] = useCollection(query(collection(db, 'amigurumi'), where('favorite', '==', true)));
    const amigurumis = snapshot
        ? snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as Amigurumi[]
        : [];

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

    if (loading) {
        return <CircularProgress />;
    }

    if (error) {
        return <Typography color="error">Fout bij het ophalen van patronen: {error.message}</Typography>;
    }

    return (
        <div className="my-pattern">
            <div className="my-pattern-container">
                {amigurumis.map((amigurumi) => (
                    <AmigurumiCard
                        key={amigurumi.id}
                        amigurumi={amigurumi}
                        onFavoriteChange={handleFavoriteChange}
                        onPatternClick={handlePatternClick}
                    />
                ))}
            </div>
        </div>
    );
};

export default Favorites;