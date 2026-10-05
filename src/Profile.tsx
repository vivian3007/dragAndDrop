import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Avatar, Box, CircularProgress, Typography } from '@mui/material';
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { db } from '../firebase-config.js';
import { useAuth } from './auth/AuthProvider';
import AmigurumiCard from './AmigurumiCard.tsx';
import MasonryGrid from './MasonryGrid.tsx';
import PatternDetail from './PatternDetail.tsx';
import { fetchMakes, MakeGrid } from './Makes.tsx';
import { useResponsiveMinColumns } from './useResponsiveMinColumns.ts';
import { lookupUserByUsername } from './users/usernames';
import { useT } from './i18n/LanguageProvider';

// Openbaar profiel, op gebruikersnaam (/profile/:username). Ontwerpen en foto's slaan hun
// eigenaar op als e-mailadres; dat zoeken we hier op, maar tonen het nergens.
const Profile = () => {
    const { username = '' } = useParams();
    const t = useT();
    const [profile, setProfile] = useState<{ email: string; username: string } | null | undefined>(undefined);

    useEffect(() => {
        setProfile(undefined);
        lookupUserByUsername(username)
            .then((found) => setProfile(found ? { email: found.email, username: found.username } : null))
            .catch((err) => {
                console.error('Fout bij ophalen van profiel:', err);
                setProfile(null);
            });
    }, [username]);

    if (profile === undefined) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>;
    }
    if (!profile) {
        return <Typography sx={{ m: 5 }}>{t('profile.notFound', { username })}</Typography>;
    }
    return <ProfileContent key={profile.email} userId={profile.email} username={profile.username} />;
};

// Inhoud van het profiel. `userId` is het e-mailadres waarmee ontwerpen/foto's zijn opgeslagen.
const ProfileContent = ({ userId, username }: { userId: string; username: string }) => {
    const navigate = useNavigate();
    const t = useT();
    const minColumns = useResponsiveMinColumns();
    const isOwnProfile = useAuth().user?.email === userId;

    const [selectedAmigurumi, setSelectedAmigurumi] = useState<Amigurumi | null>(null);
    const [makes, setMakes] = useState<Make[]>([]);
    const [makesLoading, setMakesLoading] = useState(true);

    const [snapshot, loading, error] = useCollection(
        query(collection(db, 'amigurumi'), where('user_id', '==', userId))
    );
    const amigurumis = snapshot
        ? (snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Amigurumi[])
            .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))
        : [];

    useEffect(() => {
        setMakesLoading(true);
        setSelectedAmigurumi(null);
        fetchMakes('user_id', userId)
            .then(setMakes)
            .catch((err) => console.error('Fout bij ophalen van gemaakte knuffels:', err))
            .finally(() => setMakesLoading(false));
    }, [userId]);

    const handleFavoriteChange = useCallback(async (amigurumi: Amigurumi) => {
        try {
            await updateDoc(doc(db, 'amigurumi', amigurumi.id), { favorite: !amigurumi.favorite });
        } catch (err) {
            console.error('Error updating favorite:', err);
        }
    }, []);

    const handlePatternClick = useCallback(async (amigurumi: Amigurumi) => {
        try {
            const shapesSnapshot = await getDocs(query(collection(db, 'shapes'), where('amigurumi_id', '==', amigurumi.id)));
            const shapes = shapesSnapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Shape[];
            navigate(`/${amigurumi.id}/pattern`, { state: { amigurumi, shapes, intersections: [] } });
        } catch (err) {
            console.error('Fout bij het ophalen van shapes:', err);
        }
    }, [navigate]);

    // Een gemaakte knuffel hoort bij een patroon van (meestal) iemand anders; dat patroon
    // wordt pas bij een klik opgehaald. Bestaat het niet meer, dan gebeurt er niets.
    const handleMakeDesignClick = useCallback(async (make: Make) => {
        try {
            const snap = await getDoc(doc(db, 'amigurumi', make.amigurumi_id));
            if (snap.exists()) {
                setSelectedAmigurumi({ id: snap.id, ...snap.data() } as Amigurumi);
            }
        } catch (err) {
            console.error('Fout bij ophalen van patroon:', err);
        }
    }, []);

    return (
        <div className="my-pattern profile-page">
            <Box className="profile-header">
                <Avatar sx={{ width: 72, height: 72, fontSize: '2rem', backgroundColor: 'var(--color-primary)', color: 'var(--color-bg)' }}>
                    {username.charAt(0).toUpperCase()}
                </Avatar>
                <div>
                    <h1 className="profile-name">@{username}</h1>
                    <Typography sx={{ opacity: 0.8 }}>
                        {t('profile.stats', { designs: amigurumis.length, makes: makes.length })}
                        {isOwnProfile ? ` · ${t('profile.yours')}` : ''}
                    </Typography>
                </div>
            </Box>

            <h2 className="profile-section-title">{t('profile.designs')}</h2>
            {loading ? (
                <CircularProgress />
            ) : error ? (
                <Typography color="error">{t('patterns.loadError', { message: error.message })}</Typography>
            ) : amigurumis.length === 0 ? (
                <Typography className="profile-empty">{t('profile.noDesigns')}</Typography>
            ) : (
                <MasonryGrid
                    className="my-pattern-container"
                    items={amigurumis}
                    columnWidth={300}
                    minColumns={minColumns}
                    compactGap={10}
                    gap={20}
                    renderItem={(amigurumi) => (
                        <AmigurumiCard
                            key={amigurumi.id}
                            amigurumi={amigurumi}
                            onFavoriteChange={handleFavoriteChange}
                            onPatternClick={handlePatternClick}
                            onCardClick={setSelectedAmigurumi}
                        />
                    )}
                />
            )}

            <h2 className="profile-section-title">{t('profile.makes')}</h2>
            <div className="profile-makes">
                {makesLoading ? (
                    <CircularProgress />
                ) : makes.length === 0 ? (
                    <Typography>{t('profile.noMakes')}</Typography>
                ) : (
                    <MakeGrid makes={makes} caption="design" onDesignClick={handleMakeDesignClick} />
                )}
            </div>

            <PatternDetail
                amigurumi={selectedAmigurumi}
                open={!!selectedAmigurumi}
                onClose={() => setSelectedAmigurumi(null)}
            />
        </div>
    );
};

export default Profile;
