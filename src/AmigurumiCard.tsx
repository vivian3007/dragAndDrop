import React, { useCallback, useRef, useState } from 'react';
import { Box, Button, Card, Chip, IconButton } from '@mui/material';
import { Favorite, FavoriteBorder } from '@mui/icons-material';
import { useStableArray } from './useStableArray.ts';
import DesignSnapshot from './DesignSnapshot.tsx';
import { sizedImageUrl } from './uploadImage.ts';
import { useT } from './i18n/LanguageProvider';
import { useFavorites } from './favorites/FavoritesProvider';

const ACTION_HEIGHT = 40;

// Kaarten zijn hooguit ~300px breed; 600px is scherp op een retina-scherm.
export const CARD_IMAGE_WIDTH = 600;

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

type AmigurumiCardMediaProps = {
    id: string;
    name: string;
    tags: string[];
    imageUrl?: string | null;
};

const areMediaPropsEqual = (prev: AmigurumiCardMediaProps, next: AmigurumiCardMediaProps) =>
    prev.id === next.id &&
    prev.name === next.name &&
    prev.tags === next.tags &&
    prev.imageUrl === next.imageUrl;

// Does not depend on `favorite`, so it stays out of the re-render caused by toggling the heart.
const AmigurumiCardMedia = React.memo(({ id, name, tags, imageUrl }: AmigurumiCardMediaProps) => (
    <>
        {imageUrl ? (
            <img src={sizedImageUrl(imageUrl, CARD_IMAGE_WIDTH)} alt={name} className="amigurumi-image" loading="lazy" decoding="async" />
        ) : (
            <DesignSnapshot amigurumiId={id} alt={name} className="amigurumi-image" />
        )}
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
};

const areButtonsPropsEqual = (prev: AmigurumiCardButtonsProps, next: AmigurumiCardButtonsProps) =>
    prev.onPatternClick === next.onPatternClick;

// Rendered as a Fragment (no wrapping element) so it can live inside the same flex row as the
// heart button below, while still being skippable on its own when only `favorite` changes.
// Verwijderen staat bewust niet op de kaart (te makkelijk per ongeluk, naast het hartje);
// dat zit in het bewerk-menu van de detailweergave.
export const AmigurumiCardButtons = React.memo(({ onPatternClick }: AmigurumiCardButtonsProps) => {
    const t = useT();
    return (
    <>
        <Button
            type="button"
            variant="contained"
            color="inherit"
            sx={{flex: 1, backgroundColor: "var(--color-primary)", color: "var(--color-bg)", height: ACTION_HEIGHT}}
            onClick={onPatternClick}
        >
            {t('card.pattern')}
        </Button>
    </>
    );
}, areButtonsPropsEqual);

// Hartje met stuiter-animatie; ook gebruikt op de kaarten van gemaakte amigurumi (Makes.tsx).
// Leest en zet zelf je persoonlijke favoriet, zodat alleen dit knopje opnieuw rendert als
// je favorieten veranderen — niet de hele kaart.
export const FavoriteButton = ({ amigurumiId, count = 0 }: { amigurumiId: string; count?: number }) => {
    const [isHeartBouncing, setIsHeartBouncing] = useState(false);
    const { favoriteIds, toggleFavorite } = useFavorites();
    const favorite = favoriteIds.has(amigurumiId);
    const t = useT();
    const iconProps = {
        className: isHeartBouncing ? 'heart-bounce' : '',
        onAnimationEnd: () => setIsHeartBouncing(false),
    };
    return (
        <IconButton
            size="small"
            onClick={(e) => {
                e.stopPropagation();
                setIsHeartBouncing(true);
                toggleFavorite(amigurumiId, count);
            }}
            aria-label={t(favorite ? 'card.unfavorite' : 'card.favorite')}
            aria-pressed={favorite}
            title={t('card.favoriteCount', { count })}
            sx={{ ...actionIconButtonSx, ...(count > 0 ? { width: 'auto', minWidth: ACTION_HEIGHT, px: 1.25, borderRadius: `${ACTION_HEIGHT / 2}px`, gap: 0.5 } : {}) }}
        >
            {favorite ? (
                <Favorite {...iconProps} sx={{color: 'var(--color-favorite)', fontSize: '1.25rem'}} />
            ) : (
                <FavoriteBorder {...iconProps} sx={{color: 'var(--color-text)', fontSize: '1.25rem'}} />
            )}
            {count > 0 && <span className="favorite-count">{count}</span>}
        </IconButton>
    );
};

const AmigurumiCard = ({
    amigurumi,
    onPatternClick,
    onCardClick,
}: {
    amigurumi: Amigurumi;
    onPatternClick: (amigurumi: Amigurumi) => void;
    onCardClick?: (amigurumi: Amigurumi) => void;
}) => {
    // Keeps handlers below referentially stable across renders even though `amigurumi` itself is a fresh object on every Firestore snapshot.
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

    return (
        <Card className="my-pattern-text-container" onClick={handleCardClick}>
            <AmigurumiCardMedia
                id={amigurumi.id}
                name={amigurumi.name}
                tags={stableTags}
                imageUrl={amigurumi.imageUrl}
            />
            <Box sx={{display: 'flex', alignItems: 'center', gap: 1, marginTop: '20px'}}>
                <AmigurumiCardButtons onPatternClick={handlePatternClick} />
                <FavoriteButton amigurumiId={amigurumi.id} count={amigurumi.favoriteCount} />
            </Box>
        </Card>
    );
};

type AmigurumiCardProps = React.ComponentProps<typeof AmigurumiCard>;

const arePropsEqual = (prev: AmigurumiCardProps, next: AmigurumiCardProps) =>
    prev.amigurumi.id === next.amigurumi.id &&
    prev.amigurumi.name === next.amigurumi.name &&
    prev.amigurumi.imageUrl === next.amigurumi.imageUrl &&
    prev.amigurumi.favoriteCount === next.amigurumi.favoriteCount &&
    (prev.amigurumi.tags ?? []).length === (next.amigurumi.tags ?? []).length &&
    (prev.amigurumi.tags ?? []).every((tag, i) => tag === next.amigurumi.tags[i]) &&
    prev.onPatternClick === next.onPatternClick &&
    prev.onCardClick === next.onCardClick;

export default React.memo(AmigurumiCard, arePropsEqual);
