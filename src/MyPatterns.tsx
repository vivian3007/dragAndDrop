import React from 'react';
import {Card, Typography, CircularProgress, Button} from '@mui/material';
import { Favorite, FavoriteBorder } from '@mui/icons-material';
import { doc, updateDoc, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase-config.js';
import { useCollection } from 'react-firebase-hooks/firestore';
import { query, collection, where } from 'firebase/firestore';
import {useNavigate} from "react-router-dom";

interface Amigurumi {
    id: string;
    name: string;
    height: number;
    tags: string[];
    favorite: boolean;
    yarn_id: string;
    ownerEmail: string;
}

interface Shape {
    id: string;
    name: string;
    type: string;
    x: number;
    y: number;
    z: number;
    width: number;
    height: number;
    length: number;
    color: string;
    rotation_x: number;
    rotation_y: number;
    rotation_z: number;
    zoom: number;
}

interface Yarn {
    id: string;
    name: string;
    weight: string;
    mPerSkein: number;
    hooksize: number;
    material: string;
    color: string;
}

const MyPatterns = ({setCurrentAmigurumi, yarnInfo} : {setCurrentAmigurumi: any, yarnInfo: Yarn}) => {
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

            navigate(`/${amigurumi.id}/pattern`, { state: { amigurumi, shapes, yarnInfo } });
        } catch (error) {
            console.error('Fout bij het ophalen van shapes:', error);
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <h1 style={{ marginTop: 0, marginBottom: 0 }}>{amigurumi.name}</h1>
                                {amigurumi.favorite ? (
                                    <Favorite
                                        sx={{ color: 'red', fontSize: '1.5rem', cursor: 'pointer' }}
                                        onClick={() => handleFavoriteChange(amigurumi)}
                                    />
                                ) : (
                                    <FavoriteBorder
                                        sx={{ color: 'grey', fontSize: '1.5rem', cursor: 'pointer' }}
                                        onClick={() => handleFavoriteChange(amigurumi)}
                                    />
                                )}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <h3>Tags</h3>
                                <ul>
                                    {amigurumi.tags.map((tag, index) => (
                                        <li key={index}>{tag}</li>
                                    ))}
                                </ul>
                            </div>
                            <div style={{display: "flex", justifyContent: "space-between"}}>
                                <Button
                                    type="button"
                                    variant="contained"
                                    color="inherit"
                                    sx={{marginBottom: "20px", width: 0.49, backgroundColor: "#d4929a"}}
                                    onClick={() => handleEditClick(amigurumi)}
                                >
                                    Edit
                                </Button>
                                <Button
                                    type="button"
                                    variant="contained"
                                    color="inherit"
                                    sx={{marginBottom: "20px", width: 0.49, backgroundColor: "#d4929a"}}
                                    onClick={() => handlePatternClick(amigurumi)}
                                >
                                    Pattern
                                </Button>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

export default MyPatterns;