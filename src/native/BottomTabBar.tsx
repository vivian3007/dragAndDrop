import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import {
    Favorite, FavoriteBorder, Home, HomeOutlined, Palette, PaletteOutlined,
    People, PeopleOutline, Person, PersonOutline,
} from "@mui/icons-material";
import { useT } from "../i18n/LanguageProvider";
import { useAuth } from "../auth/AuthProvider";
import { profilePath } from "../UserLink.tsx";

// Pagina's zonder tabbalk: inloggen, en de editor (een "taak" met een eigen kopregel en
// terugknop, zoals native apps ook doen bij bewerken).
function hidesTabBar(pathname: string) {
    return pathname === "/" || /^\/[^/]+\/editor$/.test(pathname);
}

// Tabbalk onderin de native app (Capacitor), in plaats van de navigatiebalk bovenin met ☰:
// op een telefoon ligt dit onder je duim. Op het web blijft TopNavBar.
function BottomTabBar() {
    const t = useT();
    const { pathname } = useLocation();
    const { username } = useAuth();

    if (!Capacitor.isNativePlatform() || hidesTabBar(pathname)) return null;

    const ownProfile = username ? profilePath(username) : "/account";
    const tabs = [
        { to: "/home", label: t("tabs.home"), icon: <HomeOutlined />, activeIcon: <Home /> },
        { to: "/myPatterns", label: t("tabs.myPatterns"), icon: <PaletteOutlined />, activeIcon: <Palette /> },
        { to: "/favorites", label: t("tabs.favorites"), icon: <FavoriteBorder />, activeIcon: <Favorite /> },
        { to: "/following", label: t("tabs.following"), icon: <PeopleOutline />, activeIcon: <People /> },
        // Profiel en accountinstellingen horen bij dezelfde tab.
        { to: ownProfile, label: t("tabs.profile"), icon: <PersonOutline />, activeIcon: <Person />,
          active: pathname === ownProfile || pathname === "/account" },
    ];

    return (
        <nav className="bottom-tabbar" aria-label={t("tabs.label")}>
            {tabs.map((tab) => (
                <NavLink
                    key={tab.label}
                    to={tab.to}
                    className={({ isActive }) => `bottom-tab ${(tab.active ?? isActive) ? "active" : ""}`}
                >
                    {({ isActive }) => (
                        <>
                            {(tab.active ?? isActive) ? tab.activeIcon : tab.icon}
                            <span>{tab.label}</span>
                        </>
                    )}
                </NavLink>
            ))}
        </nav>
    );
}

export default React.memo(BottomTabBar);
