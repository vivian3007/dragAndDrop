import React from 'react';
import {Card, Typography, CircularProgress, Button, Box, Chip} from '@mui/material';
import { Favorite, FavoriteBorder, Delete } from '@mui/icons-material';
import { doc, updateDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase-config.js';
import { useCollection } from 'react-firebase-hooks/firestore';
import { query, collection, where } from 'firebase/firestore';
import {useNavigate} from "react-router-dom";
import calculateIntersections from "./calculateIntersections.tsx";

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

    const src = [
        "duck",
        "cow",
        "cat",
        "dog",
        "bunny"
    ]

    const getRandomImage = () => {
        const randomIndex = Math.floor(Math.random() * src.length);
        return `../public/img/${src[randomIndex]}.jpg`;
    };

    const handleFavoriteChange = async (amigurumi: Amigurumi) => {
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
    };

    const handleEditClick = async (amigurumi: Amigurumi) => {
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
    };

    const handlePatternClick = async (amigurumi: Amigurumi) => {
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
    };

    const handleDeleteAmigurumi = async (amigurumi: Amigurumi) => {
        if (window.confirm(`Weet je zeker dat je "${amigurumi.name}" wilt verwijderen?`)) {
            try {
                await deleteDoc(doc(db, 'amigurumi', amigurumi.id));
                // Optioneel: feedback/toast of refresh
            } catch (error) {
                console.error('Fout bij verwijderen van amigurumi:', error);
                alert('Fout bij verwijderen van amigurumi');
            }
        }
    };

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
                        <Card key={amigurumi.id} className="my-pattern-text-container">
                            <img src={getRandomImage()} alt={amigurumi.name} className="amigurumi-image"/>
                            <h1 style={{marginTop: 20, marginBottom: 20}}>{amigurumi.name}</h1>
                            {/*<h3>Tags</h3>*/}
                            <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2}}>
                                {amigurumi.tags.map((tag) => (
                                    <Chip
                                        key={tag}
                                        label={tag}
                                        color="inherit"
                                    />
                                ))}
                            </Box>
                            <div style={{display: 'flex', gap: '5px', marginTop: 20, flexWrap: "wrap", width: "100%", justifyContent: "space-between"}}>
                                <div style={{display: "flex", gap: "5px", width: "65%"}}>
                                    <Button
                                        type="button"
                                        variant="contained"
                                        color="inherit"
                                        sx={{ width: 1, backgroundColor: "#d4929a"}}
                                        onClick={() => handleEditClick(amigurumi)}
                                    >
                                        Edit
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="contained"
                                        color="inherit"
                                        sx={{ width: 1, backgroundColor: "#d4929a"}}
                                        onClick={() => handlePatternClick(amigurumi)}
                                    >
                                        Pattern
                                    </Button>
                                </div>
                                <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                                    {amigurumi.favorite ? (
                                        <Favorite
                                            sx={{color: 'red', fontSize: '2.5rem', cursor: 'pointer', height: "2.5rem"}}
                                            onClick={() => handleFavoriteChange(amigurumi)}
                                        />
                                    ) : (
                                        <FavoriteBorder
                                            sx={{color: 'grey', fontSize: '2.5rem', cursor: 'pointer'}}
                                            onClick={() => handleFavoriteChange(amigurumi)}
                                        />
                                    )}
                                    <Delete
                                        sx={{color: 'grey', fontSize: '2.5rem', cursor: 'pointer'}}
                                        onClick={() => handleDeleteAmigurumi(amigurumi)}
                                        titleAccess="Verwijder patroon"
                                    />
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

export default MyPatterns;