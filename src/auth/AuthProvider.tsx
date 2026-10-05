import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { auth } from '../../firebase-config.js';
import { fetchOwnUsername } from '../users/usernames';

// Eén centrale bron voor "wie is er ingelogd". Componenten lazen voorheen zelf
// `auth.currentUser`, maar die is direct na het laden van de pagina nog null terwijl
// Firebase de sessie herstelt — dan leek je even uitgelogd (geen eigenaar-knoppen, lege
// "Mijn patronen"). Hier wachten we expliciet tot Firebase het weet (`loading`).

type AuthContextValue = {
    user: User | null;
    loading: boolean;
    // Eigen gebruikersnaam: `undefined` zolang die nog geladen wordt, `null` als er nog
    // geen gekozen is (oudere accounts) — dan vraagt de app er eenmalig om.
    username: string | null | undefined;
    setUsername: (username: string) => void;
    // Na profielwijzigingen (naam, verificatie): `user` is een muteerbaar object van
    // Firebase, dus forceren we een nieuwe render met de actuele gegevens.
    refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
    user: null,
    loading: true,
    username: undefined,
    setUsername: () => {},
    refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(auth.currentUser);
    const [loading, setLoading] = useState(true);
    const [username, setUsername] = useState<string | null | undefined>(undefined);
    const [, setVersion] = useState(0);

    useEffect(() => {
        return onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
    }, []);

    useEffect(() => {
        setUsername(undefined);
        if (!user) return;
        let cancelled = false;
        fetchOwnUsername(user.uid)
            .then((name) => !cancelled && setUsername(name))
            // Bij een fout blijft het `undefined`: liever niets vragen dan iemand die al een
            // naam heeft om een nieuwe vragen.
            .catch((error) => console.error('Fout bij ophalen van gebruikersnaam:', error));
        return () => {
            cancelled = true;
        };
    }, [user?.uid]);

    const refreshUser = async () => {
        await auth.currentUser?.reload();
        setUser(auth.currentUser);
        setVersion((v) => v + 1);
    };

    return (
        <AuthContext.Provider value={{ user, loading, username, setUsername, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);

// Sleutels in localStorage die bij een gebruiker horen (bv. het laatst geopende ontwerp in
// de editor). Bij uitloggen weg, zodat de volgende persoon op dezelfde computer niet in
// andermans ontwerp terechtkomt. Taalkeuze e.d. blijven bewust staan.
const USER_STORAGE_KEYS = ['amigurumi'];

export async function logOut() {
    await signOut(auth);
    try {
        USER_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
    } catch {
        // Geen opslag beschikbaar: niets op te ruimen.
    }
}

export const FullPageSpinner = () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: 'var(--color-primary)' }} />
    </Box>
);

// Laat de pagina alleen zien als er iemand is ingelogd; anders naar de inlogpagina, met de
// oorspronkelijke bestemming erbij zodat je na het inloggen daar weer uitkomt.
export function RequireAuth({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) return <FullPageSpinner />;
    if (!user) return <Navigate to="/" replace state={{ from: location.pathname + location.search }} />;
    return <>{children}</>;
}
