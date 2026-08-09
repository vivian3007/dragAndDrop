import { v4 as uuidv4 } from "uuid";
import React, { useEffect, useState } from 'react';
import { Typography, CircularProgress, TextField, Button, Chip, Box, DialogContent } from '@mui/material';
import { setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase-config.js';
import { useNavigate } from 'react-router-dom';
import AppDialog from './AppDialog.tsx';

const NewPattern = ({
    open,
    onClose,
    setDroppedShapes,
}: {
    open: boolean;
    onClose: () => void;
    setDroppedShapes: React.Dispatch<React.SetStateAction<Shape[]>>;
}) => {
    const navigate = useNavigate();
    const loggedInUser = auth.currentUser?.email;

    const [formData, setFormData] = useState({
        name: '',
        height: '',
        tags: [] as string[],
        favorite: false,
        yarn_id: '',
    });
    const [tagInput, setTagInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (open) {
            setFormData({ name: '', height: '', tags: [], favorite: false, yarn_id: '' });
            setTagInput('');
            setError('');
        }
    }, [open]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'height' ? (value === '' ? '' : Number(value)) : value,
        }));
    };

    // const handleFavoriteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    //     setFormData((prev) => ({
    //         ...prev,
    //         favorite: e.target.checked,
    //     }));
    // };

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
            setError('Je moet ingelogd zijn om een patroon aan te maken.');
            return;
        }
        if (!formData.name.trim()) {
            setError('Naam is verplicht.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const amigurumiId = uuidv4(); // Generate UUID for amigurumi
            const amigurumiData: Amigurumi = {
                id: amigurumiId,
                name: formData.name.trim(),
                height: formData.height ? Number(formData.height) : null,
                tags: formData.tags,
                favorite: formData.favorite,
                yarn_id: formData.yarn_id.trim() || null,
                user_id: loggedInUser,
                createdAt: serverTimestamp(),
            };

            // Save to Firestore with the UUID as the document ID
            await setDoc(doc(db, 'amigurumi', amigurumiId), amigurumiData);
            console.log('Saved amigurumi:', amigurumiData);

            // Clear droppedShapes
            setDroppedShapes([]);

            onClose();

            // Navigate to Editor with amigurumi and empty shapes
            navigate(`/${amigurumiId}/editor`, {
                state: {
                    amigurumi: amigurumiData,
                    shapes: [],
                },
            });
        } catch (err) {
            console.error('Fout bij het opslaan van patroon:', err);
            setError('Kon het patroon niet opslaan. Probeer opnieuw.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppDialog open={open} onClose={onClose} maxWidth="sm">
            <DialogContent sx={{ padding: 4 }}>
                {!loggedInUser ? (
                    <Typography>Log in om een nieuw patroon aan te maken.</Typography>
                ) : (
                    <>
                        <Typography variant="h4" gutterBottom sx={{ pr: 4 }}>
                            New amigurumi pattern
                        </Typography>
                        <form onSubmit={handleSubmit}>
                            <TextField
                                label="Name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                fullWidth
                                margin="normal"
                                required
                            />
                            <Box sx={{ display: 'flex', alignItems: 'center', margin: '16px 0' }}>
                                <TextField
                                    label="Tag"
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
                                    Add
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
                            {error && (
                                <Typography color="error" sx={{ mt: 2 }}>
                                    {error}
                                </Typography>
                            )}
                            <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                sx={{ marginBottom: "20px", width: 1, backgroundColor: "var(--color-primary)", color: "var(--color-bg)" }}
                                disabled={loading}
                            >
                                {loading ? <CircularProgress size={24} /> : 'Save'}
                            </Button>
                        </form>
                    </>
                )}
            </DialogContent>
        </AppDialog>
    );
};

export default NewPattern;