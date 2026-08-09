import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Chip, CircularProgress, DialogContent, Table, TableBody, TableCell, TableRow, Typography } from '@mui/material';
import { Favorite, FavoriteBorder } from '@mui/icons-material';
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { db } from '../firebase-config.js';
import { getImageForId } from './AmigurumiCard.tsx';
import AppDialog from './AppDialog.tsx';

const PatternDetail = ({
    amigurumi,
    open,
    onClose,
}: {
    amigurumi: Amigurumi | null;
    open: boolean;
    onClose: () => void;
}) => {
    const navigate = useNavigate();

    const [yarn, setYarn] = useState<Yarn | null>(null);
    const [yarnLoading, setYarnLoading] = useState(false);
    const [favorite, setFavorite] = useState(false);

    useEffect(() => {
        setFavorite(amigurumi?.favorite ?? false);
    }, [amigurumi]);

    useEffect(() => {
        if (!amigurumi?.yarn_id) {
            setYarn(null);
            return;
        }
        setYarnLoading(true);
        getDoc(doc(db, 'yarn', amigurumi.yarn_id))
            .then((snap) => {
                setYarn(snap.exists() ? ({ id: snap.id, ...snap.data() } as Yarn) : null);
            })
            .catch((error) => console.error('Fout bij het ophalen van garen:', error))
            .finally(() => setYarnLoading(false));
    }, [amigurumi?.yarn_id]);

    const handleFavoriteChange = useCallback(async () => {
        if (!amigurumi) return;
        try {
            const newFavoriteStatus = !favorite;
            await updateDoc(doc(db, 'amigurumi', amigurumi.id), { favorite: newFavoriteStatus });
            setFavorite(newFavoriteStatus);
        } catch (error) {
            console.error('Error updating favorite:', error);
        }
    }, [amigurumi, favorite]);

    const handlePatternClick = useCallback(async () => {
        if (!amigurumi) return;
        try {
            const shapesQuery = query(collection(db, 'shapes'), where('amigurumi_id', '==', amigurumi.id));
            const shapesSnapshot = await getDocs(shapesQuery);
            const shapes = shapesSnapshot.docs.map((d) => ({
                id: d.id,
                ...d.data(),
            })) as Shape[];

            onClose();
            navigate(`/${amigurumi.id}/pattern`, { state: { amigurumi, shapes, yarnInfo: yarn, intersections: [] } });
        } catch (error) {
            console.error('Fout bij het ophalen van shapes:', error);
        }
    }, [amigurumi, yarn, navigate, onClose]);

    if (!amigurumi) {
        return null;
    }

    const createdDate = amigurumi.createdAt?.toDate
        ? amigurumi.createdAt.toDate().toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
        : null;

    return (
        <AppDialog open={open} onClose={onClose} maxWidth="lg">
            <DialogContent className="detail-card">
                <img
                    src={getImageForId(amigurumi.id)}
                    alt={amigurumi.name}
                    className="detail-image"
                />
                <div className="detail-info">
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: 5 }}>
                        <h1 style={{ margin: 0 }}>{amigurumi.name}</h1>
                        {favorite ? (
                            <Favorite
                                sx={{ color: 'red', fontSize: '2.5rem', cursor: 'pointer' }}
                                onClick={handleFavoriteChange}
                            />
                        ) : (
                            <FavoriteBorder
                                sx={{ color: 'grey', fontSize: '2.5rem', cursor: 'pointer' }}
                                onClick={handleFavoriteChange}
                            />
                        )}
                    </Box>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, my: 2 }}>
                        {amigurumi.tags?.map((tag) => (
                            <Chip key={tag} label={tag} color="inherit" />
                        ))}
                    </Box>

                    <Typography sx={{ mb: 1 }}><strong>Aangemaakt:</strong> {createdDate ?? 'Onbekend'}</Typography>
                    {amigurumi.height ? (
                        <Typography sx={{ mb: 1 }}><strong>Hoogte:</strong> {amigurumi.height} cm</Typography>
                    ) : null}

                    <h3 style={{ marginBottom: 10 }}>Garen</h3>
                    {yarnLoading ? (
                        <CircularProgress size={20} />
                    ) : yarn ? (
                        <Table size="small" className="detail-yarn-table">
                            <TableBody>
                                <TableRow>
                                    <TableCell>Naam</TableCell>
                                    <TableCell>{yarn.name}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Kleur</TableCell>
                                    <TableCell>{yarn.color}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Dikte</TableCell>
                                    <TableCell>{yarn.weight}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Materiaal</TableCell>
                                    <TableCell>{yarn.material}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Haaknaald</TableCell>
                                    <TableCell>{yarn.hooksize} mm</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Meter per bol</TableCell>
                                    <TableCell>{yarn.mPerSkein} m</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    ) : (
                        <Typography>Geen garen gekoppeld aan dit patroon.</Typography>
                    )}

                    <div style={{ display: 'flex', gap: '10px', marginTop: 20, flexWrap: 'wrap' }}>
                        <Button
                            type="button"
                            variant="contained"
                            color="inherit"
                            sx={{ backgroundColor: '#d4929a' }}
                            onClick={handlePatternClick}
                        >
                            Bekijk patroon
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </AppDialog>
    );
};

export default PatternDetail;
