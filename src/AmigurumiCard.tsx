import React from 'react';
import { Box, Button, Card, Chip, IconButton } from '@mui/material';
import { Favorite, FavoriteBorder, Delete, Edit } from '@mui/icons-material';

const ACTION_HEIGHT = 40;

const actionIconButtonSx = {
    backgroundColor: '#F2F3AE',
    '&:hover': { backgroundColor: '#e6e888' },
    width: ACTION_HEIGHT,
    height: ACTION_HEIGHT,
};

const src = [
    "duck",
    "cow",
    "cat",
    "dog",
    "bunny"
];

export const getImageForId = (id: string) => {
    const hash = Array.from(id).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return `../public/img/${src[hash % src.length]}.jpg`;
};

const AmigurumiCard = ({
    amigurumi,
    onFavoriteChange,
    onPatternClick,
    onEditClick,
    onDeleteClick,
    onCardClick,
}: {
    amigurumi: Amigurumi;
    onFavoriteChange: (amigurumi: Amigurumi) => void;
    onPatternClick: (amigurumi: Amigurumi) => void;
    onEditClick?: (amigurumi: Amigurumi) => void;
    onDeleteClick?: (amigurumi: Amigurumi) => void;
    onCardClick?: (amigurumi: Amigurumi) => void;
}) => {
    return (
        <Card className="my-pattern-text-container" onClick={() => onCardClick?.(amigurumi)}>
            <img src={getImageForId(amigurumi.id)} alt={amigurumi.name} className="amigurumi-image"/>
            <h1 style={{marginTop: 20, marginBottom: 20}}>{amigurumi.name}</h1>
            <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2}}>
                {amigurumi.tags.map((tag) => (
                    <Chip
                        key={tag}
                        label={tag}
                        color="inherit"
                        size="small"
                    />
                ))}
            </Box>
            <Box sx={{display: 'flex', alignItems: 'center', gap: 1, marginTop: '20px'}}>
                <Button
                    type="button"
                    variant="contained"
                    color="inherit"
                    sx={{flex: 1, backgroundColor: "#d4929a", height: ACTION_HEIGHT}}
                    onClick={(e) => { e.stopPropagation(); onPatternClick(amigurumi); }}
                >
                    Pattern
                </Button>
                {onEditClick && (
                    <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); onEditClick(amigurumi); }}
                        sx={actionIconButtonSx}
                        title="Bewerk patroon"
                    >
                        <Edit sx={{color: 'grey', fontSize: '1.25rem'}} />
                    </IconButton>
                )}
                <IconButton
                    size="small"
                    onClick={(e) => { e.stopPropagation(); onFavoriteChange(amigurumi); }}
                    sx={actionIconButtonSx}
                >
                    {amigurumi.favorite ? (
                        <Favorite sx={{color: 'red', fontSize: '1.25rem'}} />
                    ) : (
                        <FavoriteBorder sx={{color: 'grey', fontSize: '1.25rem'}} />
                    )}
                </IconButton>
                {onDeleteClick && (
                    <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); onDeleteClick(amigurumi); }}
                        sx={actionIconButtonSx}
                        title="Verwijder patroon"
                    >
                        <Delete sx={{color: 'grey', fontSize: '1.25rem'}} />
                    </IconButton>
                )}
            </Box>
        </Card>
    );
};

const arePropsEqual = (
    prev: { amigurumi: Amigurumi; onFavoriteChange: unknown; onPatternClick: unknown; onEditClick: unknown; onDeleteClick: unknown; onCardClick: unknown },
    next: { amigurumi: Amigurumi; onFavoriteChange: unknown; onPatternClick: unknown; onEditClick: unknown; onDeleteClick: unknown; onCardClick: unknown }
) =>
    prev.amigurumi.id === next.amigurumi.id &&
    prev.amigurumi.name === next.amigurumi.name &&
    prev.amigurumi.favorite === next.amigurumi.favorite &&
    prev.amigurumi.tags.length === next.amigurumi.tags.length &&
    prev.amigurumi.tags.every((tag, i) => tag === next.amigurumi.tags[i]) &&
    prev.onFavoriteChange === next.onFavoriteChange &&
    prev.onPatternClick === next.onPatternClick &&
    prev.onEditClick === next.onEditClick &&
    prev.onDeleteClick === next.onDeleteClick &&
    prev.onCardClick === next.onCardClick;

export default React.memo(AmigurumiCard, arePropsEqual);
