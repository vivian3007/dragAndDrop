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
        navigate('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = () => {
    auth.signOut()
      .then(() => {
        navigate('/login');
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
          <Card sx={{ padding: 3 }}>
            <CircularProgress />
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
        <Card sx={{ padding: 3 }}>
          <Typography component="h1" variant="h5" sx={{ textAlign: 'center' }}>
            Account
          </Typography>
          <CardContent sx={{ textAlign: 'center' }}>
            <Avatar
              src={user.photoURL || undefined}
              alt={user.displayName || 'User'}
              sx={{ width: 100, height: 100, mx: 'auto', mb: 2 }}
            />
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Name: {user.displayName || 'N/A'}
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Email: {user.email || 'N/A'}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              UID: {user.uid}
            </Typography>
            <Box sx={{ mt: 3 }}>
              <Button
                variant="contained"
                color="error"
                sx={{ mt: 3, mb: 2, backgroundColor: "#d4929a" }}
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