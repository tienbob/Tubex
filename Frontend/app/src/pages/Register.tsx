import React from 'react';
import { Container, Box } from '@mui/material';
import Register from '../components/auth/Register';
import { useNavigate } from 'react-router-dom';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const handleRegisterSuccess = (userData: any) => {
    if (userData.requiresVerification) {
      navigate('/auth/pending-approval', { state: { email: userData.email } });
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Register onRegisterSuccess={handleRegisterSuccess} />
      </Box>
    </Container>
  );
};

export default RegisterPage;
