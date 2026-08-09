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
    return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between', mb: 3, px: '40px', boxSizing: 'border-box', width: '100%' }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-start', flex: 1 }}>
                <TextField
                    label="Zoek op naam"
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    size="small"
                    sx={{ minWidth: 220, backgroundColor: 'white' }}
                />
                <Autocomplete
                    multiple
                    size="small"
                    options={availableTags}
                    value={selectedTags}
                    onChange={(_, value) => onTagsChange(value)}
                    sx={{ minWidth: 260, flex: 1, maxWidth: 420, backgroundColor: 'white' }}
                    renderTags={(value, getTagProps) =>
                        value.map((tag, index) => (
                            <Chip label={tag} size="small" {...getTagProps({ index })} key={tag} />
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
                    sx={{ minWidth: 200, backgroundColor: 'white' }}
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

export default PatternFilters;
