import { useMediaQuery, useTheme } from '@mui/material';

// 2 kolommen op xs, 3 op sm, en vanaf md geen ondergrens meer (de kaartgrid past dan al
// vanzelf 3+ kolommen op basis van de opgegeven columnWidth).
export const useResponsiveMinColumns = (): number => {
    const theme = useTheme();
    const isXs = useMediaQuery(theme.breakpoints.down('sm'));
    const isMdUp = useMediaQuery(theme.breakpoints.up('md'));

    if (isXs) return 2;
    if (isMdUp) return 1;
    return 3;
};
