import React from 'react';
import {Box, Button, Card, Chip, CircularProgress, Typography} from '@mui/material';
import { Favorite, FavoriteBorder } from '@mui/icons-material';
import {doc, getDocs, updateDoc, where} from 'firebase/firestore';
import { db } from '../firebase-config.js';
import { useCollection } from 'react-firebase-hooks/firestore';
import { query, collection } from 'firebase/firestore';
import {useNavigate} from "react-router-dom";

const Homepage = ({yarnInfo, intersections} : {yarnInfo: Yarn, intersections: any}) => {
    const navigate = useNavigate();

    const [snapshot, loading, error] = useCollection(query(collection(db, 'amigurumi')));
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
                        <div style={{
                            display: 'flex',
                            gap: '15px',
                            marginTop: 20,
                            flexWrap: "wrap",
                            width: "100%",
                            justifyContent: "space-between"
                        }}>
                            <Button
                                type="button"
                                variant="contained"
                                color="inherit"
                                sx={{marginBottom: "20px", width: 0.8, backgroundColor: "#d4929a"}}
                                onClick={() => handlePatternClick(amigurumi)}
                            >
                                Pattern
                            </Button>
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
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    )
        ;
};

export default Homepage;