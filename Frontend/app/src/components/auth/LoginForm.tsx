import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Paper, Typography, Box, Alert, Button } from '@mui/material';
import { FormLoginComponent } from '../forms';

/**
 * Complete login page component with navigation and authentication
 */
const LoginForm: React.FC = () => {
  const { login, error, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (email: string, password: string) => {
    await login(email, password);
    navigate('/');
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 400, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" component="h1" gutterBottom>
        Login
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <FormLoginComponent 
        onSubmit={handleLogin}
        isLoading={loading}
      />
      
      <Box sx={{ textAlign: 'center', mt: 2 }}>
        <Typography variant="body2">
          <Button 
            onClick={() => navigate('/register')}
            variant="text" 
            size="small"
          >
            Don't have an account? Sign Up
          </Button>
        </Typography>
        <Typography variant="body2">
          <Button 
            onClick={() => navigate('/forgot-password')}
            variant="text" 
            size="small"
          >
            Forgot password?
          </Button>
        </Typography>
      </Box>
    </Paper>
  );
};

export default LoginForm;