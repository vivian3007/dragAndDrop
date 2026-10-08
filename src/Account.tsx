import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Alert, Button, Chip, CircularProgress, DialogContent, IconButton, InputAdornment, TextField, Typography } from '@mui/material';
import { ArrowBack, CheckCircle, ErrorOutline, LockReset, Logout, Visibility, VisibilityOff } from '@mui/icons-material';
import { EmailAuthProvider, reauthenticateWithCredential, sendEmailVerification, updatePassword } from 'firebase/auth';
import { toast } from 'react-toastify';
import { logOut, useAuth } from './auth/AuthProvider';
import { authErrorKey, errorCode, MIN_PASSWORD_LENGTH } from './auth/authErrors';
import { profilePath } from './UserLink.tsx';
import AppDialog from './AppDialog';
import { claimUsername, isUsernameAvailable, usernameError } from './users/usernames';
import UsernameField, { UsernameStatus } from './users/UsernameField';
import { useT } from './i18n/LanguageProvider';

// Accountpagina: alleen bereikbaar via RequireAuth, dus `user` is hier altijd gezet.
const Account = () => {
    const { user, refreshUser, username, setUsername } = useAuth();
    const navigate = useNavigate();
    const t = useT();

    const [newUsername, setNewUsername] = useState(username ?? '');
    const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle');
    const handleUsernameStatus = useCallback((status: UsernameStatus) => setUsernameStatus(status), []);
    const [savingUsername, setSavingUsername] = useState(false);
    const [usernameSaveError, setUsernameSaveError] = useState<string | null>(null);

    const [sendingVerification, setSendingVerification] = useState(false);

    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPasswords, setShowPasswords] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);

    useEffect(() => {
        setNewUsername(username ?? '');
    }, [username]);

    if (!user) return null;

    const initial = (username || user.email || '?').charAt(0).toUpperCase();
    const usernameChanged = !!newUsername && newUsername !== username;

    // Nieuwe naam reserveren en de oude in dezelfde batch vrijgeven (zie claimUsername).
    const handleSaveUsername = async (e: React.FormEvent) => {
        e.preventDefault();
        if (usernameError(newUsername)) {
            setUsernameSaveError('username.error.invalid');
            return;
        }
        setSavingUsername(true);
        setUsernameSaveError(null);
        try {
            if (!(await isUsernameAvailable(newUsername))) {
                setUsernameSaveError('username.error.taken');
                return;
            }
            await claimUsername(user, newUsername, username);
            setUsername(newUsername);
            await refreshUser();
            toast.success(t('account.usernameSaved'));
        } catch (err) {
            console.error('Gebruikersnaam wijzigen mislukt:', err);
            setUsernameSaveError('username.error.saveFailed');
        } finally {
            setSavingUsername(false);
        }
    };

    const handleResendVerification = async () => {
        setSendingVerification(true);
        try {
            await sendEmailVerification(user);
            toast.success(t('account.verificationSent', { email: user.email ?? '' }));
        } catch (err) {
            toast.error(t(authErrorKey(errorCode(err), 'account')));
        } finally {
            setSendingVerification(false);
        }
    };

    // Bij sluiten alles wissen, zodat er geen ingetypt wachtwoord in het formulier blijft staan.
    const closePasswordDialog = () => {
        if (savingPassword) return;
        setPasswordDialogOpen(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowPasswords(false);
        setPasswordError(null);
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError(null);
        if (newPassword.length < MIN_PASSWORD_LENGTH) {
            setPasswordError('login.error.passwordTooShort');
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError('login.error.passwordMismatch');
            return;
        }
        if (!user.email) return;
        setSavingPassword(true);
        try {
            // Firebase vraagt voor een wachtwoordwijziging een recente login; met het huidige
            // wachtwoord opnieuw bevestigen voorkomt ook dat iemand op een onbewaakte, nog
            // ingelogde computer zomaar je wachtwoord kan veranderen.
            await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, currentPassword));
            await updatePassword(user, newPassword);
            setPasswordDialogOpen(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setShowPasswords(false);
            toast.success(t('account.passwordChanged'));
        } catch (err) {
            setPasswordError(authErrorKey(errorCode(err), 'account'));
        } finally {
            setSavingPassword(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logOut();
            navigate('/', { replace: true });
        } catch (err) {
            console.error('Fout bij uitloggen:', err);
            toast.error(t('login.error.generic'));
        }
    };

    const visibilityToggle = (
        <InputAdornment position="end">
            <IconButton
                onClick={() => setShowPasswords((v) => !v)}
                edge="end"
                aria-label={t(showPasswords ? 'login.hidePassword' : 'login.showPassword')}
            >
                {showPasswords ? <VisibilityOff /> : <Visibility />}
            </IconButton>
        </InputAdornment>
    );

    return (
        <div className="account-page">
            {username && (
                <Link to={profilePath(username)} className="account-back-link">
                    <ArrowBack fontSize="small" />
                    {t('account.backToProfile')}
                </Link>
            )}
            <h1 className="account-title">{t('nav.settings')}</h1>
            <header className="account-header">
                <div className="account-avatar" aria-hidden="true">{initial}</div>
                <div className="account-header-text">
                    <h2>{username ? `@${username}` : t('account.unnamed')}</h2>
                    <span className="account-email">{user.email}</span>
                </div>
                <div className="account-header-actions">
                    <Button
                        variant="contained"
                        startIcon={<Logout />}
                        onClick={handleLogout}
                        sx={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-bg)', flexDirection: 'row' }}
                    >
                        {t('account.logOut')}
                    </Button>
                </div>
            </header>

            <section className="account-section">
                <h2>{t('account.profile')}</h2>
                <p className="account-note">{t('account.usernameNote')}</p>
                <form onSubmit={handleSaveUsername} className="account-form">
                    <UsernameField
                        value={newUsername}
                        onChange={setNewUsername}
                        onStatusChange={handleUsernameStatus}
                        current={username}
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={!usernameChanged || savingUsername || usernameStatus === 'taken' || usernameStatus === 'invalid'}
                        sx={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-bg)', alignSelf: 'flex-start', mt: '16px' }}
                    >
                        {savingUsername ? <CircularProgress size={20} sx={{ color: 'var(--color-bg)' }} /> : t('account.save')}
                    </Button>
                </form>
                {usernameSaveError && <Alert severity="error" sx={{ mt: 1.5 }}>{t(usernameSaveError)}</Alert>}

                <div className="account-email-row">
                    <div>
                        <div className="account-label">{t('account.email')}</div>
                        <div>{user.email}</div>
                    </div>
                    {user.emailVerified ? (
                        <Chip icon={<CheckCircle />} label={t('account.emailVerified')} color="success" variant="outlined" size="small" />
                    ) : (
                        <div className="account-unverified">
                            <Chip icon={<ErrorOutline />} label={t('account.emailNotVerified')} color="warning" variant="outlined" size="small" />
                            <Button size="small" onClick={handleResendVerification} disabled={sendingVerification} sx={{ color: 'var(--color-primary)' }}>
                                {t('account.resendVerification')}
                            </Button>
                        </div>
                    )}
                </div>
            </section>

            <section className="account-section">
                <h2>{t('account.password')}</h2>
                <p className="account-note">{t('account.passwordNote')}</p>
                <Button
                    variant="outlined"
                    startIcon={<LockReset />}
                    onClick={() => setPasswordDialogOpen(true)}
                    sx={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)', alignSelf: 'flex-start' }}
                >
                    {t('account.changePassword')}
                </Button>
            </section>

            <AppDialog open={passwordDialogOpen} onClose={closePasswordDialog} maxWidth="xs">
                <DialogContent sx={{ padding: 4 }}>
                    <Typography variant="h5" gutterBottom sx={{ pr: 4 }}>{t('account.changePassword')}</Typography>
                    <Typography sx={{ mb: 2 }}>{t('account.changePasswordIntro')}</Typography>
                    <form onSubmit={handleChangePassword} className="account-form account-form--stacked">
                        {/* Verborgen gebruikersnaamveld: helpt wachtwoordmanagers het juiste account te kiezen. */}
                        <input type="email" name="username" autoComplete="username" value={user.email ?? ''} readOnly hidden />
                        <TextField
                            label={t('account.currentPassword')}
                            type={showPasswords ? 'text' : 'password'}
                            autoComplete="current-password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            autoFocus
                            required
                            fullWidth
                            InputProps={{ endAdornment: visibilityToggle }}
                        />
                        <TextField
                            label={t('account.newPassword')}
                            type={showPasswords ? 'text' : 'password'}
                            autoComplete="new-password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            helperText={t('login.passwordHint', { min: MIN_PASSWORD_LENGTH })}
                            required
                            fullWidth
                        />
                        <TextField
                            label={t('login.confirmPassword')}
                            type={showPasswords ? 'text' : 'password'}
                            autoComplete="new-password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            error={confirmPassword.length > 0 && confirmPassword !== newPassword}
                            required
                            fullWidth
                        />
                        {passwordError && <Alert severity="error">{t(passwordError, { min: MIN_PASSWORD_LENGTH })}</Alert>}
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={savingPassword || !currentPassword || !newPassword}
                            sx={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-bg)', alignSelf: 'flex-start' }}
                        >
                            {savingPassword ? <CircularProgress size={20} sx={{ color: 'var(--color-bg)' }} /> : t('account.changePassword')}
                        </Button>
                    </form>
                </DialogContent>
            </AppDialog>
        </div>
    );
};

export default Account;
