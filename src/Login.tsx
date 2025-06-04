import React, { useState, useEffect } from 'react';
import {Box, TextField, Button, Typography, Container, Alert, Tabs, Tab, Card} from '@mui/material';
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
                    setError('Invalid credentials.');
                    break;
                case 'auth/user-not-found':
                    setError('User not found.');
                    break;
                case 'auth/wrong-password':
                    setError('Wrong password.');
                    break;
                default:
                    setError('Something went wrong. Try again.');
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
                    setError('This email adress is already in use.');
                    break;
                case 'auth/invalid-email':
                    setError('This email adress is invalid.');
                    break;
                case 'auth/weak-password':
                    setError('Password is too weak. Use at least 6 characters.');
                    break;
                default:
                    setError('Something went wrong with your registration.');
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
                    <Typography component="h1" variant="h5">
                        {tabValue === 0 ? 'Log in' : 'Register'}
                    </Typography>
                    <Tabs value={tabValue} onChange={handleTabChange} sx={{ mt: 2 }}>
                        <Tab label="Log in" />
                        <Tab label="Register" />
                    </Tabs>
                    <Box component="form" onSubmit={tabValue === 0 ? handleLogin : handleRegister} sx={{ mt: 1 }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="email"
                            label="Email adress"
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
                            label="Password"
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
                            sx={{ mt: 3, mb: 2, backgroundColor: "#d4929a" }}
                        >
                            {tabValue === 0 ? 'Log in' : 'Register'}
                        </Button>
                    </Box>
                </Card>
            </Box>
        </div>
    );
};

export default Login;