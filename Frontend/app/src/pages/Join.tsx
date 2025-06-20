import React from 'react';
import { Box, Container, Paper, Typography, Alert } from '@mui/material';
import JoinByInvitation from '../components/auth/JoinByInvitation';
import { useNavigate, useParams, useLocation } from 'react-router-dom';

const Join: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { invitationCode } = useParams<{ invitationCode?: string }>();
  
  // Check if we have a code either from route params or query params
  const urlParams = new URLSearchParams(location.search);
  const codeFromQuery = urlParams.get('code');
  const hasInvitationCode = invitationCode || codeFromQuery;
  const handleRegistrationSuccess = (userData: any) => {
    // Log the success data for debugging
    console.log("Registration successful, user data:", userData);
    
    // Store any necessary data in local storage
    localStorage.setItem("registration_success", "true");
    
    // Redirect to dashboard or show a success message
    navigate('/dashboard');
  };
  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h4" component="h1" align="center" gutterBottom>
            Join Your Company
          </Typography>          <Typography variant="body1" align="center" color="text.secondary" paragraph>
            {hasInvitationCode ? 
              "Complete your registration using the invitation code we've detected to join your company's workspace." :
              "Please enter the invitation code provided by your company administrator to create your account and join your company's workspace."
            }
          </Typography>
          
          {hasInvitationCode && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Invitation code detected! Please complete the registration form below.
            </Alert>
          )}

          <JoinByInvitation onRegisterSuccess={handleRegistrationSuccess} />
        </Paper>
      </Box>
    </Container>
  );
};

export default Join;