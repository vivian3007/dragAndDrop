import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { Box, Typography, CircularProgress, Card, CardContent, Avatar, Button } from '@mui/material';
import { auth } from '../firebase-config.js';

const Account: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
            Account
          </Typography>
          <CardContent sx={{ textAlign: 'center' }}>
            <Avatar
              src={user.photoURL || "../img/avatar.jpg"}
              alt={user.displayName || 'User'}
              sx={{ width: 100, height: 100, mx: 'auto', mb: 2 }}
            />
            <Typography variant="body1" sx={{ color: 'var(--color-text)' }} gutterBottom>
              Name: {user.displayName || 'Vivian Vlaanderen'}
            </Typography>
            <Typography variant="body1" sx={{ color: 'var(--color-text)' }} gutterBottom>
              Email: {user.email || 'N/A'}
            </Typography>
            <Typography variant="body2" sx={{ color: 'var(--color-text)' }} gutterBottom>
              UID: {user.uid}
            </Typography>
            <Box sx={{ mt: 3 }}>
              <Button
                variant="contained"
                sx={{ mt: 3, mb: 2, backgroundColor: "var(--color-primary)", color: "var(--color-bg)" }}
                onClick={handleLogout}
              >
                Log Out
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </div>
  );
};

export default Account;