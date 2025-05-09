import React from 'react';
import { Container, Box } from '@mui/material';
import ForgotPassword from '../components/auth/ForgotPassword';

const ForgotPasswordPage: React.FC = () => {
  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <ForgotPassword />
      </Box>
    </Container>
  );
};

export default ForgotPasswordPage;
