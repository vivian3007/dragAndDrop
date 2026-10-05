import { Box, Card, Skeleton } from '@mui/material';
import MasonryGrid from './MasonryGrid.tsx';
import { useResponsiveMinColumns } from './useResponsiveMinColumns.ts';

// Plaatshouders in de vorm van de echte inhoud, i.p.v. een draaiend laadicoontje: de pagina
// staat meteen in z'n uiteindelijke indeling en springt niet als de data binnenkomt.

const skeletonSx = { bgcolor: 'var(--color-accent-soft)' };

// Zelfde opbouw als AmigurumiCard: foto, titel, tags, knoppenrij.
const CardSkeleton = ({ withActions = true, withTags = true }: { withActions?: boolean; withTags?: boolean }) => (
    <Card className="my-pattern-text-container" sx={{ cursor: 'default' }} aria-hidden="true">
        <Skeleton variant="rounded" sx={{ ...skeletonSx, width: '100%', height: 'auto', aspectRatio: '4 / 3' }} />
        <Skeleton variant="text" sx={{ ...skeletonSx, fontSize: '2rem', width: '65%', mt: '12px' }} />
        {withTags && (
            <Box sx={{ display: 'flex', gap: 1, mt: 1, mb: 2 }}>
                <Skeleton variant="rounded" width={56} height={24} sx={{ ...skeletonSx, borderRadius: '12px' }} />
                <Skeleton variant="rounded" width={44} height={24} sx={{ ...skeletonSx, borderRadius: '12px' }} />
            </Box>
        )}
        {withActions && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: '20px' }}>
                <Skeleton variant="rounded" height={40} sx={{ ...skeletonSx, flex: 1 }} />
                <Skeleton variant="circular" width={40} height={40} sx={skeletonSx} />
            </Box>
        )}
    </Card>
);

// Raster met kaart-plaatshouders, met dezelfde kolommen als de echte kaarten.
export const CardGridSkeleton = ({
    count = 6,
    className,
    columnWidth = 300,
    withActions,
    withTags,
}: {
    count?: number;
    className?: string;
    columnWidth?: number;
    withActions?: boolean;
    withTags?: boolean;
}) => {
    const minColumns = useResponsiveMinColumns();
    return (
        <MasonryGrid
            className={className}
            items={Array.from({ length: count }, (_, i) => i)}
            columnWidth={columnWidth}
            minColumns={minColumns}
            compactGap={10}
            gap={20}
            renderItem={(i) => <CardSkeleton key={i} withActions={withActions} withTags={withTags} />}
        />
    );
};

// Kop van een profiel: avatar, naam en de regel met aantallen.
export const ProfileHeaderSkeleton = () => (
    <Box className="profile-header" aria-hidden="true">
        <Skeleton variant="circular" width={72} height={72} sx={skeletonSx} />
        <div>
            <Skeleton variant="text" width={160} sx={{ ...skeletonSx, fontSize: '2rem' }} />
            <Skeleton variant="text" width={220} sx={skeletonSx} />
        </div>
    </Box>
);
