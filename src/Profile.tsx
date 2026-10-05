import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Avatar, Box, Button, Skeleton, Typography } from '@mui/material';
import { Settings } from '@mui/icons-material';
import { collection, doc, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { db } from '../firebase-config.js';
import { useAuth } from './auth/AuthProvider';
import AmigurumiCard from './AmigurumiCard.tsx';
import MasonryGrid from './MasonryGrid.tsx';
import PatternDetail from './PatternDetail.tsx';
import { MakeGrid, useMakes } from './Makes.tsx';
import { CardGridSkeleton, ProfileHeaderSkeleton } from './Skeletons.tsx';
import { useResponsiveMinColumns } from './useResponsiveMinColumns.ts';
import { lookupUidByUsername } from './users/usernames';
import { useT } from './i18n/LanguageProvider';

// Openbaar profiel, op gebruikersnaam (/profile/:username). Ontwerpen en foto's slaan hun
// eigenaar op als uid; dat zoeken we hier bij de naam op.
const Profile = () => {
    const { username = '' } = useParams();
    const t = useT();
    const [uid, setUid] = useState<string | null | undefined>(undefined);

    useEffect(() => {
        setUid(undefined);
        lookupUidByUsername(username)
            .then(setUid)
            .catch((err) => {
                console.error('Fout bij ophalen van profiel:', err);
                setUid(null);
            });
    }, [username]);

    if (uid === undefined) {
        return (
            <div className="my-pattern profile-page">
                <ProfileHeaderSkeleton />
                <h2 className="profile-section-title">{t('profile.designs')}</h2>
                <CardGridSkeleton className="my-pattern-container" count={3} />
            </div>
        );
    }
    if (!uid) {
        return <Typography sx={{ m: 5 }}>{t('profile.notFound', { username })}</Typography>;
    }
    return <ProfileContent key={uid} userId={uid} username={username} />;
};

// Inhoud van het profiel. `userId` is het uid waarmee ontwerpen/foto's zijn opgeslagen.
const ProfileContent = ({ userId, username }: { userId: string; username: string }) => {
    const navigate = useNavigate();
    const t = useT();
    const minColumns = useResponsiveMinColumns();
    const isOwnProfile = useAuth().user?.uid === userId;

    const [selectedAmigurumi, setSelectedAmigurumi] = useState<Amigurumi | null>(null);
    const { makes, loading: makesLoading } = useMakes('user_id', userId);

    const [snapshot, loading, error] = useCollection(
        query(collection(db, 'amigurumi'), where('user_id', '==', userId))
    );
    const amigurumis = snapshot
        ? (snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Amigurumi[])
            .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))
        : [];

    // Een gemaakte amigurumi hoort bij een patroon van (meestal) iemand anders. Die ontwerpen
    // luisteren we live, zodat de Patroon- en hartjesknop op de kaarten actueel blijven.
    // `null` betekent dat het ontwerp verwijderd is.
    const [makeDesigns, setMakeDesigns] = useState<Record<string, Amigurumi | null>>({});

    // Op de (gesorteerde) ids, zodat een nieuwe snapshot van dezelfde foto's niet alle
    // listeners opnieuw opzet.
    const makeDesignIds = Array.from(new Set(makes.map((m) => m.amigurumi_id))).sort().join(',');

    useEffect(() => {
        const ids = makeDesignIds ? makeDesignIds.split(',') : [];
        const unsubscribes = ids.map((id) =>
            onSnapshot(
                doc(db, 'amigurumi', id),
                (snap) => setMakeDesigns((prev) => ({
                    ...prev,
                    [id]: snap.exists() ? ({ id: snap.id, ...snap.data() } as Amigurumi) : null,
                })),
                (err) => console.error('Fout bij ophalen van patroon:', err)
            )
        );
        return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
    }, [makeDesignIds]);

    const handlePatternClick = useCallback(async (amigurumi: Amigurumi) => {
        try {
            const shapesSnapshot = await getDocs(query(collection(db, 'shapes'), where('amigurumi_id', '==', amigurumi.id)));
            const shapes = shapesSnapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Shape[];
            navigate(`/${amigurumi.id}/pattern`, { state: { amigurumi, shapes, intersections: [] } });
        } catch (err) {
            console.error('Fout bij het ophalen van shapes:', err);
        }
    }, [navigate]);


    return (
        <div className="my-pattern profile-page">
            <Box className="profile-header">
                <Avatar sx={{ width: 72, height: 72, fontSize: '2rem', backgroundColor: 'var(--color-primary)', color: 'var(--color-bg)' }}>
                    {username.charAt(0).toUpperCase()}
                </Avatar>
                <div>
                    <h1 className="profile-name">@{username}</h1>
                    {loading || makesLoading ? (
                        <Skeleton variant="text" width={220} sx={{ bgcolor: 'var(--color-accent-soft)' }} />
                    ) : (
                        <Typography sx={{ opacity: 0.8 }}>
                            {t('profile.stats', { designs: amigurumis.length, makes: makes.length })}
                            {isOwnProfile ? ` · ${t('profile.yours')}` : ''}
                        </Typography>
                    )}
                </div>
                {isOwnProfile && (
                    <div className="profile-header-actions">
                        <Button
                            component={Link}
                            to="/account"
                            variant="outlined"
                            startIcon={<Settings />}
                            sx={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
                        >
                            {t('nav.settings')}
                        </Button>
                    </div>
                )}
            </Box>

            <h2 className="profile-section-title">{t('profile.designs')}</h2>
            {loading ? (
                <CardGridSkeleton className="my-pattern-container" count={3} />
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
                            onPatternClick={handlePatternClick}
                            onCardClick={setSelectedAmigurumi}
                        />
                    )}
                />
            )}

            <h2 className="profile-section-title">{t('profile.makes')}</h2>
            <div className="profile-makes">
                {makesLoading ? (
                    <CardGridSkeleton count={3} withTags={false} />
                ) : makes.length === 0 ? (
                    <Typography>{t('profile.noMakes')}</Typography>
                ) : (
                    <MakeGrid
                        makes={makes}
                        caption="design"
                        designs={makeDesigns}
                        onDesignClick={setSelectedAmigurumi}
                        onPatternClick={handlePatternClick}
                    />
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
