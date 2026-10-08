import { useCallback, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Alert, Box, Button, CircularProgress, IconButton, InputAdornment, Tab, Tabs, TextField, Typography } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import {
    createUserWithEmailAndPassword,
    sendEmailVerification,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '../firebase-config.js';
import { useAuth } from './auth/AuthProvider';
import { authErrorKey, errorCode, MIN_PASSWORD_LENGTH } from './auth/authErrors';
import { claimUsername, isUsernameAvailable, USERNAME_MAX, USERNAME_MIN, usernameError } from './users/usernames';
import UsernameField, { UsernameStatus } from './users/UsernameField';
import { useT } from './i18n/LanguageProvider';
import LanguageSelect from './i18n/LanguageSelect';

type Mode = 'login' | 'register' | 'reset';

const Login = () => {
    const t = useT();
    const location = useLocation();
    const { user, loading, refreshUser, setUsername: setOwnUsername } = useAuth();

    const [mode, setMode] = useState<Mode>('login');
    const [username, setUsername] = useState('');
    const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle');
    const handleUsernameStatus = useCallback((status: UsernameStatus) => setUsernameStatus(status), []);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    // Sleutels i.p.v. teksten, zodat ze meevertalen bij een taalwissel.
    const [error, setError] = useState<string | null>(null);
    const [info, setInfo] = useState<string | null>(null);

    // Na inloggen terug naar waar je heen wilde (RequireAuth geeft dat mee), anders Home.
    // Tijdens het registreren nog niet doorsturen: dan lopen naam en profiel nog.
    const destination = (location.state as { from?: string } | null)?.from ?? '/home';
    if (!loading && user && !submitting) {
        return <Navigate to={destination} replace />;
    }

    const switchMode = (next: Mode) => {
        setMode(next);
        setError(null);
        setInfo(null);
        setPassword('');
        setConfirmPassword('');
        setShowPassword(false);
    };

    const handleLogin = async () => {
        await signInWithEmailAndPassword(auth, email.trim(), password);
    };

    const handleRegister = async () => {
        if (usernameError(username)) throw { code: 'local/username-invalid' };
        if (password.length < MIN_PASSWORD_LENGTH) throw { code: 'local/password-too-short' };
        if (password !== confirmPassword) throw { code: 'local/password-mismatch' };
        // Vooraf controleren, zodat er geen account ontstaat met een al bezette naam. De echte
        // garantie is de reservering hieronder (firestore.rules weigert een bezette naam).
        // Lukt de controle niet (bv. oudere Firestore-regels die lezen zonder login weigeren),
        // dan toch doorgaan: de reservering na het aanmaken vangt een bezette naam alsnog af.
        const available = await isUsernameAvailable(username).catch(() => true);
        if (!available) throw { code: 'local/username-taken' };

        const { user: newUser } = await createUserWithEmailAndPassword(auth, email.trim(), password);
        try {
            await claimUsername(newUser, username);
            setOwnUsername(username);
        } catch (err) {
            // Net door iemand anders genomen: het account bestaat al, dus na het doorsturen
            // vraagt de app (ChooseUsernameDialog) om een andere naam.
            console.warn('Gebruikersnaam kon niet worden vastgelegd:', err);
        }
        // Niet fataal als dit mislukt (bv. te veel verzoeken): op de accountpagina kan de
        // verificatiemail opnieuw worden aangevraagd.
        await sendEmailVerification(newUser).catch((err) => console.warn('Verificatiemail niet verstuurd:', err));
        await refreshUser();
    };

    const handleReset = async () => {
        try {
            await sendPasswordResetEmail(auth, email.trim());
        } catch (err) {
            // "Geen account met dit adres" bewust niet laten zien: anders kan iedereen
            // uitproberen welke e-mailadressen een account hebben.
            if (errorCode(err) !== 'auth/user-not-found') throw err;
        }
        setInfo('login.reset.sent');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;
        setError(null);
        setInfo(null);
        setSubmitting(true);
        try {
            if (mode === 'login') await handleLogin();
            else if (mode === 'register') await handleRegister();
            else await handleReset();
        } catch (err) {
            setError(authErrorKey(errorCode(err), mode));
        } finally {
            setSubmitting(false);
        }
    };

    const passwordAdornment = (
        <InputAdornment position="end">
            <IconButton
                onClick={() => setShowPassword((v) => !v)}
                edge="end"
                aria-label={t(showPassword ? 'login.hidePassword' : 'login.showPassword')}
            >
                {showPassword ? <VisibilityOff /> : <Visibility />}
            </IconButton>
        </InputAdornment>
    );

    const submitLabel = mode === 'login' ? t('login.logIn') : mode === 'register' ? t('login.register') : t('login.reset.submit');

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-card-top">
                    <LanguageSelect variant="dark" />
                </div>
                <h1 className="auth-brand">Stitchify</h1>
                <p className="auth-tagline">{t('login.tagline')}</p>

                {mode === 'reset' ? (
                    <>
                        <h2 className="auth-heading">{t('login.reset.title')}</h2>
                        <Typography sx={{ mb: 1, fontSize: '0.95rem' }}>{t('login.reset.intro')}</Typography>
                    </>
                ) : (
                    <Tabs value={mode} onChange={(_, value: Mode) => switchMode(value)} variant="fullWidth" className="auth-tabs">
                        <Tab value="login" label={t('login.logIn')} disableRipple />
                        <Tab value="register" label={t('login.register')} disableRipple />
                    </Tabs>
                )}

                <Box component="form" onSubmit={handleSubmit} noValidate={false}>
                    {mode === 'register' && (
                        <UsernameField value={username} onChange={setUsername} onStatusChange={handleUsernameStatus} autoFocus />
                    )}
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        type="email"
                        label={t('login.email')}
                        autoComplete={mode === 'register' ? 'email' : 'username'}
                        autoFocus={mode !== 'register'}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    {mode !== 'reset' && (
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            type={showPassword ? 'text' : 'password'}
                            label={t('login.password')}
                            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            helperText={mode === 'register' ? t('login.passwordHint', { min: MIN_PASSWORD_LENGTH }) : undefined}
                            InputProps={{ endAdornment: passwordAdornment }}
                        />
                    )}
                    {mode === 'register' && (
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            type={showPassword ? 'text' : 'password'}
                            label={t('login.confirmPassword')}
                            autoComplete="new-password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            error={confirmPassword.length > 0 && confirmPassword !== password}
                        />
                    )}

                    {mode === 'login' && (
                        <button type="button" className="auth-link auth-forgot" onClick={() => switchMode('reset')}>
                            {t('login.forgotPassword')}
                        </button>
                    )}

                    {error && <Alert severity="error" sx={{ mt: 2 }}>{t(error, { min: MIN_PASSWORD_LENGTH, usernameMin: USERNAME_MIN, usernameMax: USERNAME_MAX })}</Alert>}
                    {info && <Alert severity="success" sx={{ mt: 2 }}>{t(info)}</Alert>}

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        disabled={submitting || (mode === 'register' && (usernameStatus === 'taken' || usernameStatus === 'invalid'))}
                        className="auth-submit"
                    >
                        {submitting ? <CircularProgress size={22} sx={{ color: 'var(--color-bg)' }} /> : submitLabel}
                    </Button>

                    {mode === 'reset' && (
                        <button type="button" className="auth-link auth-back" onClick={() => switchMode('login')}>
                            {t('login.backToLogin')}
                        </button>
                    )}
                </Box>
            </div>
        </div>
    );
};

export default Login;
