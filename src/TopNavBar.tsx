import React from "react";
import { AppBar, Avatar, Box, Container, Toolbar } from "@mui/material";
import { NavLink, useLocation } from "react-router-dom";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

function TopNavBar() {
    const location = useLocation();

    if (location.pathname === '/') {
        return null;
    }

    return (
        <AppBar
            position="static"
            style={{
                background: "linear-gradient(135deg, var(--color-secondary) 0%, var(--color-secondary-hover) 100%)",
                height: "8vh",
                width: "100vw",
                boxShadow: "0 4px 14px rgba(var(--shadow-color), 0.3)",
            }}
        >
            <Container maxWidth="false" disableGutters sx={{ marginLeft: 0, marginRight: 0, width: 1 }}>
                <Toolbar disableGutters sx={{ minHeight: "8vh", alignItems: "center", width: 1 }}>
                    <NavLink
                        to="/home"
                        className={({ isActive }) => `navbar-button ${isActive ? 'active' : ''}`}
                    >
                        Home
                    </NavLink>
                    <NavLink
                        to="/myPatterns"
                        className={({ isActive }) => `navbar-button ${isActive ? 'active' : ''}`}
                    >
                        My patterns
                    </NavLink>
                    <NavLink
                        to="/favorites"
                        className={({ isActive }) => `navbar-button ${isActive ? 'active' : ''}`}
                    >
                        Favorite patterns
                    </NavLink>
                    <Box sx={{ ml: "auto", mr: "1.5vw", display: "flex", alignItems: "center" }}>
                        <NavLink
                            to={"/account"}
                            className={({ isActive }) => `navbar-button ${isActive ? 'active' : ''}`}
                            style={{ display: "flex", alignItems: "center", height: "100%" }}
                        >
                            <Avatar
                                src={"../img/avatar.jpg"}
                                alt={'User'}
                                sx={{ height: "6vh", width: "6vh", mx: 'auto' }}
                            />
                            <KeyboardArrowDownIcon sx={{ fontSize: "2rem", ml: 1 }} />
                        </NavLink>
                    </Box>
                </Toolbar>
            </Container>
        </AppBar>
    );
}

export default React.memo(TopNavBar);
