import { createTheme } from "@mui/material/styles";

// Eén bron voor kleuren, letters en vormen van de MUI-onderdelen. De waarden zijn gelijk aan de
// tokens in :root van styles.css (MUI rekent met echte kleuren, niet met CSS-variabelen).
const color = {
    bg: "#F1E3E0",
    card: "#FAF5F4",
    surface: "#FFFFFF",
    primary: "#7D3A45",
    primaryHover: "#642E37",
    secondary: "#97616A",
    accentSoft: "#E3D3CE",
    accentSoftHover: "#D2BBB6",
    text: "#2A1E1B",
    danger: "#B3261E",
    fieldBorder: "#A88580",
};

const headingFont = "'Fredoka', sans-serif";
const bodyFont = "'Quicksand', sans-serif";

const theme = createTheme({
    palette: {
        primary: { main: color.primary, dark: color.primaryHover, contrastText: color.bg },
        secondary: { main: color.secondary, contrastText: color.bg },
        error: { main: color.danger },
        text: { primary: color.text, secondary: color.secondary },
        background: { default: color.bg, paper: color.card },
        divider: color.accentSoftHover,
    },
    shape: { borderRadius: 12 },
    typography: {
        fontFamily: bodyFont,
        fontWeightRegular: 500,
        h1: { fontFamily: headingFont },
        h2: { fontFamily: headingFont },
        h3: { fontFamily: headingFont },
        h4: { fontFamily: headingFont },
        h5: { fontFamily: headingFont },
        h6: { fontFamily: headingFont },
        button: { fontFamily: headingFont, fontWeight: 600, textTransform: "none", letterSpacing: 0 },
    },
    components: {
        MuiButton: {
            defaultProps: { disableElevation: true },
            styleOverrides: {
                root: { borderRadius: 12, fontSize: "0.95rem" },
                sizeSmall: { fontSize: "0.875rem" },
                outlined: { borderWidth: 1.5, "&:hover": { borderWidth: 1.5 } },
            },
        },
        MuiTab: {
            styleOverrides: { root: { fontFamily: headingFont, textTransform: "none" } },
        },
        MuiChip: {
            styleOverrides: { root: { fontWeight: 600 } },
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    backgroundColor: color.surface,
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: color.fieldBorder },
                    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: color.secondary },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: color.primary, borderWidth: 2 },
                },
            },
        },
        MuiInputLabel: {
            styleOverrides: { root: { "&.Mui-focused": { color: color.primary } } },
        },
        MuiPaper: {
            styleOverrides: { rounded: { borderRadius: 16 } },
        },
        MuiMenu: {
            styleOverrides: { paper: { boxShadow: "0 8px 24px rgba(42, 30, 27, 0.14)" } },
        },
    },
});

export default theme;
