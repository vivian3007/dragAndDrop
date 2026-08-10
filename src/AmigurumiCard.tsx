import React, { useCallback, useRef, useState } from 'react';
import { Box, Button, Card, Chip, IconButton } from '@mui/material';
import { Favorite, FavoriteBorder, Delete, Edit } from '@mui/icons-material';
import { useStableArray } from './useStableArray.ts';

const ACTION_HEIGHT = 40;

const actionIconButtonSx = {
    backgroundColor: 'var(--color-accent-soft)',
    '&:hover': { backgroundColor: 'var(--color-accent-soft-hover)' },
    width: ACTION_HEIGHT,
    height: ACTION_HEIGHT,
};

const tagChipSx = {
    backgroundColor: 'var(--color-accent-soft)',
    color: 'var(--color-text)',
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

type AmigurumiCardMediaProps = {
    id: string;
    name: string;
    tags: string[];
};

const areMediaPropsEqual = (prev: AmigurumiCardMediaProps, next: AmigurumiCardMediaProps) =>
    prev.id === next.id &&
    prev.name === next.name &&
    prev.tags === next.tags;

// Does not depend on `favorite`, so it stays out of the re-render caused by toggling the heart.
const AmigurumiCardMedia = React.memo(({ id, name, tags }: AmigurumiCardMediaProps) => (
    <>
        <img src={getImageForId(id)} alt={name} className="amigurumi-image"/>
        <h1 style={{marginTop: 20, marginBottom: 20}}>{name}</h1>
        <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2}}>
            {tags.map((tag) => (
                <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    sx={tagChipSx}
                />
            ))}
        </Box>
    </>
), areMediaPropsEqual);

type AmigurumiCardButtonsProps = {
    onPatternClick: (e: React.MouseEvent) => void;
    onEditClick?: (e: React.MouseEvent) => void;
    onDeleteClick?: (e: React.MouseEvent) => void;
};

const areButtonsPropsEqual = (prev: AmigurumiCardButtonsProps, next: AmigurumiCardButtonsProps) =>
    prev.onPatternClick === next.onPatternClick &&
    prev.onEditClick === next.onEditClick &&
    prev.onDeleteClick === next.onDeleteClick;

// Rendered as a Fragment (no wrapping element) so it can live inside the same flex row as the
// heart button below, while still being skippable on its own when only `favorite` changes.
const AmigurumiCardButtons = React.memo(({ onPatternClick, onEditClick, onDeleteClick }: AmigurumiCardButtonsProps) => (
    <>
        <Button
            type="button"
            variant="contained"
            color="inherit"
            sx={{flex: 1, backgroundColor: "var(--color-primary)", color: "var(--color-bg)", height: ACTION_HEIGHT}}
            onClick={onPatternClick}
        >
            Pattern
        </Button>
        {onEditClick && (
            <IconButton
                size="small"
                onClick={onEditClick}
                sx={actionIconButtonSx}
                title="Bewerk patroon"
            >
                <Edit sx={{color: 'var(--color-text)', fontSize: '1.25rem'}} />
            </IconButton>
        )}
        {onDeleteClick && (
            <IconButton
                size="small"
                onClick={onDeleteClick}
                sx={actionIconButtonSx}
                title="Verwijder patroon"
            >
                <Delete sx={{color: 'var(--color-text)', fontSize: '1.25rem'}} />
            </IconButton>
        )}
    </>
), areButtonsPropsEqual);

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
    const [isHeartBouncing, setIsHeartBouncing] = useState(false);

    // Keeps handlers below referentially stable across renders (e.g. when only `favorite` changes)
    // even though `amigurumi` itself is a fresh object on every Firestore snapshot.
    const amigurumiRef = useRef(amigurumi);
    amigurumiRef.current = amigurumi;

    const stableTags = useStableArray(amigurumi.tags);

    const handleCardClick = useCallback(() => {
        onCardClick?.(amigurumiRef.current);
    }, [onCardClick]);

    const handlePatternClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onPatternClick(amigurumiRef.current);
    }, [onPatternClick]);

    const handleEditClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onEditClick?.(amigurumiRef.current);
    }, [onEditClick]);

    const handleDeleteClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onDeleteClick?.(amigurumiRef.current);
    }, [onDeleteClick]);

    const handleFavoriteClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setIsHeartBouncing(true);
        onFavoriteChange(amigurumiRef.current);
    }, [onFavoriteChange]);

    return (
        <Card className="my-pattern-text-container" onClick={handleCardClick}>
            <AmigurumiCardMedia
                id={amigurumi.id}
                name={amigurumi.name}
                tags={stableTags}
            />
            <Box sx={{display: 'flex', alignItems: 'center', gap: 1, marginTop: '20px'}}>
                <AmigurumiCardButtons
                    onPatternClick={handlePatternClick}
                    onEditClick={onEditClick ? handleEditClick : undefined}
                    onDeleteClick={onDeleteClick ? handleDeleteClick : undefined}
                />
                <IconButton
                    size="small"
                    onClick={handleFavoriteClick}
                    sx={actionIconButtonSx}
                >
                    {amigurumi.favorite ? (
                        <Favorite
                            className={isHeartBouncing ? 'heart-bounce' : ''}
                            onAnimationEnd={() => setIsHeartBouncing(false)}
                            sx={{color: 'var(--color-favorite)', fontSize: '1.25rem'}}
                        />
                    ) : (
                        <FavoriteBorder
                            className={isHeartBouncing ? 'heart-bounce' : ''}
                            onAnimationEnd={() => setIsHeartBouncing(false)}
                            sx={{color: 'var(--color-text)', fontSize: '1.25rem'}}
                        />
                    )}
                </IconButton>
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
