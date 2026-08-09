import React, {useCallback} from 'react';
import {Typography, CircularProgress} from '@mui/material';
import { doc, updateDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase-config.js';
import { useCollection } from 'react-firebase-hooks/firestore';
import { query, collection, where } from 'firebase/firestore';
import {useNavigate} from "react-router-dom";
import calculateIntersections from "./calculateIntersections.tsx";
import AmigurumiCard from "./AmigurumiCard.tsx";

const MyPatterns = ({yarnInfo, intersections, camera, scene, setIntersections, meshes, setMeshes, threeJsContainerRef} : {yarnInfo: Yarn, intersections: any}) => {
    const loggedInUser = auth.currentUser?.email;

    const navigate = useNavigate();

    const amigurumiQuery = loggedInUser
        ? query(collection(db, 'amigurumi'), where('user_id', '==', loggedInUser))
        : null;

    const [snapshot, loading, error] = useCollection(amigurumiQuery);

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

    const handleEditClick = useCallback(async (amigurumi: Amigurumi) => {
        try {
            const shapesQuery = query(collection(db, 'shapes'), where('amigurumi_id', '==', amigurumi.id));
            const shapesSnapshot = await getDocs(shapesQuery);
            const shapes = shapesSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Shape[];

            console.log('Shapes voor amigurumi', amigurumi.id, ':', shapes);

            calculateIntersections(
                shapes,
                scene,
                threeJsContainerRef,
                camera,
                meshes,
                setIntersections,
                setMeshes
            );

            navigate(`/${amigurumi.id}/editor`, { state: { amigurumi, shapes } });
        } catch (error) {
            console.error('Fout bij het ophalen van shapes:', error);
        }
    }, [scene, threeJsContainerRef, camera, meshes, setIntersections, setMeshes, navigate]);

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

    const handleDeleteAmigurumi = useCallback(async (amigurumi: Amigurumi) => {
        if (window.confirm(`Weet je zeker dat je "${amigurumi.name}" wilt verwijderen?`)) {
            try {
                await deleteDoc(doc(db, 'amigurumi', amigurumi.id));
                // Optioneel: feedback/toast of refresh
            } catch (error) {
                console.error('Fout bij verwijderen van amigurumi:', error);
                alert('Fout bij verwijderen van amigurumi');
            }
        }
    }, []);

    if (loading) {
        return <CircularProgress />;
    }

    if (error) {
        return <Typography color="error">Fout bij het ophalen van patronen: {error.message}</Typography>;
    }

    if (!loggedInUser) {
        return <Typography>Log in om je patronen te bekijken.</Typography>;
    }

    return (
        <div className="my-pattern">
            <div className="my-pattern-container">
                {amigurumis.length === 0 ? (
                    <Typography>Geen patronen gevonden.</Typography>
                ) : (
                    amigurumis.map((amigurumi) => (
                        <AmigurumiCard
                            key={amigurumi.id}
                            amigurumi={amigurumi}
                            onFavoriteChange={handleFavoriteChange}
                            onPatternClick={handlePatternClick}
                            onEditClick={handleEditClick}
                            onDeleteClick={handleDeleteAmigurumi}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default MyPatterns;