import React, { useCallback, useEffect, useState } from 'react';
import { Box, Button, Card, CircularProgress, DialogContent, IconButton, TextField, Typography } from '@mui/material';
import { CameraAlt, Delete } from '@mui/icons-material';
import { collection, deleteDoc, doc, getDocs, onSnapshot, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../firebase-config.js';
import { useAuth } from './auth/AuthProvider';
import AppDialog from './AppDialog.tsx';
import { AmigurumiCardButtons, FavoriteButton } from './AmigurumiCard.tsx';
import ImageDropzone from './ImageDropzone.tsx';
import MasonryGrid from './MasonryGrid.tsx';
import { useResponsiveMinColumns } from './useResponsiveMinColumns.ts';
import { CardGridSkeleton } from './Skeletons.tsx';
import UserLink from './UserLink.tsx';
import { uploadPatternImage } from './uploadImage.ts';
import { useT } from './i18n/LanguageProvider';

const createdAtMillis = (make: Make) =>
    make.createdAt?.toMillis?.() ?? (make.createdAt instanceof Date ? make.createdAt.getTime() : 0);

// Nieuwste eerst. Client-side sorteren i.p.v. orderBy in de query: where + orderBy op een
// ander veld vraagt in Firestore om een samengestelde index.
export async function fetchMakes(field: 'amigurumi_id' | 'user_id', value: string): Promise<Make[]> {
    const snapshot = await getDocs(query(collection(db, 'makes'), where(field, '==', value)));
    return snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() } as Make))
        .sort((a, b) => createdAtMillis(b) - createdAtMillis(a));
}

// Live variant van fetchMakes: geeft eerst wat er in de lokale Firestore-cache staat (dus
// direct bij een eerder bezochte pagina) en werkt daarna bij. `loading` alleen tot de
// eerste snapshot.
export function useMakes(field: 'amigurumi_id' | 'user_id', value: string): { makes: Make[]; loading: boolean } {
    const [state, setState] = useState<{ makes: Make[]; loading: boolean }>({ makes: [], loading: true });
    useEffect(() => {
        setState({ makes: [], loading: true });
        return onSnapshot(
            query(collection(db, 'makes'), where(field, '==', value)),
            (snapshot) => setState({
                makes: snapshot.docs
                    .map((d) => ({ id: d.id, ...d.data() } as Make))
                    .sort((a, b) => createdAtMillis(b) - createdAtMillis(a)),
                loading: false,
            }),
            (error) => {
                console.error('Fout bij ophalen van gemaakte amigurumi:', error);
                setState((prev) => ({ ...prev, loading: false }));
            }
        );
    }, [field, value]);
    return state;
}

// Fotoraster van afgewerkte amigurumi, in dezelfde kaartstijl en masonry-indeling als de
// ontwerpen op Home/Favorieten. Toont per foto de maker (in een patroon) of het patroon
// (op een profiel), afhankelijk van `caption`. Op een profiel krijgt elke kaart ook de
// Patroon- en hartjesknop van het bijbehorende ontwerp, uit `designs` (op amigurumi_id;
// `null` = verwijderd, ontbreekt = nog aan het laden).
export const MakeGrid = ({
    makes,
    caption,
    designs,
    onDesignClick,
    onPatternClick,
    onDelete,
    onNavigate,
    columnWidth = 300,
}: {
    makes: Make[];
    caption: 'maker' | 'design';
    designs?: Record<string, Amigurumi | null>;
    onDesignClick?: (design: Amigurumi) => void;
    onPatternClick?: (design: Amigurumi) => void;
    onDelete?: (make: Make) => void;
    onNavigate?: () => void;
    columnWidth?: number;
}) => {
    const t = useT();
    const loggedInUser = useAuth().user?.uid;
    const minColumns = useResponsiveMinColumns();

    return (
        <MasonryGrid
            className="make-grid"
            items={makes}
            columnWidth={columnWidth}
            minColumns={minColumns}
            compactGap={10}
            gap={20}
            renderItem={(make) => {
                const design = caption === 'design' ? designs?.[make.amigurumi_id] : undefined;
                return (
                    <Card
                        key={make.id}
                        className="my-pattern-text-container make-card"
                        onClick={design ? () => onDesignClick?.(design) : undefined}
                        sx={design ? undefined : { cursor: 'default' }}
                    >
                        <div className="make-card-media">
                            <img
                                src={make.imageUrl}
                                alt={t('makes.photoAlt', { name: make.amigurumi_name })}
                                className="amigurumi-image"
                            />
                            {onDelete && make.user_id === loggedInUser && (
                                <IconButton
                                    size="small"
                                    className="make-delete"
                                    aria-label={t('makes.delete')}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(make);
                                    }}
                                >
                                    <Delete fontSize="small" />
                                </IconButton>
                            )}
                        </div>
                        {caption === 'maker' ? (
                            <div className="make-card-maker">
                                <UserLink userId={make.user_id} onNavigate={onNavigate} />
                            </div>
                        ) : (
                            <h1 style={{ marginTop: 20, marginBottom: 0 }}>{design?.name ?? make.amigurumi_name}</h1>
                        )}
                        {make.note && <p className="make-note">{make.note}</p>}
                        {design && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, marginTop: '20px' }}>
                                <AmigurumiCardButtons
                                    onPatternClick={(e) => {
                                        e.stopPropagation();
                                        onPatternClick?.(design);
                                    }}
                                />
                                <FavoriteButton amigurumiId={design.id} />
                            </Box>
                        )}
                        {design === null && <p className="make-note">{t('makes.designGone')}</p>}
                    </Card>
                );
            }}
        />
    );
};

// "Gemaakt door anderen"-sectie in de patroon-details: foto's van afgewerkte amigurumi en
// een knop om er zelf een toe te voegen. `onCountChange` houdt bv. een tabblad-label met
// het aantal foto's bij, ook na toevoegen of verwijderen.
const Makes = ({
    amigurumi,
    onNavigate,
    onCountChange,
    showTitle = true,
}: {
    amigurumi: Amigurumi;
    onNavigate?: () => void;
    onCountChange?: (count: number) => void;
    showTitle?: boolean;
}) => {
    const t = useT();
    const loggedInUser = useAuth().user?.uid;
    const [makes, setMakes] = useState<Make[]>([]);
    const [loading, setLoading] = useState(true);
    const [formOpen, setFormOpen] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [note, setNote] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        setLoading(true);
        fetchMakes('amigurumi_id', amigurumi.id)
            .then(setMakes)
            .catch((err) => console.error('Fout bij ophalen van gemaakte amigurumi:', err))
            .finally(() => setLoading(false));
    }, [amigurumi.id]);

    useEffect(() => {
        if (!loading) onCountChange?.(makes.length);
    }, [makes, loading, onCountChange]);

    const openForm = () => {
        setImageFile(null);
        setNote('');
        setError('');
        setFormOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!loggedInUser) return;
        if (!imageFile) {
            setError('makes.error.photoRequired');
            return;
        }
        setSaving(true);
        setError('');
        try {
            const imageUrl = await uploadPatternImage(imageFile);
            const id = uuidv4();
            const make = {
                amigurumi_id: amigurumi.id,
                amigurumi_name: amigurumi.name,
                user_id: loggedInUser,
                imageUrl,
                note: note.trim() || null,
            };
            await setDoc(doc(db, 'makes', id), { ...make, createdAt: serverTimestamp() });
            setMakes((prev) => [{ id, ...make, createdAt: new Date() }, ...prev]);
            setFormOpen(false);
        } catch (err) {
            console.error('Fout bij opslaan van gemaakte amigurumi:', err);
            setError('makes.error.saveFailed');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = useCallback(async (make: Make) => {
        if (!window.confirm(t('makes.deleteConfirm'))) return;
        try {
            await deleteDoc(doc(db, 'makes', make.id));
            setMakes((prev) => prev.filter((m) => m.id !== make.id));
        } catch (err) {
            console.error('Fout bij verwijderen van gemaakte amigurumi:', err);
        }
    }, [t]);

    const previewSrc = imageFile ? URL.createObjectURL(imageFile) : null;

    return (
        <Box sx={{ mt: showTitle ? 3 : 0 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1.5 }}>
                {showTitle ? <h3 style={{ margin: 0 }}>{t('makes.title')}</h3> : <span />}
                {loggedInUser && (
                    <Button
                        size="small"
                        variant="outlined"
                        startIcon={<CameraAlt />}
                        sx={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)', flexDirection: 'row' }}
                        onClick={openForm}
                    >
                        {t('makes.add')}
                    </Button>
                )}
            </Box>
            {loading ? (
                <CardGridSkeleton count={2} columnWidth={240} withTags={false} withActions={false} />
            ) : makes.length === 0 ? (
                <Typography sx={{ opacity: 0.8 }}>{t('makes.empty')}</Typography>
            ) : (
                <MakeGrid makes={makes} caption="maker" onDelete={handleDelete} onNavigate={onNavigate} columnWidth={240} />
            )}

            <AppDialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm">
                <DialogContent sx={{ padding: 4 }}>
                    <Typography variant="h5" gutterBottom sx={{ pr: 4 }}>{t('makes.formTitle')}</Typography>
                    <Typography sx={{ mb: 2 }}>{t('makes.formIntro', { name: amigurumi.name })}</Typography>
                    <form onSubmit={handleSubmit}>
                        <ImageDropzone previewSrc={previewSrc} onFileSelected={setImageFile} />
                        <TextField
                            label={t('makes.note')}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            fullWidth
                            multiline
                            minRows={2}
                            margin="normal"
                            placeholder={t('makes.notePlaceholder')}
                        />
                        {error && <Typography color="error" sx={{ mt: 1 }}>{t(error)}</Typography>}
                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            disabled={saving}
                            sx={{ mt: 2, backgroundColor: 'var(--color-primary)', color: 'var(--color-bg)', paddingY: 2 }}
                        >
                            {saving ? <CircularProgress size={24} /> : t('makes.save')}
                        </Button>
                    </form>
                </DialogContent>
            </AppDialog>
        </Box>
    );
};

export default Makes;
