import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { Box, Typography, CircularProgress, Card, CardContent, Avatar, Button } from '@mui/material';
import { auth } from '../firebase-config.js';
import { useT } from './i18n/LanguageProvider';
import { profilePath } from './UserLink.tsx';

const Account: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const t = useT();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
        navigate('/');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = () => {
    auth.signOut()
      .then(() => {
        navigate('/');
      })
      .catch((error) => {
        console.error('Logout error:', error);
      });
  };

  if (loading) {
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
          <Card sx={{ padding: 3, backgroundColor: 'var(--color-bg-card)' }}>
            <CircularProgress sx={{ color: 'var(--color-primary)' }} />
          </Card>
        </Box>
      </div>
    );
  }

  if (!user) {
    return null; // Redirect handled in useEffect
  }

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
        <Card sx={{ padding: 3, backgroundColor: 'var(--color-bg-card)' }}>
          <Typography component="h1" variant="h5" sx={{ textAlign: 'center', color: 'var(--color-text)' }}>
            {t('account.title')}
          </Typography>
          <CardContent sx={{ textAlign: 'center' }}>
            <Avatar
              src={user.photoURL || "../img/avatar.jpg"}
              alt={user.displayName || t('nav.account')}
              sx={{ width: 100, height: 100, mx: 'auto', mb: 2 }}
            />
            <Typography variant="body1" sx={{ color: 'var(--color-text)' }} gutterBottom>
              {t('account.name')}: {user.displayName || 'Vivian Vlaanderen'}
            </Typography>
            <Typography variant="body1" sx={{ color: 'var(--color-text)' }} gutterBottom>
              {t('account.email')}: {user.email || t('account.notAvailable')}
            </Typography>
            <Typography variant="body2" sx={{ color: 'var(--color-text)' }} gutterBottom>
              UID: {user.uid}
            </Typography>
            <Box sx={{ mt: 3 }}>
              {user.email && (
                <Button
                  component={Link}
                  to={profilePath(user.email)}
                  variant="outlined"
                  sx={{ mt: 3, mb: 2, mr: 1, borderColor: "var(--color-primary)", color: "var(--color-primary)" }}
                >
                  {t('account.viewProfile')}
                </Button>
              )}
              <Button
                variant="contained"
                sx={{ mt: 3, mb: 2, backgroundColor: "var(--color-primary)", color: "var(--color-bg)" }}
                onClick={handleLogout}
              >
                {t('account.logOut')}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </div>
  );
};

export default Account;