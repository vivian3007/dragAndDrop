import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    DialogContent,
    Divider,
    IconButton,
    ListItemIcon,
    Menu,
    MenuItem,
    Tab,
    Tabs,
    Table,
    TableBody,
    TableCell,
    TableRow,
    Typography,
} from '@mui/material';
import {
    ArrowBack,
    ContentCopy,
    Delete,
    Edit,
    ExpandMore,
    Favorite,
    FavoriteBorder,
    ViewInAr,
} from '@mui/icons-material';
import { collection, deleteDoc, doc, getCountFromServer, getDoc, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase-config.js';
import { useAuth } from './auth/AuthProvider';
import AppDialog from './AppDialog.tsx';
import { computePatternHeightCm, computePatternWidthCm } from './geometry/patternBounds';
import { estimateYarnByColor } from './patterns/estimateYarn';
import NewPattern from './NewPattern.tsx';
import DesignSnapshot from './DesignSnapshot.tsx';
import { FormattedMessage, useIntl } from 'react-intl';
import { toast } from 'react-toastify';
import UserLink from './UserLink.tsx';
import Makes from './Makes.tsx';
import { useT } from './i18n/LanguageProvider';
import { useFavorites } from './favorites/FavoritesProvider';

type DetailTab = 'about' | 'yarn' | 'makes';

const outlinedButtonSx = {
    borderColor: 'var(--color-primary)',
    color: 'var(--color-primary)',
    flexDirection: 'row',
};

// Detailweergave van een ontwerp. Opbouw: kop met afbeelding, naam, ontwerper, tags en een
// samenvattingsregel; daaronder één hoofdactie (patroon bekijken) plus één tweede actie die
// afhangt van wie er kijkt (eigenaar: bewerk-menu, anderen: als template gebruiken); en de
// rest van de informatie in tabbladen, zodat die niet allemaal tegelijk om aandacht vraagt.
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
    const { user } = useAuth();
    const intl = useIntl();
    const t = useT();

    const [amigurumi, setAmigurumi] = useState<Amigurumi | null>(amigurumiProp);
    // Ontwerpen waar je vandaan kwam via "Bekijk origineel", voor de terugknop.
    const [trail, setTrail] = useState<Amigurumi[]>([]);
    const [tab, setTab] = useState<DetailTab>('about');
    const [shapes, setShapes] = useState<Shape[] | null>(null);
    const [yarn, setYarn] = useState<Yarn | null>(null);
    const [yarnLoading, setYarnLoading] = useState(false);
    const { favoriteIds, toggleFavorite } = useFavorites();
    const favorite = !!amigurumi && favoriteIds.has(amigurumi.id);
    // Live teller: `amigurumi` is een momentopname van het moment van openen.
    const [favoriteCount, setFavoriteCount] = useState(0);
    const [isHeartBouncing, setIsHeartBouncing] = useState(false);
    const [copyCount, setCopyCount] = useState(0);
    const [makesCount, setMakesCount] = useState(0);
    const [editMenuAnchor, setEditMenuAnchor] = useState<HTMLElement | null>(null);
    const [editOpen, setEditOpen] = useState(false);
    const [copyOpen, setCopyOpen] = useState(false);

    useEffect(() => {
        setAmigurumi(amigurumiProp);
        setTrail([]);
    }, [amigurumiProp]);

    useEffect(() => {
        setTab('about');
    }, [amigurumi]);

    useEffect(() => {
        setShapes(null);
        if (!amigurumi?.id) return;
        getDocs(query(collection(db, 'shapes'), where('amigurumi_id', '==', amigurumi.id)))
            .then((snapshot) => setShapes(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Shape[]))
            .catch((error) => console.error('Fout bij het ophalen van shapes:', error));
    }, [amigurumi?.id]);

    useEffect(() => {
        if (!amigurumi?.yarn_id) {
            setYarn(null);
            return;
        }
        setYarnLoading(true);
        getDoc(doc(db, 'yarn', amigurumi.yarn_id))
            .then((snap) => setYarn(snap.exists() ? ({ id: snap.id, ...snap.data() } as Yarn) : null))
            .catch((error) => console.error('Fout bij het ophalen van garen:', error))
            .finally(() => setYarnLoading(false));
    }, [amigurumi?.yarn_id]);

    // Tellers via count-queries: die halen de documenten zelf niet op. Het aantal foto's
    // wordt daarna bijgewerkt door <Makes> zodra dat tabblad open is.
    useEffect(() => {
        setCopyCount(0);
        setMakesCount(0);
        if (!amigurumi?.id) return;
        getCountFromServer(query(collection(db, 'amigurumi'), where('copiedFromId', '==', amigurumi.id)))
            .then((snapshot) => setCopyCount(snapshot.data().count))
            .catch((error) => console.error('Fout bij tellen van kopieën:', error));
        getCountFromServer(query(collection(db, 'makes'), where('amigurumi_id', '==', amigurumi.id)))
            .then((snapshot) => setMakesCount(snapshot.data().count))
            .catch((error) => console.error('Fout bij tellen van gemaakte amigurumi:', error));
    }, [amigurumi?.id]);

    const sizeCm = useMemo(() => {
        if (!shapes?.length) return null;
        const height = computePatternHeightCm(shapes);
        const width = computePatternWidthCm(shapes);
        return height && width ? { height: Math.round(height), width: Math.round(width) } : null;
    }, [shapes]);

    const yarnMeters = useMemo(
        () => (shapes?.length ? estimateYarnByColor(shapes, yarn?.weight).total : null),
        [shapes, yarn?.weight],
    );

    // Opent een bron uit de herkomstketen in deze zelfde dialoog, met een terugknop. De naam
    // in de keten is vastgelegd bij het kopiëren; het origineel kan inmiddels verwijderd zijn.
    const openSource = useCallback(async (source: AmigurumiSource) => {
        try {
            const snap = await getDoc(doc(db, 'amigurumi', source.id));
            if (!snap.exists()) {
                toast.info(t('detail.sourceDeleted', { name: source.name }));
                return;
            }
            if (amigurumi) setTrail((prev) => [...prev, amigurumi]);
            setAmigurumi({ id: snap.id, ...snap.data() } as Amigurumi);
        } catch (error) {
            console.error('Fout bij ophalen van origineel:', error);
        }
    }, [amigurumi, t]);

    const goBack = useCallback(() => {
        const previous = trail[trail.length - 1];
        if (!previous) return;
        setAmigurumi(previous);
        setTrail(trail.slice(0, -1));
    }, [trail]);

    useEffect(() => {
        if (!amigurumi) return;
        setFavoriteCount(amigurumi.favoriteCount ?? 0);
        return onSnapshot(
            doc(db, 'amigurumi', amigurumi.id),
            (snap) => setFavoriteCount((snap.data()?.favoriteCount as number | undefined) ?? 0),
            (error) => console.error('Fout bij volgen van favorieten-teller:', error)
        );
    }, [amigurumi]);

    const handleFavoriteChange = useCallback(() => {
        if (!amigurumi) return;
        setIsHeartBouncing(true);
        toggleFavorite(amigurumi.id, favoriteCount);
    }, [amigurumi, toggleFavorite, favoriteCount]);

    const handlePatternClick = useCallback(() => {
        if (!amigurumi || !shapes) return;
        onClose();
        navigate(`/${amigurumi.id}/pattern`, { state: { amigurumi, shapes, yarnInfo: yarn, intersections: [] } });
    }, [amigurumi, shapes, yarn, navigate, onClose]);

    const handleEditShapesClick = useCallback(() => {
        if (!amigurumi || !shapes) return;
        setEditMenuAnchor(null);
        onClose();
        navigate(`/${amigurumi.id}/editor`, { state: { amigurumi, shapes } });
    }, [amigurumi, shapes, navigate, onClose]);

    const handleDelete = useCallback(async () => {
        if (!amigurumi) return;
        setEditMenuAnchor(null);
        if (!window.confirm(t('patterns.deleteConfirm', { name: amigurumi.name }))) return;
        try {
            await deleteDoc(doc(db, 'amigurumi', amigurumi.id));
            toast.success(t('detail.deleted', { name: amigurumi.name }));
            onClose();
        } catch (error) {
            console.error('Fout bij verwijderen van amigurumi:', error);
            toast.error(t('patterns.deleteError'));
        }
    }, [amigurumi, onClose, t]);

    if (!amigurumi) {
        return null;
    }

    const isOwner = !!user && amigurumi.user_id === user.uid;
    const isLoggedIn = !!user;
    const [directSource, ...olderSources] = amigurumi.copiedFrom ?? [];
    const previous = trail[trail.length - 1];

    const createdDate = amigurumi.createdAt?.toDate
        ? intl.formatDate(amigurumi.createdAt.toDate(), { day: 'numeric', month: 'long', year: 'numeric' })
        : null;

    const summary = [
        sizeCm && t('detail.summary.size', sizeCm),
        yarnMeters && t('detail.summary.yarn', { meters: yarnMeters }),
        copyCount > 0 && t('detail.summary.copies', { count: copyCount }),
    ].filter(Boolean);

    const sourceLine = (source: AmigurumiSource) => (
        <FormattedMessage
            id="detail.sourceBy"
            values={{
                name: <strong>{source.name}</strong>,
                user: <UserLink userId={source.user_id} onNavigate={onClose} />,
            }}
        />
    );

    return (
        <AppDialog open={open} onClose={onClose} maxWidth="md">
            <DialogContent className="detail-dialog">
                {previous && (
                    <Button
                        size="small"
                        startIcon={<ArrowBack />}
                        onClick={goBack}
                        className="detail-back"
                        sx={{ color: 'var(--color-primary)', flexDirection: 'row' }}
                    >
                        {t('detail.back', { name: previous.name })}
                    </Button>
                )}

                <div className="detail-header">
                    {amigurumi.imageUrl ? (
                        <img src={amigurumi.imageUrl} alt={amigurumi.name} className="detail-image" />
                    ) : (
                        <DesignSnapshot key={amigurumi.id} amigurumiId={amigurumi.id} alt={amigurumi.name} className="detail-image" />
                    )}

                    <div className="detail-heading">
                        <h1 className="detail-title">{amigurumi.name}</h1>
                        <div className="detail-byline">
                            {t('detail.by')} <UserLink userId={amigurumi.user_id} onNavigate={onClose} />
                        </div>

                        {amigurumi.tags?.length ? (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                                {amigurumi.tags.map((tag) => (
                                    <Chip key={tag} label={tag} size="small" sx={{ backgroundColor: 'var(--color-accent-soft)', color: 'var(--color-text)' }} />
                                ))}
                            </Box>
                        ) : null}

                        {summary.length > 0 && <p className="detail-summary">{summary.join(' · ')}</p>}

                        <div className="detail-actions">
                            <Button
                                variant="contained"
                                color="inherit"
                                startIcon={<ViewInAr />}
                                disabled={!shapes}
                                onClick={handlePatternClick}
                                sx={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-bg)', flexDirection: 'row', px: 2.5 }}
                            >
                                {t('detail.viewPattern')}
                            </Button>

                            {isOwner ? (
                                <>
                                    <Button
                                        variant="outlined"
                                        startIcon={<Edit />}
                                        endIcon={<ExpandMore />}
                                        onClick={(e) => setEditMenuAnchor(e.currentTarget)}
                                        aria-haspopup="menu"
                                        aria-expanded={Boolean(editMenuAnchor)}
                                        sx={outlinedButtonSx}
                                    >
                                        {t('detail.editMenu')}
                                    </Button>
                                    <Menu
                                        anchorEl={editMenuAnchor}
                                        open={Boolean(editMenuAnchor)}
                                        onClose={() => setEditMenuAnchor(null)}
                                    >
                                        <MenuItem onClick={() => { setEditMenuAnchor(null); setEditOpen(true); }}>
                                            <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
                                            {t('detail.editDetails')}
                                        </MenuItem>
                                        <MenuItem onClick={handleEditShapesClick} disabled={!shapes}>
                                            <ListItemIcon><ViewInAr fontSize="small" /></ListItemIcon>
                                            {t('detail.editShapesMenu')}
                                        </MenuItem>
                                        <MenuItem onClick={() => { setEditMenuAnchor(null); setCopyOpen(true); }}>
                                            <ListItemIcon><ContentCopy fontSize="small" /></ListItemIcon>
                                            {t('detail.duplicate')}
                                        </MenuItem>
                                        <Divider />
                                        <MenuItem onClick={handleDelete} sx={{ color: 'var(--color-favorite)' }}>
                                            <ListItemIcon><Delete fontSize="small" sx={{ color: 'var(--color-favorite)' }} /></ListItemIcon>
                                            {t('detail.delete')}
                                        </MenuItem>
                                    </Menu>
                                </>
                            ) : isLoggedIn ? (
                                <Button variant="outlined" startIcon={<ContentCopy />} onClick={() => setCopyOpen(true)} sx={outlinedButtonSx}>
                                    {t('detail.useAsTemplate')}
                                </Button>
                            ) : null}

                            <IconButton
                                onClick={handleFavoriteChange}
                                aria-label={t(favorite ? 'card.unfavorite' : 'card.favorite')}
                                aria-pressed={favorite}
                                title={t('card.favoriteCount', { count: favoriteCount })}
                                className="detail-favorite"
                            >
                                {favorite ? (
                                    <Favorite className={isHeartBouncing ? 'heart-bounce' : ''} onAnimationEnd={() => setIsHeartBouncing(false)} sx={{ color: 'var(--color-favorite)' }} />
                                ) : (
                                    <FavoriteBorder className={isHeartBouncing ? 'heart-bounce' : ''} onAnimationEnd={() => setIsHeartBouncing(false)} sx={{ color: 'var(--color-text)' }} />
                                )}
                                {favoriteCount > 0 && <span className="favorite-count">{favoriteCount}</span>}
                            </IconButton>
                        </div>
                    </div>
                </div>

                <Tabs
                    value={tab}
                    onChange={(_, value: DetailTab) => setTab(value)}
                    variant="scrollable"
                    allowScrollButtonsMobile
                    className="detail-tabs"
                >
                    <Tab value="about" label={t('detail.tab.about')} disableRipple />
                    <Tab value="yarn" label={t('detail.tab.yarn')} disableRipple />
                    <Tab value="makes" label={t('detail.tab.makes', { count: makesCount })} disableRipple />
                </Tabs>

                <div className="detail-tab-panel">
                    {tab === 'about' && (
                        <>
                            <Typography sx={{ whiteSpace: 'pre-wrap', opacity: amigurumi.notes ? 1 : 0.7 }}>
                                {amigurumi.notes || t('detail.noNotes')}
                            </Typography>
                            <Typography className="detail-meta">
                                {t('detail.created')}: {createdDate ?? t('detail.unknown')}
                            </Typography>

                            {directSource && (
                                <div className="detail-origin">
                                    <div className="detail-origin-label">{t('detail.copiedFrom')}</div>
                                    <div className="detail-origin-row">
                                        <span>{sourceLine(directSource)}</span>
                                        <Button size="small" variant="outlined" onClick={() => openSource(directSource)} sx={outlinedButtonSx}>
                                            {t('detail.viewOriginal')}
                                        </Button>
                                    </div>
                                    {olderSources.length > 0 && (
                                        <>
                                            <div className="detail-origin-label">{t('detail.earlierSources')}</div>
                                            {olderSources.map((source) => (
                                                <div key={source.id} className="detail-origin-row detail-origin-row--older">
                                                    <span>{sourceLine(source)}</span>
                                                    <Button size="small" onClick={() => openSource(source)} sx={{ color: 'var(--color-primary)' }}>
                                                        {t('detail.viewSource')}
                                                    </Button>
                                                </div>
                                            ))}
                                        </>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    {tab === 'yarn' && (
                        yarnLoading ? (
                            <CircularProgress size={20} />
                        ) : yarn ? (
                            <Table size="small" className="detail-yarn-table">
                                <TableBody>
                                    {[
                                        ['yarn.name', yarn.name],
                                        ['yarn.color', yarn.color],
                                        ['yarn.weight', yarn.weight],
                                        ['yarn.material', yarn.material],
                                        ['yarn.hooksize', yarn.hooksize ? `${yarn.hooksize} mm` : null],
                                        ['yarn.mPerSkein', yarn.mPerSkein ? `${yarn.mPerSkein} m` : null],
                                    ].map(([labelId, value]) => (
                                        <TableRow key={labelId as string}>
                                            <TableCell>{t(labelId as string)}</TableCell>
                                            <TableCell>{value || '—'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <Typography>{t('detail.noYarn')}</Typography>
                        )
                    )}

                    {tab === 'makes' && (
                        <Makes amigurumi={amigurumi} onNavigate={onClose} onCountChange={setMakesCount} showTitle={false} />
                    )}
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
