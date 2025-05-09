import React from 'react';
import { Container, Box } from '@mui/material';
import Login from '../components/auth/Login';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  const handleLoginSuccess = (userData: any) => {
    navigate('/dashboard');
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Login onLoginSuccess={handleLoginSuccess} />
      </Box>
    </Container>
  );
};

export default LoginPage;
