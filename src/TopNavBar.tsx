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
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import MenuIcon from '@mui/icons-material/Menu';

const navLinks = [
    { to: "/home", label: "Home" },
    { to: "/myPatterns", label: "My patterns" },
    { to: "/favorites", label: "Favorite patterns" },
];

function TopNavBar() {
    const location = useLocation();
    const theme = useTheme();
    // md-breakpoint (900px) komt overeen met de sm/md-grens in styles.css: onder die
    // breedte is er geen ruimte meer voor drie navlinks + avatar op één rij.
    const isCompact = useMediaQuery(theme.breakpoints.down('md'));
    const [drawerOpen, setDrawerOpen] = useState(false);

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
                            aria-label="Menu openen"
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
                                {link.label}
                            </NavLink>
                        ))
                    )}
                    <Box sx={{ ml: "auto", mr: { xs: "2vw", md: "1.5vw" }, display: "flex", alignItems: "center" }}>
                        <NavLink
                            to={"/account"}
                            className={({ isActive }) => `navbar-button ${isActive ? 'active' : ''}`}
                            style={{ display: "flex", alignItems: "center", height: "100%" }}
                        >
                            <Avatar
                                src={"../img/avatar.jpg"}
                                alt={'User'}
                                sx={{ height: { xs: "5.5vh", md: "6vh" }, width: { xs: "5.5vh", md: "6vh" }, mx: 'auto' }}
                            />
                            <KeyboardArrowDownIcon sx={{ fontSize: "2rem", ml: 1 }} />
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
                                <ListItemText primary={link.label} primaryTypographyProps={{ fontWeight: 600 }} />
                            </ListItemButton>
                        ))}
                    </List>
                </Box>
            </Drawer>
        </AppBar>
    );
}

export default React.memo(TopNavBar);
