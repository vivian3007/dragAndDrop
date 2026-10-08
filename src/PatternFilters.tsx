import React from 'react';
import { Autocomplete, Box, Chip, MenuItem, TextField } from '@mui/material';
import { SortOption } from './filterAmigurumis';
import { useT } from './i18n/LanguageProvider';

const sortLabelIds: Record<SortOption, string> = {
    newest: 'filters.sort.newest',
    oldest: 'filters.sort.oldest',
    popular: 'filters.sort.popular',
    favorite: 'filters.sort.favorite',
    name: 'filters.sort.name',
};

const PatternFilters = ({
    searchTerm,
    onSearchChange,
    availableTags,
    selectedTags,
    onTagsChange,
    sortBy,
    onSortChange,
    sortOptions,
    freeSoloTags = false,
    actions,
}: {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    availableTags: string[];
    selectedTags: string[];
    onTagsChange: (tags: string[]) => void;
    sortBy: SortOption;
    onSortChange: (sort: SortOption) => void;
    // Welke sorteringen te kiezen zijn (standaard alle).
    sortOptions?: SortOption[];
    // Ook tags toestaan die niet in de lijst staan (als niet alle tags bekend zijn).
    freeSoloTags?: boolean;
    actions?: React.ReactNode;
}) => {
    const hasActions = Boolean(actions);
    const t = useT();

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

    // Drie duidelijk verschillende indelingen per breakpoint, via CSS grid-areas (geen losse
    // wrapper-Boxen nodig, dus geen kans op dubbel-gemonteerde inputs):
    // - xs: zoekbalk groot bovenaan (volle breedte), tags+sorteren eronder 50/50, knop onderaan.
    // - sm: zoekbalk naast de knop op de eerste rij, tags+sorteren eronder 50/50 — alles breed.
    // - md+: één rij met vaste kolommen: zoeken vult de ruimte links, tags en sorteren hebben
    //   een vaste breedte rechts, de knop (als die er is) komt daarachter. Voorheen een flex-rij
    //   met space-between, waardoor het tagfilter per pagina ergens anders terechtkwam
    //   afhankelijk van of er een knop was.
    const gridTemplateAreasXs = hasActions
        ? '"search search" "tags sort" "actions actions"'
        : '"search search" "tags sort"';
    const gridTemplateAreasSm = hasActions
        ? '"search actions" "tags sort"'
        : '"search search" "tags sort"';

    return (
        <Box
            sx={{
                display: 'grid',
                gridTemplateColumns: {
                    xs: '1fr 1fr',
                    sm: hasActions ? '1fr auto' : '1fr 1fr',
                    md: hasActions ? 'minmax(220px, 1fr) 300px 200px auto' : 'minmax(220px, 1fr) 300px 200px',
                },
                gridTemplateAreas: {
                    xs: gridTemplateAreasXs,
                    sm: gridTemplateAreasSm,
                    md: hasActions ? '"search tags sort actions"' : '"search tags sort"',
                },
                alignItems: { xs: 'stretch', sm: 'stretch', md: 'center' },
                gap: { xs: 1.5, sm: 2, md: 2 },
                mb: 3,
                mx: { xs: '8px', sm: '24px', md: '40px' },
                p: { xs: 1, sm: 2, md: 2.5 },
                boxSizing: 'border-box',
                backgroundColor: 'var(--color-bg-card)',
                borderRadius: '18px',
                boxShadow: '0 4px 14px rgba(var(--shadow-color), 0.12)',
            }}
        >
            <TextField
                label={t('filters.search')}
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                size="small"
                sx={{
                    ...fieldSx,
                    gridArea: 'search',
                    width: '100%',
                    maxWidth: { md: 520 },
                    '& .MuiOutlinedInput-input': { fontSize: { xs: '1.1rem', sm: '1rem', md: '0.95rem' } },
                    '& .MuiOutlinedInput-root': { ...fieldSx['& .MuiOutlinedInput-root'], height: { xs: 52, sm: 52, md: 'auto' } },
                }}
            />
            <Autocomplete
                multiple
                freeSolo={freeSoloTags}
                size="small"
                options={availableTags}
                value={selectedTags}
                onChange={(_, value) => onTagsChange(value)}
                sx={{
                    ...fieldSx,
                    gridArea: 'tags',
                    minWidth: 0,
                    width: '100%',
                }}
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
                renderInput={(params) => <TextField {...params} label={t('filters.tags')} />}
                noOptionsText={t('filters.noTags')}
            />
            <TextField
                select
                label={t('filters.sortBy')}
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value as SortOption)}
                size="small"
                sx={{ ...fieldSx, gridArea: 'sort', minWidth: 0, width: '100%' }}
            >
                {(sortOptions ?? (Object.keys(sortLabelIds) as SortOption[])).map((value) => (
                    <MenuItem key={value} value={value}>{t(sortLabelIds[value])}</MenuItem>
                ))}
            </TextField>
            {actions && (
                <Box sx={{ gridArea: 'actions', display: 'flex', alignItems: 'center', justifyContent: { xs: 'stretch', sm: 'flex-start', md: 'flex-end' } }}>
                    {actions}
                </Box>
            )}
        </Box>
    );
};

export default React.memo(PatternFilters);
