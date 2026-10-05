import { useCallback, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Alert, Button, CircularProgress, Dialog, DialogContent, Typography } from '@mui/material';
import { logOut, useAuth } from '../auth/AuthProvider';
import { claimUsername, isUsernameAvailable, usernameError } from './usernames';
import UsernameField, { UsernameStatus } from './UsernameField';
import { useT } from '../i18n/LanguageProvider';

// Accounts van vóór de gebruikersnamen hebben er nog geen. Zonder naam zou je overal als
// "onbekend" verschijnen, dus na het inloggen eenmalig (en niet weg te klikken) vragen.
const ChooseUsernameDialog = () => {
    const { user, username, setUsername } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const t = useT();
    const [value, setValue] = useState('');
    const [status, setStatus] = useState<UsernameStatus>('idle');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const handleStatus = useCallback((next: UsernameStatus) => setStatus(next), []);

    // Niet op de inlogpagina: daar wordt tijdens het registreren de naam al vastgelegd.
    const open = !!user && username === null && location.pathname !== '/';
    if (!open || !user) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (usernameError(value)) {
            setError('username.error.invalid');
            return;
        }
        setSaving(true);
        setError(null);
        try {
            if (!(await isUsernameAvailable(value))) {
                setError('username.error.taken');
                return;
            }
            await claimUsername(user, value);
            setUsername(value);
        } catch (err) {
            console.error('Gebruikersnaam vastleggen mislukt:', err);
            // Meestal: net door iemand anders genomen (de regels weigeren dan de reservering).
            setError('username.error.saveFailed');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        await logOut();
        navigate('/', { replace: true });
    };

    return (
        <Dialog open maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '24px' } }}>
            <DialogContent sx={{ p: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>{t('username.choose.title')}</Typography>
                <Typography sx={{ mb: 1, fontSize: '0.95rem' }}>{t('username.choose.intro')}</Typography>
                <form onSubmit={handleSubmit}>
                    <UsernameField value={value} onChange={setValue} onStatusChange={handleStatus} autoFocus />
                    {error && <Alert severity="error" sx={{ mt: 1 }}>{t(error)}</Alert>}
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        disabled={saving || status === 'taken' || status === 'invalid' || !value}
                        className="auth-submit"
                    >
                        {saving ? <CircularProgress size={22} sx={{ color: 'var(--color-bg)' }} /> : t('username.choose.submit')}
                    </Button>
                    <button type="button" className="auth-link auth-back" onClick={handleLogout}>
                        {t('account.logOut')}
                    </button>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default ChooseUsernameDialog;
