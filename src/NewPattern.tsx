import { v4 as uuidv4 } from "uuid";
import React, { useEffect, useState } from 'react';
import { Typography, CircularProgress, TextField, Button, Chip, Box, DialogContent } from '@mui/material';
import { setDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase-config.js';
import { useAuth } from './auth/AuthProvider';
import { useUsernameForUid } from './users/usernames';
import { useNavigate } from 'react-router-dom';
import AppDialog from './AppDialog.tsx';
import ImageDropzone from './ImageDropzone.tsx';
import { uploadPatternImage } from './uploadImage.ts';
import { useT } from './i18n/LanguageProvider';
import { buildCopiedFrom, saveAmigurumiCopy } from './copyAmigurumi.ts';

// Dient als "nieuw patroon aanmaken" (navigeert na opslaan naar de editor),
// "patroon-details bewerken" (via editingAmigurumi, blijft in de details-dialoog) én
// "kopie maken van andermans ontwerp" (via copySource: velden voorgevuld, vormen en garen
// worden mee gekopieerd) — zelfde velden/opslaanlogica, dus één formulier.
const NewPattern = ({
    open,
    onClose,
    setDroppedShapes,
    editingAmigurumi,
    copySource,
    onSaved,
}: {
    open: boolean;
    onClose: () => void;
    setDroppedShapes?: React.Dispatch<React.SetStateAction<Shape[]>>;
    editingAmigurumi?: Amigurumi | null;
    copySource?: Amigurumi | null;
    onSaved?: (updated: Amigurumi) => void;
}) => {
    const navigate = useNavigate();
    const t = useT();
    const loggedInUser = useAuth().user?.uid;
    // Eigenaar van het origineel als gebruikersnaam.
    const copySourceUsername = useUsernameForUid(copySource?.user_id);
    const isEditing = !!editingAmigurumi;
    const isCopying = !isEditing && !!copySource;

    const [formData, setFormData] = useState({
        name: '',
        height: '',
        tags: [] as string[],
        yarn_id: '',
        notes: '',
    });
    const [tagInput, setTagInput] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    // Sleutel van de foutmelding (of ''), zodat hij meevertaalt bij een taalwissel.
    const [error, setError] = useState('');

    useEffect(() => {
        if (open) {
            const prefill = editingAmigurumi ?? copySource;
            setFormData({
                name: isCopying ? t('newPattern.copyName', { name: copySource!.name }) : prefill?.name ?? '',
                height: prefill?.height ? String(prefill.height) : '',
                tags: prefill?.tags ?? [],
                yarn_id: editingAmigurumi?.yarn_id ?? '',
                notes: prefill?.notes ?? '',
            });
            setTagInput('');
            setImageFile(null);
            setError('');
        }
    }, [open, editingAmigurumi, copySource]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'height' ? (value === '' ? '' : Number(value)) : value,
        }));
    };

    const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTagInput(e.target.value);
    };

    const handleAddTag = () => {
        if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
            setFormData((prev) => ({
                ...prev,
                tags: [...prev.tags, tagInput.trim()],
            }));
            setTagInput('');
        }
    };

    const handleDeleteTag = (tagToDelete: string) => {
        setFormData((prev) => ({
            ...prev,
            tags: prev.tags.filter((tag) => tag !== tagToDelete),
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!loggedInUser) {
            setError('newPattern.error.loginRequired');
            return;
        }
        if (!formData.name.trim()) {
            setError('newPattern.error.nameRequired');
            return;
        }

        setLoading(true);
        setError('');

        try {
            let imageUrl = (editingAmigurumi ?? copySource)?.imageUrl ?? null;
            if (imageFile) {
                imageUrl = await uploadPatternImage(imageFile);
            }

            if (isEditing && editingAmigurumi) {
                const updatedFields = {
                    name: formData.name.trim(),
                    height: formData.height ? Number(formData.height) : null,
                    tags: formData.tags,
                    yarn_id: formData.yarn_id.trim() || null,
                    notes: formData.notes.trim() || null,
                    imageUrl,
                };
                await updateDoc(doc(db, 'amigurumi', editingAmigurumi.id), updatedFields);
                onSaved?.({ ...editingAmigurumi, ...updatedFields });
                onClose();
            } else {
                const amigurumiId = uuidv4(); // Generate UUID for amigurumi
                const amigurumiData: Amigurumi = {
                    id: amigurumiId,
                    name: formData.name.trim(),
                    height: formData.height ? Number(formData.height) : null,
                    tags: formData.tags,
                    yarn_id: formData.yarn_id.trim() || null,
                    user_id: loggedInUser,
                    createdAt: serverTimestamp(),
                    notes: formData.notes.trim() || null,
                    imageUrl,
                };

                if (isCopying && copySource) {
                    const copy = await saveAmigurumiCopy(copySource, {
                        ...amigurumiData,
                        copiedFrom: buildCopiedFrom(copySource),
                        copiedFromId: copySource.id,
                    });
                    setDroppedShapes?.(copy.shapes);
                    onClose();
                    navigate(`/${amigurumiId}/editor`, {
                        state: { amigurumi: copy.amigurumi, shapes: copy.shapes, yarn: copy.yarn },
                    });
                    return;
                }

                // Save to Firestore with the UUID as the document ID
                await setDoc(doc(db, 'amigurumi', amigurumiId), amigurumiData);
                console.log('Saved amigurumi:', amigurumiData);

                // Clear droppedShapes
                setDroppedShapes?.([]);

                onClose();

                // Navigate to Editor with amigurumi and empty shapes
                navigate(`/${amigurumiId}/editor`, {
                    state: {
                        amigurumi: amigurumiData,
                        shapes: [],
                    },
                });
            }
        } catch (err) {
            console.error('Fout bij het opslaan van patroon:', err);
            setError('newPattern.error.saveFailed');
        } finally {
            setLoading(false);
        }
    };

    const previewSrc = imageFile
        ? URL.createObjectURL(imageFile)
        : (editingAmigurumi ?? copySource)?.imageUrl ?? null;

    return (
        <AppDialog open={open} onClose={onClose} maxWidth="sm">
            <DialogContent sx={{ padding: 4 }}>
                {!loggedInUser ? (
                    <Typography>{t('newPattern.loginRequired')}</Typography>
                ) : (
                    <>
                        <Typography variant="h4" gutterBottom sx={{ pr: 4 }}>
                            {isEditing ? t('newPattern.editTitle') : isCopying ? t('newPattern.copyTitle') : t('newPattern.title')}
                        </Typography>
                        {isCopying && (
                            <Typography sx={{ mb: 1, color: 'var(--color-text)' }}>
                                {t('newPattern.copyInfo', { name: copySource!.name, user: copySourceUsername ? `@${copySourceUsername}` : t('detail.unknown') })}
                            </Typography>
                        )}
                        <form onSubmit={handleSubmit}>
                            <TextField
                                label={t('newPattern.name')}
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                fullWidth
                                margin="normal"
                                required
                            />
                            <Box sx={{ display: 'flex', alignItems: 'stretch', margin: '16px 0' }}>
                                <TextField
                                    label={t('newPattern.tag')}
                                    value={tagInput}
                                    onChange={handleTagInputChange}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                                    fullWidth
                                />
                                <Button
                                    onClick={handleAddTag}
                                    variant="contained"
                                    sx={{ ml: 1, backgroundColor: "var(--color-primary)", color: "var(--color-bg)" }}
                                    disabled={!tagInput.trim()}
                                >
                                    {t('newPattern.addTag')}
                                </Button>
                            </Box>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                                {formData.tags.map((tag) => (
                                    <Chip
                                        key={tag}
                                        label={tag}
                                        onDelete={() => handleDeleteTag(tag)}
                                        sx={{ backgroundColor: 'var(--color-accent-soft)', color: 'var(--color-text)' }}
                                    />
                                ))}
                            </Box>
                            <TextField
                                label={t('newPattern.notes')}
                                name="notes"
                                value={formData.notes}
                                onChange={handleInputChange}
                                fullWidth
                                multiline
                                minRows={3}
                                margin="normal"
                                placeholder={t('newPattern.notesPlaceholder')}
                            />
                            <ImageDropzone previewSrc={previewSrc} onFileSelected={setImageFile} />
                            {error && (
                                <Typography color="error" sx={{ mt: 2 }}>
                                    {t(error)}
                                </Typography>
                            )}
                            <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                sx={{ width: 1, backgroundColor: "var(--color-primary)", color: "var(--color-bg)", paddingY: 2 }}
                                disabled={loading}
                            >
                                {loading ? <CircularProgress size={24} /> : t('newPattern.save')}
                            </Button>
                        </form>
                    </>
                )}
            </DialogContent>
        </AppDialog>
    );
};

export default NewPattern;
