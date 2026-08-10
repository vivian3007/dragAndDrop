import React from 'react';
import { Autocomplete, Box, Chip, MenuItem, TextField } from '@mui/material';
import { SortOption } from './filterAmigurumis';

const sortLabels: Record<SortOption, string> = {
    newest: 'Nieuwste eerst',
    oldest: 'Oudste eerst',
    favorite: 'Favorieten eerst',
    name: 'Naam (A-Z)',
};

const PatternFilters = ({
    searchTerm,
    onSearchChange,
    availableTags,
    selectedTags,
    onTagsChange,
    sortBy,
    onSortChange,
    actions,
}: {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    availableTags: string[];
    selectedTags: string[];
    onTagsChange: (tags: string[]) => void;
    sortBy: SortOption;
    onSortChange: (sort: SortOption) => void;
    actions?: React.ReactNode;
}) => {
    const fieldSx = {
        minWidth: 220,
        '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
            backgroundColor: 'var(--color-bg)',
            '& fieldset': { borderColor: 'var(--color-secondary)', borderWidth: '2px' },
            '&:hover fieldset': { borderColor: 'var(--color-secondary-hover)' },
            '&.Mui-focused fieldset': { borderColor: 'var(--color-primary)', borderWidth: '2px' },
        },
        '& .MuiInputLabel-root.Mui-focused': { color: 'var(--color-primary)' },
    };

    return (
        <Box
            sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 2,
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 3,
                mx: '40px',
                p: 2.5,
                boxSizing: 'border-box',
                backgroundColor: 'var(--color-bg-card)',
                borderRadius: '18px',
                boxShadow: '0 4px 14px rgba(var(--shadow-color), 0.12)',
            }}
        >
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-start', flex: 1 }}>
                <TextField
                    label="Zoek op naam"
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    size="small"
                    sx={fieldSx}
                />
                <Autocomplete
                    multiple
                    size="small"
                    options={availableTags}
                    value={selectedTags}
                    onChange={(_, value) => onTagsChange(value)}
                    sx={{ ...fieldSx, minWidth: 260, flex: 1, maxWidth: 420 }}
                    renderTags={(value, getTagProps) =>
                        value.map((tag, index) => (
                            <Chip
                                label={tag}
                                size="small"
                                sx={{ backgroundColor: 'var(--color-accent-soft)', color: 'var(--color-text)' }}
                                {...getTagProps({ index })}
                                key={tag}
                            />
                        ))
                    }
                    renderInput={(params) => <TextField {...params} label="Filter op tags" />}
                />
                <TextField
                    select
                    label="Sorteren op"
                    value={sortBy}
                    onChange={(e) => onSortChange(e.target.value as SortOption)}
                    size="small"
                    sx={{ ...fieldSx, minWidth: 200 }}
                >
                    {Object.entries(sortLabels).map(([value, label]) => (
                        <MenuItem key={value} value={value}>{label}</MenuItem>
                    ))}
                </TextField>
            </Box>
            {actions && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {actions}
                </Box>
            )}
        </Box>
    );
};

export default React.memo(PatternFilters);
