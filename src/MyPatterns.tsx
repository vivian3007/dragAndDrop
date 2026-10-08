import { useMemo, useState } from 'react';
import { Button, Typography } from '@mui/material';
import { Add } from '@mui/icons-material';
import { collection, query, where } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { db } from '../firebase-config.js';
import { useAuth } from './auth/AuthProvider';
import NewPattern from './NewPattern.tsx';
import PatternBrowser from './PatternBrowser.tsx';
import { useT } from './i18n/LanguageProvider';

// Je eigen ontwerpen, met de knop om een nieuw patroon te beginnen.
const MyPatterns = () => {
    const loggedInUser = useAuth().user?.uid;
    const t = useT();
    const [isNewPatternOpen, setIsNewPatternOpen] = useState(false);

    const [snapshot, loading, error] = useCollection(
        loggedInUser ? query(collection(db, 'amigurumi'), where('user_id', '==', loggedInUser)) : null
    );
    const amigurumis = snapshot
        ? (snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Amigurumi[])
        : [];

    const filterActions = useMemo(() => (
        <Button
            type="button"
            variant="contained"
            color="inherit"
            startIcon={<Add />}
            sx={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-bg)', paddingY: 1 }}
            onClick={() => setIsNewPatternOpen(true)}
        >
            {t('patterns.new')}
        </Button>
    ), [t]);

    if (!loggedInUser) {
        return <Typography>{t('patterns.loginRequired')}</Typography>;
    }

    return (
        <>
            <PatternBrowser
                amigurumis={amigurumis}
                loading={loading}
                error={error}
                actions={filterActions}
                emptyMessage={t('patterns.empty')}
            />
            <NewPattern
                open={isNewPatternOpen}
                onClose={() => setIsNewPatternOpen(false)}
            />
        </>
    );
};

export default MyPatterns;
