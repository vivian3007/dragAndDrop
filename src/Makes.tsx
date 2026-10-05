import React, { useCallback, useEffect, useState } from 'react';
import { Box, Button, CircularProgress, DialogContent, IconButton, TextField, Typography } from '@mui/material';
import { CameraAlt, Delete } from '@mui/icons-material';
import { collection, deleteDoc, doc, getDocs, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { auth, db } from '../firebase-config.js';
import AppDialog from './AppDialog.tsx';
import ImageDropzone from './ImageDropzone.tsx';
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

// Fotoraster van afgewerkte knuffels. Toont per foto de maker (in een patroon) of het
// patroon (op een profiel), afhankelijk van `caption`.
export const MakeGrid = ({
    makes,
    caption,
    onDesignClick,
    onDelete,
    onNavigate,
}: {
    makes: Make[];
    caption: 'maker' | 'design';
    onDesignClick?: (make: Make) => void;
    onDelete?: (make: Make) => void;
    onNavigate?: () => void;
}) => {
    const t = useT();
    const loggedInUser = auth.currentUser?.email;

    return (
        <div className="make-grid">
            {makes.map((make) => (
                <figure key={make.id} className="make-item">
                    <img src={make.imageUrl} alt={t('makes.photoAlt', { name: make.amigurumi_name })} />
                    {onDelete && make.user_id === loggedInUser && (
                        <IconButton
                            size="small"
                            className="make-delete"
                            aria-label={t('makes.delete')}
                            onClick={() => onDelete(make)}
                        >
                            <Delete fontSize="small" />
                        </IconButton>
                    )}
                    <figcaption>
                        {caption === 'maker' ? (
                            <UserLink userId={make.user_id} onNavigate={onNavigate} />
                        ) : (
                            <button type="button" className="make-design-link" onClick={() => onDesignClick?.(make)}>
                                {make.amigurumi_name}
                            </button>
                        )}
                        {make.note && <span className="make-note">{make.note}</span>}
                    </figcaption>
                </figure>
            ))}
        </div>
    );
};

// "Gemaakt door anderen"-sectie in de patroon-details: foto's van afgewerkte knuffels en
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
    const loggedInUser = auth.currentUser?.email;
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
            .catch((err) => console.error('Fout bij ophalen van gemaakte knuffels:', err))
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
            console.error('Fout bij opslaan van gemaakte knuffel:', err);
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
            console.error('Fout bij verwijderen van gemaakte knuffel:', err);
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
                <CircularProgress size={20} />
            ) : makes.length === 0 ? (
                <Typography sx={{ opacity: 0.8 }}>{t('makes.empty')}</Typography>
            ) : (
                <MakeGrid makes={makes} caption="maker" onDelete={handleDelete} onNavigate={onNavigate} />
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
