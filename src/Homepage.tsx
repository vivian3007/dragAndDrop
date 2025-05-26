import React from 'react';
import {Card, CircularProgress, Typography} from '@mui/material';
import { Favorite, FavoriteBorder } from '@mui/icons-material';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase-config.js';
import { useCollection } from 'react-firebase-hooks/firestore';
import { query, collection } from 'firebase/firestore';

interface Amigurumi {
    id: string;
    name: string;
    height: number | null;
    tags: string[];
    favorite: boolean;
    yarn_id: string | null;
    user_id: string;
}

const Homepage = () => {
    const [snapshot, loading, error] = useCollection(query(collection(db, 'amigurumi')));
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
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default Homepage;