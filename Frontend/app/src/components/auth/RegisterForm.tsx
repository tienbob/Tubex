import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  CardActions, 
  Container, 
  Divider,
  Paper
} from '@mui/material';
import { 
  Business as BusinessIcon, 
  Person as PersonIcon,
  ArrowForward as ArrowForwardIcon 
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import CompanyRegistrationForm from './CompanyRegistrationForm';
import EmployeeRegistrationForm from './EmployeeRegistrationForm';

interface RegisterFormProps {
  onSuccess?: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
  const navigate = useNavigate();
  const [registerType, setRegisterType] = useState<'select' | 'company' | 'employee'>('select');

  const handleCompanyRegistration = () => {
    setRegisterType('company');
  };

  const handleEmployeeRegistration = () => {
    setRegisterType('employee');
  };

  const handleBack = () => {
    setRegisterType('select');
  };

  if (registerType === 'company') {
    return (
      <Box>
        <Button 
          variant="text" 
          onClick={handleBack}
          sx={{ mb: 2 }}
          startIcon={<ArrowForwardIcon sx={{ transform: 'rotate(180deg)' }} />}
        >
          Back to options
        </Button>
        <CompanyRegistrationForm onSuccess={onSuccess} />
      </Box>
    );
  }

  if (registerType === 'employee') {
    return (
      <Box>
        <Button 
          variant="text" 
          onClick={handleBack}
          sx={{ mb: 2 }}
          startIcon={<ArrowForwardIcon sx={{ transform: 'rotate(180deg)' }} />}
        >
          Back to options
        </Button>
        <EmployeeRegistrationForm onSuccess={onSuccess} />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 5 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
          Join Tubex
        </Typography>
        
        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 5 }}>
          Choose how you want to create your account
        </Typography>
        
        <Box display="flex" justifyContent="space-between" flexWrap="wrap">
          <Box width={{ xs: '100%', md: '48%' }} mb={4}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', transition: 'transform 0.3s ease', '&:hover': { transform: 'translateY(-5px)' }, borderRadius: 2 }}>
              <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
                <BusinessIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography gutterBottom variant="h5" component="h2" align="center">
                  Register a Company
                </Typography>
                <Typography color="text.secondary" align="center">
                  Create a new company account to manage your inventory, orders, and team members.
                </Typography>
              </CardContent>
              <Divider />
              <CardActions sx={{ p: 2, justifyContent: 'center' }}>
                <Button 
                  variant="contained" 
                  size="large" 
                  color="primary" 
                  onClick={handleCompanyRegistration}
                  fullWidth
                >
                  Register Company
                </Button>
              </CardActions>
            </Card>
          </Box>
          
          <Box width={{ xs: '100%', md: '48%' }} mb={4}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', transition: 'transform 0.3s ease', '&:hover': { transform: 'translateY(-5px)' }, borderRadius: 2 }}>
              <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
                <PersonIcon sx={{ fontSize: 60, color: 'secondary.main', mb: 2 }} />
                <Typography gutterBottom variant="h5" component="h2" align="center">
                  Join as an Employee
                </Typography>
                <Typography color="text.secondary" align="center">
                  Join your company's existing Tubex account with an invitation code from your administrator.
                </Typography>
              </CardContent>
              <Divider />
              <CardActions sx={{ p: 2, justifyContent: 'center' }}>
                <Button 
                  variant="contained" 
                  size="large" 
                  color="secondary" 
                  onClick={handleEmployeeRegistration}
                  fullWidth
                >
                  Join Company
                </Button>
              </CardActions>
            </Card>
          </Box>
        </Box>

        <Box sx={{ textAlign: 'center', mt: 5 }}>
          <Typography variant="body1">
            Already have an account? <Link to="/login">Log in here</Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default RegisterForm;