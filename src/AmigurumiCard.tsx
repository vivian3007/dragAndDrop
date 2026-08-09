import React from 'react';
import { Box, Button, Card, Chip } from '@mui/material';
import { Favorite, FavoriteBorder, Delete } from '@mui/icons-material';

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
}: {
    amigurumi: Amigurumi;
    onFavoriteChange: (amigurumi: Amigurumi) => void;
    onPatternClick: (amigurumi: Amigurumi) => void;
    onEditClick?: (amigurumi: Amigurumi) => void;
    onDeleteClick?: (amigurumi: Amigurumi) => void;
}) => {
    const favoriteIcon = amigurumi.favorite ? (
        <Favorite
            sx={{color: 'red', fontSize: '2.5rem', cursor: 'pointer', height: "2.5rem"}}
            onClick={() => onFavoriteChange(amigurumi)}
        />
    ) : (
        <FavoriteBorder
            sx={{color: 'grey', fontSize: '2.5rem', cursor: 'pointer'}}
            onClick={() => onFavoriteChange(amigurumi)}
        />
    );

    return (
        <Card className="my-pattern-text-container">
            <img src={getImageForId(amigurumi.id)} alt={amigurumi.name} className="amigurumi-image"/>
            <h1 style={{marginTop: 20, marginBottom: 20}}>{amigurumi.name}</h1>
            <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2}}>
                {amigurumi.tags.map((tag) => (
                    <Chip
                        key={tag}
                        label={tag}
                        color="inherit"
                    />
                ))}
            </Box>
            {onEditClick ? (
                <div style={{
                    display: 'flex',
                    gap: '5px',
                    marginTop: 20,
                    flexWrap: "wrap",
                    width: "100%",
                    justifyContent: "space-between"
                }}>
                    <div style={{display: "flex", gap: "5px", width: "65%"}}>
                        <Button
                            type="button"
                            variant="contained"
                            color="inherit"
                            sx={{ width: 1, backgroundColor: "#d4929a"}}
                            onClick={() => onEditClick(amigurumi)}
                        >
                            Edit
                        </Button>
                        <Button
                            type="button"
                            variant="contained"
                            color="inherit"
                            sx={{ width: 1, backgroundColor: "#d4929a"}}
                            onClick={() => onPatternClick(amigurumi)}
                        >
                            Pattern
                        </Button>
                    </div>
                    <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                        {favoriteIcon}
                        <Delete
                            sx={{color: 'grey', fontSize: '2.5rem', cursor: 'pointer'}}
                            onClick={() => onDeleteClick?.(amigurumi)}
                            titleAccess="Verwijder patroon"
                        />
                    </div>
                </div>
            ) : (
                <div style={{
                    display: 'flex',
                    gap: '15px',
                    marginTop: 20,
                    flexWrap: "wrap",
                    width: "100%",
                    justifyContent: "space-between"
                }}>
                    <Button
                        type="button"
                        variant="contained"
                        color="inherit"
                        sx={{marginBottom: "20px", width: 0.8, backgroundColor: "#d4929a"}}
                        onClick={() => onPatternClick(amigurumi)}
                    >
                        Pattern
                    </Button>
                    {favoriteIcon}
                </div>
            )}
        </Card>
    );
};

const arePropsEqual = (
    prev: { amigurumi: Amigurumi; onFavoriteChange: unknown; onPatternClick: unknown; onEditClick: unknown; onDeleteClick: unknown },
    next: { amigurumi: Amigurumi; onFavoriteChange: unknown; onPatternClick: unknown; onEditClick: unknown; onDeleteClick: unknown }
) =>
    prev.amigurumi.id === next.amigurumi.id &&
    prev.amigurumi.name === next.amigurumi.name &&
    prev.amigurumi.favorite === next.amigurumi.favorite &&
    prev.amigurumi.tags.length === next.amigurumi.tags.length &&
    prev.amigurumi.tags.every((tag, i) => tag === next.amigurumi.tags[i]) &&
    prev.onFavoriteChange === next.onFavoriteChange &&
    prev.onPatternClick === next.onPatternClick &&
    prev.onEditClick === next.onEditClick &&
    prev.onDeleteClick === next.onDeleteClick;

export default React.memo(AmigurumiCard, arePropsEqual);
