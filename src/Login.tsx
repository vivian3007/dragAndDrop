import React, { useState, useEffect } from 'react';
import {Box, TextField, Button, Typography, Container, Alert, Tabs, Tab, Card} from '@mui/material';
import { auth, db } from '../firebase-config.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useT } from './i18n/LanguageProvider';
import LanguageSelect from './i18n/LanguageSelect';

const Login = () => {
    const [tabValue, setTabValue] = useState(0);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    // Sleutel van de foutmelding i.p.v. de tekst zelf, zodat hij meevertaalt bij een taalwissel.
    const [error, setError] = useState<string | null>(null);
    const t = useT();
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
                    setError('login.error.invalidCredentials');
                    break;
                case 'auth/user-not-found':
                    setError('login.error.userNotFound');
                    break;
                case 'auth/wrong-password':
                    setError('login.error.wrongPassword');
                    break;
                default:
                    setError('login.error.generic');
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
                    setError('login.error.emailInUse');
                    break;
                case 'auth/invalid-email':
                    setError('login.error.invalidEmail');
                    break;
                case 'auth/weak-password':
                    setError('login.error.weakPassword');
                    break;
                default:
                    setError('login.error.registerGeneric');
            }
        }
    };

    return (
        <div className="pattern">
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    mt: 8,
                }}
                className="new-pattern-form"
            >
                <Card sx={{padding: 3}}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                        <Typography component="h1" variant="h5">
                            {tabValue === 0 ? t('login.logIn') : t('login.register')}
                        </Typography>
                        <LanguageSelect variant="dark" />
                    </Box>
                    <Tabs value={tabValue} onChange={handleTabChange} sx={{ mt: 2 }}>
                        <Tab label={t('login.logIn')} />
                        <Tab label={t('login.register')} />
                    </Tabs>
                    <Box component="form" onSubmit={tabValue === 0 ? handleLogin : handleRegister} sx={{ mt: 1 }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="email"
                            label={t('login.email')}
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
                            label={t('login.password')}
                            type="password"
                            id="password"
                            autoComplete={tabValue === 0 ? 'current-password' : 'new-password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        {error && (
                            <Alert severity="error" sx={{ mt: 2 }}>
                                {t(error)}
                            </Alert>
                        )}
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2, backgroundColor: "#d4929a" }}
                        >
                            {tabValue === 0 ? t('login.logIn') : t('login.register')}
                        </Button>
                    </Box>
                </Card>
            </Box>
        </div>
    );
};

export default Login;