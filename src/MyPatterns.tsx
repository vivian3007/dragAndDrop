import React from 'react';
import { Card, Typography, CircularProgress } from '@mui/material';
import { Favorite, FavoriteBorder } from '@mui/icons-material';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase-config.js';
import { useCollection } from 'react-firebase-hooks/firestore';
import { query, collection, where } from 'firebase/firestore';

interface Amigurumi {
    id: string;
    name: string;
    height: number;
    tags: string[];
    favorite: boolean;
    yarn_id: string;
    ownerEmail: string;
}

const MyPatterns = () => {
    const loggedInUser = auth.currentUser?.email;

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
            // Update wordt automatisch gereflecteerd door useCollection
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

    if (!loggedInUser) {
        return <Typography>Log in om je patronen te bekijken.</Typography>;
    }

    return (
        <div className="pattern">
            <div className="pattern-container">
                {amigurumis.length === 0 ? (
                    <Typography>Geen patronen gevonden.</Typography>
                ) : (
                    amigurumis.map((amigurumi) => (
                        <Card key={amigurumi.id} className="pattern-text-container">
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
                    ))
                )}
            </div>
        </div>
    );
};

export default MyPatterns;