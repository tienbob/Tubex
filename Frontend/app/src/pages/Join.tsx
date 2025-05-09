import React from 'react';
import { Box, Container, Paper, Typography } from '@mui/material';
import JoinByInvitation from '../components/auth/JoinByInvitation';
import { useNavigate } from 'react-router-dom';

const Join: React.FC = () => {
  const navigate = useNavigate();

  const handleRegistrationSuccess = (userData: any) => {
    // Redirect to dashboard or show a success message
    navigate('/dashboard');
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h4" component="h1" align="center" gutterBottom>
            Join Your Company
          </Typography>
          <Typography variant="body1" align="center" color="text.secondary" paragraph>
            Complete your registration using the invitation code provided by your company administrator.
          </Typography>

          <JoinByInvitation onRegisterSuccess={handleRegistrationSuccess} />
        </Paper>
      </Box>
    </Container>
  );
};

export default Join;