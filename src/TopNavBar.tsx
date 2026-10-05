import React, { useState } from "react";
import {
    AppBar,
    Avatar,
    Box,
    Container,
    Drawer,
    IconButton,
    List,
    ListItemButton,
    ListItemText,
    Toolbar,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import { NavLink, useLocation } from "react-router-dom";
import MenuIcon from '@mui/icons-material/Menu';
import LanguageSelect from "./i18n/LanguageSelect";
import { useT } from "./i18n/LanguageProvider";
import { useAuth } from "./auth/AuthProvider";

const navLinks = [
    { to: "/home", labelId: "nav.home" },
    { to: "/myPatterns", labelId: "nav.myPatterns" },
    { to: "/favorites", labelId: "nav.favorites" },
];

function TopNavBar() {
    const location = useLocation();
    const theme = useTheme();
    // md-breakpoint (900px) komt overeen met de sm/md-grens in styles.css: onder die
    // breedte is er geen ruimte meer voor drie navlinks + avatar op één rij.
    const isCompact = useMediaQuery(theme.breakpoints.down('md'));
    const [drawerOpen, setDrawerOpen] = useState(false);
    const t = useT();
    const { user, username } = useAuth();

    if (location.pathname === '/') {
        return null;
    }

    return (
        <AppBar
            position="static"
            style={{
                background: "linear-gradient(135deg, var(--color-secondary) 0%, var(--color-secondary-hover) 100%)",
                width: "100vw",
                boxShadow: "0 4px 14px rgba(var(--shadow-color), 0.3)",
            }}
            sx={{ minHeight: { xs: "auto", md: "8vh" } }}
        >
            <Container maxWidth="false" disableGutters sx={{ marginLeft: 0, marginRight: 0, width: 1 }}>
                <Toolbar
                    disableGutters
                    sx={{
                        minHeight: { xs: "auto", md: "8vh" },
                        alignItems: "center",
                        width: 1,
                        px: { xs: 2, md: 0 },
                        py: { xs: 1, md: 0 },
                    }}
                >
                    {isCompact ? (
                        <IconButton
                            onClick={() => setDrawerOpen(true)}
                            aria-label={t("nav.openMenu")}
                            sx={{ color: "var(--color-bg)" }}
                        >
                            <MenuIcon fontSize="large" />
                        </IconButton>
                    ) : (
                        navLinks.map((link) => (
                            <NavLink
                                key={link.to}
                                to={link.to}
                                className={({ isActive }) => `navbar-button ${isActive ? 'active' : ''}`}
                            >
                                {t(link.labelId)}
                            </NavLink>
                        ))
                    )}
                    <Box sx={{ ml: "auto", mr: { xs: "2vw", md: "1.5vw" }, display: "flex", alignItems: "center", gap: 2 }}>
                        <LanguageSelect />
                        <NavLink
                            to={"/account"}
                            className={({ isActive }) => `navbar-button ${isActive ? 'active' : ''}`}
                            style={{ display: "flex", alignItems: "center", height: "100%" }}
                        >
                            {/* Initiaal van de ingelogde gebruiker, i.p.v. één vaste foto voor iedereen. */}
                            <Avatar
                                alt={t("nav.account")}
                                title={t("nav.account")}
                                sx={{
                                    height: { xs: "5.5vh", md: "6vh" },
                                    width: { xs: "5.5vh", md: "6vh" },
                                    mx: 'auto',
                                    backgroundColor: 'var(--color-bg)',
                                    color: 'var(--color-primary)',
                                    fontWeight: 700,
                                }}
                            >
                                {(username || user?.email || '?').charAt(0).toUpperCase()}
                            </Avatar>
                        </NavLink>
                    </Box>
                </Toolbar>
            </Container>

            <Drawer
                anchor="top"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                PaperProps={{ sx: { backgroundColor: 'var(--color-bg-card)', width: '100%' } }}
            >
                <Box role="presentation" onClick={() => setDrawerOpen(false)}>
                    <List>
                        {navLinks.map((link) => (
                            <ListItemButton key={link.to} component={NavLink} to={link.to} sx={{ color: 'var(--color-text)', py: 1.5 }}>
                                <ListItemText primary={t(link.labelId)} primaryTypographyProps={{ fontWeight: 600 }} />
                            </ListItemButton>
                        ))}
                    </List>
                </Box>
            </Drawer>
        </AppBar>
    );
}

export default React.memo(TopNavBar);
