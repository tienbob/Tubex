import React from 'react';
import { Container, Box } from '@mui/material';
import ResetPassword from '../components/auth/ResetPassword';

const ResetPasswordPage: React.FC = () => {
  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <ResetPassword />
      </Box>
    </Container>
  );
};

export default ResetPasswordPage;
