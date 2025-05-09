import React from 'react';
import { 
  Container, 
  Box, 
  Paper, 
  Typography, 
  Button 
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';

const PendingApproval: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || 'your email';

  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 8 }}>
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center' 
          }}
        >
          <Typography component="h1" variant="h4" gutterBottom>
            Registration Pending
          </Typography>

          <Box 
            component="img" 
            src="/pending-approval.svg" 
            alt="Pending Approval" 
            sx={{ 
              width: 150, 
              height: 150, 
              objectFit: 'contain',
              my: 3, 
            }}
            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
              e.currentTarget.style.display = 'none';
            }}
          />

          <Typography align="center" paragraph>
            Your registration has been submitted and is pending approval by your company administrator.
          </Typography>

          <Typography align="center" variant="body2" color="text.secondary" paragraph>
            We've sent a confirmation to <strong>{email}</strong>. You will receive 
            an email notification once your account has been approved.
          </Typography>

          <Box sx={{ mt: 3 }}>
            <Button 
              variant="contained" 
              color="primary" 
              fullWidth 
              onClick={() => navigate('/login')}
            >
              Return to Login
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default PendingApproval;