import { useEffect, useState } from 'react';
import { CircularProgress, InputAdornment, TextField } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { isUsernameAvailable, normalizeUsername, USERNAME_MAX, USERNAME_MIN, usernameError } from './usernames';
import { useT } from '../i18n/LanguageProvider';

export type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'unchanged';

// Invoerveld voor een gebruikersnaam: zet de invoer om naar kleine letters, controleert het
// formaat en (na een korte pauze in het typen) of de naam nog vrij is. `current` is de huidige
// naam van de gebruiker, die telt als "ongewijzigd" i.p.v. "bezet". De echte garantie op
// uniekheid zit in firestore.rules; dit is alleen directe feedback.
const UsernameField = ({
    value,
    onChange,
    onStatusChange,
    current,
    autoFocus,
}: {
    value: string;
    onChange: (value: string) => void;
    onStatusChange: (status: UsernameStatus) => void;
    current?: string | null;
    autoFocus?: boolean;
}) => {
    const t = useT();
    const [status, setStatus] = useState<UsernameStatus>('idle');

    useEffect(() => {
        if (!value) {
            setStatus('idle');
            return;
        }
        if (value === current) {
            setStatus('unchanged');
            return;
        }
        if (usernameError(value)) {
            setStatus('invalid');
            return;
        }
        setStatus('checking');
        let cancelled = false;
        const timer = setTimeout(() => {
            isUsernameAvailable(value)
                .then((available) => !cancelled && setStatus(available ? 'available' : 'taken'))
                .catch(() => !cancelled && setStatus('idle'));
        }, 400);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [value, current]);

    useEffect(() => {
        onStatusChange(status);
    }, [status, onStatusChange]);

    const helperText =
        status === 'invalid' ? t(usernameError(value) ?? 'username.error.characters', { min: USERNAME_MIN, max: USERNAME_MAX })
        : status === 'taken' ? t('username.error.taken')
        : status === 'available' ? t('username.available')
        : t('username.hint', { min: USERNAME_MIN, max: USERNAME_MAX });

    return (
        <TextField
            margin="normal"
            required
            fullWidth
            label={t('username.label')}
            autoComplete="username"
            autoFocus={autoFocus}
            value={value}
            onChange={(e) => onChange(normalizeUsername(e.target.value).replace(/\s+/g, ''))}
            error={status === 'invalid' || status === 'taken'}
            helperText={helperText}
            inputProps={{ maxLength: USERNAME_MAX, autoCapitalize: 'none', spellCheck: false }}
            InputProps={{
                startAdornment: <InputAdornment position="start">@</InputAdornment>,
                endAdornment:
                    status === 'checking' ? (
                        <InputAdornment position="end"><CircularProgress size={18} /></InputAdornment>
                    ) : status === 'available' ? (
                        <InputAdornment position="end"><CheckCircle color="success" fontSize="small" /></InputAdornment>
                    ) : undefined,
            }}
        />
    );
};

export default UsernameField;
