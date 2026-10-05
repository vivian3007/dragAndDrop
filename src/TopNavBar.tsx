import React, { useState } from "react";
import {
    AppBar,
    Avatar,
    Box,
    Container,
    Divider,
    Drawer,
    IconButton,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Skeleton,
    Toolbar,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import MenuIcon from '@mui/icons-material/Menu';
import { Logout, Person, Settings } from '@mui/icons-material';
import LanguageSelect from "./i18n/LanguageSelect";
import { useT } from "./i18n/LanguageProvider";
import { logOut, useAuth } from "./auth/AuthProvider";
import { profilePath } from "./UserLink.tsx";

const navLinks = [
    { to: "/home", labelId: "nav.home" },
    { to: "/myPatterns", labelId: "nav.myPatterns" },
    { to: "/favorites", labelId: "nav.favorites" },
    { to: "/following", labelId: "nav.following" },
];

function TopNavBar() {
    const location = useLocation();
    const theme = useTheme();
    // md-breakpoint (900px) komt overeen met de sm/md-grens in styles.css: onder die
    // breedte is er geen ruimte meer voor drie navlinks + avatar op één rij.
    const isCompact = useMediaQuery(theme.breakpoints.down('md'));
    const [drawerOpen, setDrawerOpen] = useState(false);
    const t = useT();
    const { user, username, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
    const closeMenu = () => setMenuAnchor(null);

    const initial = (username || user?.email || '?').charAt(0).toUpperCase();
    const profileActive = !!username && location.pathname === profilePath(username);
    const accountActive = profileActive || location.pathname === '/account';

    const handleLogout = async () => {
        closeMenu();
        try {
            await logOut();
            navigate('/', { replace: true });
        } catch (err) {
            console.error('Fout bij uitloggen:', err);
        }
    };

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
            <Container maxWidth={false} disableGutters sx={{ marginLeft: 0, marginRight: 0, width: 1 }}>
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
                        <button
                            type="button"
                            className={`navbar-button navbar-avatar-button ${accountActive || menuAnchor ? 'active' : ''}`}
                            onClick={(e) => setMenuAnchor(e.currentTarget)}
                            aria-label={t("nav.account")}
                            aria-haspopup="menu"
                            aria-expanded={!!menuAnchor}
                            aria-controls={menuAnchor ? 'account-menu' : undefined}
                        >
                            {/* Initiaal van de ingelogde gebruiker, i.p.v. één vaste foto voor iedereen.
                                Zolang die nog niet bekend is een lege cirkel, geen "?". */}
                            {authLoading || (user && username === undefined) ? (
                                <Skeleton
                                    variant="circular"
                                    sx={{
                                        height: { xs: "5.5vh", md: "6vh" },
                                        width: { xs: "5.5vh", md: "6vh" },
                                        bgcolor: 'rgba(var(--light-overlay-color), 0.35)',
                                    }}
                                />
                            ) : (
                                <Avatar
                                    sx={{
                                        height: { xs: "5.5vh", md: "6vh" },
                                        width: { xs: "5.5vh", md: "6vh" },
                                        mx: 'auto',
                                        backgroundColor: 'var(--color-bg)',
                                        color: 'var(--color-primary)',
                                        fontWeight: 700,
                                    }}
                                >
                                    {initial}
                                </Avatar>
                            )}
                        </button>
                    </Box>
                </Toolbar>
            </Container>

            {/* Accountmenu onder de avatar: je profiel (wat anderen zien) en je instellingen
                zijn twee aparte bestemmingen, dus de avatar kiest er niet zelf één. */}
            <Menu
                id="account-menu"
                anchorEl={menuAnchor}
                open={!!menuAnchor}
                onClose={closeMenu}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{ sx: { mt: 1, minWidth: 240, borderRadius: '16px', backgroundColor: 'var(--color-bg-card)' } }}
            >
                <Box className="account-menu-header">
                    <Avatar sx={{ width: 40, height: 40, backgroundColor: 'var(--color-primary)', color: 'var(--color-bg)', fontWeight: 700 }}>
                        {initial}
                    </Avatar>
                    <div className="account-menu-identity">
                        <span className="account-menu-name">{username ? `@${username}` : t('account.unnamed')}</span>
                        <span className="account-menu-email">{user?.email}</span>
                    </div>
                </Box>
                <Divider />
                <MenuItem
                    component={Link}
                    to={username ? profilePath(username) : '#'}
                    disabled={!username}
                    onClick={closeMenu}
                    selected={profileActive}
                >
                    <ListItemIcon><Person fontSize="small" /></ListItemIcon>
                    {t('nav.myProfile')}
                </MenuItem>
                <MenuItem component={Link} to="/account" onClick={closeMenu} selected={location.pathname === '/account'}>
                    <ListItemIcon><Settings fontSize="small" /></ListItemIcon>
                    {t('nav.settings')}
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                    <ListItemIcon><Logout fontSize="small" /></ListItemIcon>
                    {t('account.logOut')}
                </MenuItem>
            </Menu>

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
