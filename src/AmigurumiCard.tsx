import React, { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Card, Chip, IconButton } from '@mui/material';
import { EditOutlined, Favorite, FavoriteBorder, ViewInArOutlined } from '@mui/icons-material';
import { useAuth } from './auth/AuthProvider';
import { uniqueTags } from './tags.ts';
import UserLink from './UserLink.tsx';
import NewPattern from './NewPattern.tsx';
import { useStableArray } from './useStableArray.ts';
import DesignSnapshot from './DesignSnapshot.tsx';
import { sizedImageUrl } from './uploadImage.ts';
import { useT } from './i18n/LanguageProvider';
import { useFavorites } from './favorites/FavoritesProvider';

const ACTION_HEIGHT = 40;

// Kaarten zijn hooguit ~300px breed; 600px is scherp op een retina-scherm.
export const CARD_IMAGE_WIDTH = 600;

// Rustig omlijnd naast de gevulde Patroon-knop.
const actionIconButtonSx = {
    border: '1.5px solid var(--color-accent-soft-hover)',
    borderRadius: 'var(--radius-md)',
    '&:hover': { backgroundColor: 'var(--color-accent-soft)', borderColor: 'var(--color-secondary)' },
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
    // Van wie (chip op de foto): "Jouw ontwerp" (isMine) of de maker; null = niet tonen (bv. op Mijn
    // patronen en op een profiel, waar het altijd dezelfde persoon is).
    ownerId: string | null;
    isMine: boolean;
};

const areMediaPropsEqual = (prev: AmigurumiCardMediaProps, next: AmigurumiCardMediaProps) =>
    prev.id === next.id &&
    prev.name === next.name &&
    prev.tags === next.tags &&
    prev.imageUrl === next.imageUrl &&
    prev.ownerId === next.ownerId &&
    prev.isMine === next.isMine;

// Does not depend on `favorite`, so it stays out of the re-render caused by toggling the heart.
const AmigurumiCardMedia = React.memo(({ id, name, tags, imageUrl, ownerId, isMine }: AmigurumiCardMediaProps) => (
    <>
        {/* Van wie het ontwerp is staat als chip linksboven over de foto. */}
        <div className="card-media">
            {imageUrl ? (
                <img src={sizedImageUrl(imageUrl, CARD_IMAGE_WIDTH)} alt={name} className="amigurumi-image" loading="lazy" decoding="async" />
            ) : (
                <DesignSnapshot amigurumiId={id} alt={name} className="amigurumi-image" />
            )}
            {ownerId !== null && <CardOwner userId={ownerId} isMine={isMine} />}
        </div>
        <h1 className="card-title">{name}</h1>
        <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 0.75}}>
            {uniqueTags(tags).map((tag) => (
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

// Linksboven op de foto: van wie dit ontwerp is.
const CardOwner = ({ userId, isMine }: { userId: string; isMine: boolean }) => {
    const t = useT();
    return (
        <div className="card-owner">
            {isMine ? (
                <span className="card-owner-mine">{t('card.yours')}</span>
            ) : (
                <UserLink userId={userId} />
            )}
        </div>
    );
};

type AmigurumiCardButtonsProps = {
    onPatternClick: (e: React.MouseEvent) => void;
};

const areButtonsPropsEqual = (prev: AmigurumiCardButtonsProps, next: AmigurumiCardButtonsProps) =>
    prev.onPatternClick === next.onPatternClick;

// Rendered as a Fragment (no wrapping element) so it can live inside the same flex row as the
// heart button below, while still being skippable on its own when only `favorite` changes.
// Verwijderen staat bewust niet op de kaart (te makkelijk per ongeluk, naast het hartje);
// dat zit in het menu ⋯ van de detailweergave.
export const AmigurumiCardButtons = React.memo(({ onPatternClick }: AmigurumiCardButtonsProps) => {
    const t = useT();
    return (
    <>
        <Button
            type="button"
            variant="contained"
            color="primary"
            sx={{flex: 1, height: ACTION_HEIGHT}}
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
            sx={{ ...actionIconButtonSx, ...(count > 0 ? { width: 'auto', minWidth: ACTION_HEIGHT, px: 1.25, gap: 0.5 } : {}) }}
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

// Bewerkknoppen op je eigen kaart: elk zegt wat je gaat bewerken. "3D-vormen" opent de editor,
// "Naam & foto" het formulier met naam, tags, notities en foto. Kopie maken en verwijderen
// staan in de detailweergave (verwijderen hoort niet naast deze knoppen).
const OwnerEditButtons = ({ amigurumi }: { amigurumi: Amigurumi }) => {
    const t = useT();
    const navigate = useNavigate();
    const [detailsOpen, setDetailsOpen] = useState(false);
    return (
        <>
            <Box className="card-edit-row">
                <Button
                    type="button"
                    variant="outlined"
                    size="small"
                    startIcon={<ViewInArOutlined />}
                    title={t('card.editShapesHint')}
                    onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/${amigurumi.id}/editor`);
                    }}
                >
                    {t('card.editShapes')}
                </Button>
                <Button
                    type="button"
                    variant="outlined"
                    size="small"
                    startIcon={<EditOutlined />}
                    title={t('card.editDetailsHint')}
                    onClick={(e) => {
                        e.stopPropagation();
                        setDetailsOpen(true);
                    }}
                >
                    {t('card.editDetails')}
                </Button>
            </Box>
            {/* Alleen gemonteerd als hij open is: anders een formulier per kaart in het raster.
                Klikken in het formulier mag de detailweergave van de kaart niet openen. */}
            {detailsOpen && (
                <div onClick={(e) => e.stopPropagation()}>
                    <NewPattern open onClose={() => setDetailsOpen(false)} editingAmigurumi={amigurumi} />
                </div>
            )}
        </>
    );
};

const AmigurumiCard = ({
    amigurumi,
    onPatternClick,
    onCardClick,
    showOwner = true,
}: {
    amigurumi: Amigurumi;
    onPatternClick: (amigurumi: Amigurumi) => void;
    onCardClick?: (amigurumi: Amigurumi) => void;
    // Van wie het ontwerp is onder de titel tonen; uit op Mijn patronen en op een profiel.
    showOwner?: boolean;
}) => {
    const { user } = useAuth();
    const isMine = !!user && amigurumi.user_id === user.uid;
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
                ownerId={showOwner ? amigurumi.user_id ?? '' : null}
                isMine={isMine}
            />
            <Box sx={{display: 'flex', alignItems: 'center', gap: 1, marginTop: '16px'}}>
                <AmigurumiCardButtons onPatternClick={handlePatternClick} />
                <FavoriteButton amigurumiId={amigurumi.id} count={amigurumi.favoriteCount} />
            </Box>
            {isMine && <OwnerEditButtons amigurumi={amigurumi} />}
        </Card>
    );
};

type AmigurumiCardProps = React.ComponentProps<typeof AmigurumiCard>;

const arePropsEqual = (prev: AmigurumiCardProps, next: AmigurumiCardProps) =>
    prev.amigurumi.id === next.amigurumi.id &&
    prev.amigurumi.name === next.amigurumi.name &&
    prev.amigurumi.imageUrl === next.amigurumi.imageUrl &&
    prev.amigurumi.user_id === next.amigurumi.user_id &&
    prev.amigurumi.notes === next.amigurumi.notes &&
    prev.amigurumi.allowCopy === next.amigurumi.allowCopy &&
    prev.showOwner === next.showOwner &&
    prev.amigurumi.favoriteCount === next.amigurumi.favoriteCount &&
    (prev.amigurumi.tags ?? []).length === (next.amigurumi.tags ?? []).length &&
    (prev.amigurumi.tags ?? []).every((tag, i) => tag === next.amigurumi.tags[i]) &&
    prev.onPatternClick === next.onPatternClick &&
    prev.onCardClick === next.onCardClick;

export default React.memo(AmigurumiCard, arePropsEqual);
