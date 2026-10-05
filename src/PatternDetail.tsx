import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Chip, CircularProgress, DialogContent, Table, TableBody, TableCell, TableRow, Typography } from '@mui/material';
import { ContentCopy, Favorite, FavoriteBorder } from '@mui/icons-material';
import { collection, doc, getCountFromServer, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { auth, db } from '../firebase-config.js';
import AppDialog from './AppDialog.tsx';
import { computePatternHeightCm, computePatternWidthCm } from './geometry/patternBounds';
import NewPattern from './NewPattern.tsx';
import ImagePlaceholder from './ImagePlaceholder.tsx';
import { FormattedMessage, useIntl } from 'react-intl';
import { toast } from 'react-toastify';
import UserLink from './UserLink.tsx';
import Makes from './Makes.tsx';
import { useT } from './i18n/LanguageProvider';

const PatternDetail = ({
    amigurumi: amigurumiProp,
    open,
    onClose,
}: {
    amigurumi: Amigurumi | null;
    open: boolean;
    onClose: () => void;
}) => {
    const navigate = useNavigate();
    const intl = useIntl();
    const t = useT();

    const [amigurumi, setAmigurumi] = useState<Amigurumi | null>(amigurumiProp);
    const [yarn, setYarn] = useState<Yarn | null>(null);
    const [yarnLoading, setYarnLoading] = useState(false);
    const [favorite, setFavorite] = useState(false);
    const [isHeartBouncing, setIsHeartBouncing] = useState(false);
    const [widthCm, setWidthCm] = useState<number | null>(null);
    const [heightCm, setHeightCm] = useState<number | null>(null);
    const [sizeLoading, setSizeLoading] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [copyOpen, setCopyOpen] = useState(false);
    const [copyCount, setCopyCount] = useState(0);

    useEffect(() => {
        setAmigurumi(amigurumiProp);
    }, [amigurumiProp]);

    useEffect(() => {
        setFavorite(amigurumi?.favorite ?? false);
    }, [amigurumi]);

    // Hoe vaak dit ontwerp direct als template gebruikt is. Een count-query haalt de
    // documenten zelf niet op, dus dit blijft goedkoop ook bij veel kopieën.
    useEffect(() => {
        setCopyCount(0);
        if (!amigurumi?.id) return;
        getCountFromServer(query(collection(db, 'amigurumi'), where('copiedFromId', '==', amigurumi.id)))
            .then((snapshot) => setCopyCount(snapshot.data().count))
            .catch((error) => console.error('Fout bij tellen van kopieën:', error));
    }, [amigurumi?.id]);

    // Opent een bron uit de herkomstketen in deze zelfde dialoog. De naam in de keten is
    // vastgelegd bij het kopiëren; het origineel kan inmiddels verwijderd zijn.
    const openSource = useCallback(async (source: AmigurumiSource) => {
        try {
            const snap = await getDoc(doc(db, 'amigurumi', source.id));
            if (snap.exists()) {
                setAmigurumi({ id: snap.id, ...snap.data() } as Amigurumi);
            } else {
                toast.info(t('detail.sourceDeleted', { name: source.name }));
            }
        } catch (error) {
            console.error('Fout bij ophalen van origineel:', error);
        }
    }, [t]);

    useEffect(() => {
        if (!amigurumi?.id) {
            setWidthCm(null);
            setHeightCm(null);
            return;
        }
        setSizeLoading(true);
        const shapesQuery = query(collection(db, 'shapes'), where('amigurumi_id', '==', amigurumi.id));
        getDocs(shapesQuery)
            .then((snapshot) => {
                const shapes = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Shape[];
                setWidthCm(computePatternWidthCm(shapes));
                setHeightCm(computePatternHeightCm(shapes));
            })
            .catch((error) => console.error('Fout bij het ophalen van shapes:', error))
            .finally(() => setSizeLoading(false));
    }, [amigurumi?.id]);

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

    const handleEditShapesClick = useCallback(async () => {
        if (!amigurumi) return;
        try {
            const shapesQuery = query(collection(db, 'shapes'), where('amigurumi_id', '==', amigurumi.id));
            const shapesSnapshot = await getDocs(shapesQuery);
            const shapes = shapesSnapshot.docs.map((d) => ({
                id: d.id,
                ...d.data(),
            })) as Shape[];

            onClose();
            navigate(`/${amigurumi.id}/editor`, { state: { amigurumi, shapes } });
        } catch (error) {
            console.error('Fout bij het ophalen van shapes:', error);
        }
    }, [amigurumi, navigate, onClose]);

    if (!amigurumi) {
        return null;
    }

    const isOwner = amigurumi.user_id === auth.currentUser?.email;
    const isLoggedIn = !!auth.currentUser;
    const [directSource, ...olderSources] = amigurumi.copiedFrom ?? [];

    const sourceRef = (source: AmigurumiSource) => (
        <FormattedMessage
            id="detail.sourceBy"
            values={{
                name: (
                    <button type="button" className="link-button" onClick={() => openSource(source)}>
                        {source.name}
                    </button>
                ),
                user: <UserLink userId={source.user_id} onNavigate={onClose} />,
            }}
        />
    );

    const createdDate = amigurumi.createdAt?.toDate
        ? intl.formatDate(amigurumi.createdAt.toDate(), { day: 'numeric', month: 'long', year: 'numeric' })
        : null;

    return (
        <AppDialog open={open} onClose={onClose} maxWidth="lg">
            <DialogContent className="detail-card">
                {amigurumi.imageUrl ? (
                    <img
                        src={amigurumi.imageUrl}
                        alt={amigurumi.name}
                        className="detail-image"
                    />
                ) : (
                    <ImagePlaceholder className="detail-image" iconSize="4rem" />
                )}
                <div className="detail-info">
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 1, pr: { xs: 4, sm: 5 } }}>
                        <h1 style={{ margin: 0, fontSize: 'clamp(1.3rem, 4vw + 0.5rem, 2rem)' }}>{amigurumi.name}</h1>
                        {favorite ? (
                            <Favorite
                                className={isHeartBouncing ? 'heart-bounce' : ''}
                                onAnimationEnd={() => setIsHeartBouncing(false)}
                                sx={{ color: 'var(--color-favorite)', fontSize: { xs: '2rem', sm: '2.5rem' }, cursor: 'pointer' }}
                                onClick={() => { setIsHeartBouncing(true); handleFavoriteChange(); }}
                                titleAccess={t('card.unfavorite')}
                            />
                        ) : (
                            <FavoriteBorder
                                className={isHeartBouncing ? 'heart-bounce' : ''}
                                onAnimationEnd={() => setIsHeartBouncing(false)}
                                sx={{ color: 'var(--color-text)', fontSize: { xs: '2rem', sm: '2.5rem' }, cursor: 'pointer' }}
                                onClick={() => { setIsHeartBouncing(true); handleFavoriteChange(); }}
                                titleAccess={t('card.favorite')}
                            />
                        )}
                    </Box>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, my: 2 }}>
                        {amigurumi.tags?.map((tag) => (
                            <Chip
                                key={tag}
                                label={tag}
                                sx={{ backgroundColor: 'var(--color-accent-soft)', color: 'var(--color-text)' }}
                            />
                        ))}
                    </Box>

                    {directSource && (
                        <Box className="detail-lineage" sx={{ mb: 2 }}>
                            <Typography>
                                <strong>{t('detail.copiedFrom')}:</strong>{' '}
                                {sourceRef(directSource)}
                            </Typography>
                            {olderSources.length > 0 && (
                                <Box component="ol" sx={{ m: 0, mt: 0.5, pl: 3, fontSize: '0.9rem', opacity: 0.8 }}>
                                    {olderSources.map((source) => (
                                        <li key={source.id}>{sourceRef(source)}</li>
                                    ))}
                                </Box>
                            )}
                        </Box>
                    )}

                    <Typography sx={{ mb: 1 }}>
                        <strong>{t('detail.designer')}:</strong> <UserLink userId={amigurumi.user_id} onNavigate={onClose} />
                    </Typography>
                    {copyCount > 0 && (
                        <Typography sx={{ mb: 1 }}>
                            <strong>{t('detail.copies')}:</strong> {t('detail.copyCount', { count: copyCount })}
                        </Typography>
                    )}
                    <Typography sx={{ mb: 1 }}><strong>{t('detail.created')}:</strong> {createdDate ?? t('detail.unknown')}</Typography>
                    {sizeLoading ? (
                        <CircularProgress size={16} sx={{ mb: 1 }} />
                    ) : (
                        <>
                            {heightCm ? (
                                <Typography sx={{ mb: 1 }}><strong>{t('detail.height')}:</strong> {Math.round(heightCm)} cm</Typography>
                            ) : null}
                            {widthCm ? (
                                <Typography sx={{ mb: 1 }}><strong>{t('detail.width')}:</strong> {Math.round(widthCm)} cm</Typography>
                            ) : null}
                        </>
                    )}

                    <h3 style={{ marginBottom: 10 }}>{t('yarn.title')}</h3>
                    {yarnLoading ? (
                        <CircularProgress size={20} />
                    ) : yarn ? (
                        <Table size="small" className="detail-yarn-table">
                            <TableBody>
                                <TableRow>
                                    <TableCell>{t('yarn.name')}</TableCell>
                                    <TableCell>{yarn.name}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>{t('yarn.color')}</TableCell>
                                    <TableCell>{yarn.color}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>{t('yarn.weight')}</TableCell>
                                    <TableCell>{yarn.weight}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>{t('yarn.material')}</TableCell>
                                    <TableCell>{yarn.material}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>{t('yarn.hooksize')}</TableCell>
                                    <TableCell>{yarn.hooksize} mm</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>{t('yarn.mPerSkein')}</TableCell>
                                    <TableCell>{yarn.mPerSkein} m</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    ) : (
                        <Typography>{t('detail.noYarn')}</Typography>
                    )}

                    {amigurumi.notes ? (
                        <>
                            <h3 style={{ marginTop: 20, marginBottom: 10 }}>{t('detail.notes')}</h3>
                            <Typography sx={{ whiteSpace: 'pre-wrap' }}>{amigurumi.notes}</Typography>
                        </>
                    ) : null}

                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: '10px', mt: 2.5, flexWrap: 'wrap' }}>
                        <Button
                            type="button"
                            variant="contained"
                            color="inherit"
                            sx={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-bg)', width: { xs: '100%', sm: 'auto' } }}
                            onClick={handlePatternClick}
                        >
                            {t('detail.viewPattern')}
                        </Button>
                        {isOwner && (
                            <>
                                <Button
                                    type="button"
                                    variant="outlined"
                                    sx={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)', width: { xs: '100%', sm: 'auto' } }}
                                    onClick={() => setEditOpen(true)}
                                >
                                    {t('detail.edit')}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outlined"
                                    sx={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)', width: { xs: '100%', sm: 'auto' } }}
                                    onClick={handleEditShapesClick}
                                >
                                    {t('detail.editShapes')}
                                </Button>
                            </>
                        )}
                        {isLoggedIn && (
                            <Button
                                type="button"
                                variant="outlined"
                                startIcon={<ContentCopy />}
                                sx={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)', width: { xs: '100%', sm: 'auto' }, flexDirection: 'row' }}
                                onClick={() => setCopyOpen(true)}
                            >
                                {t('detail.useAsTemplate')}
                            </Button>
                        )}
                    </Box>

                    <Makes amigurumi={amigurumi} onNavigate={onClose} />
                </div>
            </DialogContent>
            <NewPattern
                open={editOpen}
                onClose={() => setEditOpen(false)}
                editingAmigurumi={amigurumi}
                onSaved={setAmigurumi}
            />
            <NewPattern
                open={copyOpen}
                onClose={() => setCopyOpen(false)}
                copySource={amigurumi}
            />
        </AppDialog>
    );
};

export default PatternDetail;
