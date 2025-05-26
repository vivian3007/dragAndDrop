import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, Container, Alert, Tabs, Tab } from '@mui/material';
import { auth, db } from '../firebase-config.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [tabValue, setTabValue] = useState(0);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                navigate('/home');
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
        setError(null);
        setEmail('');
        setPassword('');
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate('/home');
        } catch (err) {
            switch (err.code) {
                case 'auth/invalid-credential':
                    setError('Ongeldige inloggegevens.');
                    break;
                case 'auth/user-not-found':
                    setError('Gebruiker niet gevonden.');
                    break;
                case 'auth/wrong-password':
                    setError('Onjuist wachtwoord.');
                    break;
                default:
                    setError('Er is een fout opgetreden. Probeer het opnieuw.');
            }
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await setDoc(doc(db, 'users', user.uid), {
                email: user.email,
                createdAt: new Date(),
            });

            navigate('/home');
        } catch (err) {
            switch (err.code) {
                case 'auth/email-already-in-use':
                    setError('Dit e-mailadres is al in gebruik.');
                    break;
                case 'auth/invalid-email':
                    setError('Ongeldig e-mailadres.');
                    break;
                case 'auth/weak-password':
                    setError('Wachtwoord is te zwak. Gebruik minstens 6 tekens.');
                    break;
                default:
                    setError('Er is een fout opgetreden bij registratie.');
            }
        }
    };

    return (
        <Container maxWidth="xs">
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    mt: 8,
                }}
            >
                <Typography component="h1" variant="h5">
                    {tabValue === 0 ? 'Inloggen' : 'Registreren'}
                </Typography>
                <Tabs value={tabValue} onChange={handleTabChange} sx={{ mt: 2 }}>
                    <Tab label="Inloggen" />
                    <Tab label="Registreren" />
                </Tabs>
                <Box component="form" onSubmit={tabValue === 0 ? handleLogin : handleRegister} sx={{ mt: 1 }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="email"
                        label="E-mailadres"
                        name="email"
                        autoComplete="email"
                        autoFocus
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Wachtwoord"
                        type="password"
                        id="password"
                        autoComplete={tabValue === 0 ? 'current-password' : 'new-password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    {error && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            {error}
                        </Alert>
                    )}
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                    >
                        {tabValue === 0 ? 'Inloggen' : 'Account aanmaken'}
                    </Button>
                </Box>
            </Box>
        </Container>
    );
};

export default Login;