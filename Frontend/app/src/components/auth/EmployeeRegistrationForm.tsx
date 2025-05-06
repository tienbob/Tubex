import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Divider, 
  Alert, 
  CircularProgress,
  Paper,
  Chip
} from '@mui/material';
import { Google as GoogleIcon, Facebook as FacebookIcon, Business as BusinessIcon } from '@mui/icons-material';
import { Link } from 'react-router-dom';

interface EmployeeRegistrationFormProps {
  onSuccess?: () => void;
}

// This would typically come from an API call
interface Company {
  id: string;
  name: string;
  type: 'dealer' | 'supplier';
}

const EmployeeRegistrationForm: React.FC<EmployeeRegistrationFormProps> = ({ onSuccess }) => {
  const { registerEmployee, error } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    jobTitle: '',
    department: '',
    employeeId: '',
    invitationCode: ''
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<Company | null>(null);
  const [verifyingCode, setVerifyingCode] = useState(false);

  // Effect to verify invitation code and fetch company details
  useEffect(() => {
    const verifyInvitationCode = async (code: string) => {
      if (!code || code.length < 5) return; // Don't verify unless code has minimal length
      
      setVerifyingCode(true);
      try {
        // This would be an actual API call in production
        // For now, just simulating with mock data and a delay
        await new Promise(resolve => setTimeout(resolve, 700));
        
        // Mock response based on code
        if (code === 'TECH123') {
          setCompanyInfo({ id: '1', name: 'TechCorp Ltd.', type: 'supplier' });
        } else if (code === 'AUTO456') {
          setCompanyInfo({ id: '2', name: 'AutoParts Global', type: 'supplier' });
        } else if (code === 'QUICK789') {
          setCompanyInfo({ id: '3', name: 'QuickFix Auto', type: 'dealer' });
        } else {
          setCompanyInfo(null);
          setValidationErrors(prev => ({
            ...prev,
            invitationCode: 'Invalid invitation code'
          }));
        }
      } catch (error) {
        console.error('Error verifying invitation code:', error);
        setValidationErrors(prev => ({
          ...prev,
          invitationCode: 'Error verifying code'
        }));
      } finally {
        setVerifyingCode(false);
      }
    };

    // Add debounce to prevent excessive API calls
    const timeoutId = setTimeout(() => {
      if (formData.invitationCode) {
        verifyInvitationCode(formData.invitationCode);
      } else {
        setCompanyInfo(null);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.invitationCode]);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.firstName) {
      errors.firstName = 'First name is required';
    }

    if (!formData.lastName) {
      errors.lastName = 'Last name is required';
    }

    if (!formData.invitationCode) {
      errors.invitationCode = 'Invitation code is required';
    }

    if (!companyInfo) {
      errors.invitationCode = errors.invitationCode || 'Please enter a valid invitation code';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    if (!companyInfo) {
      setValidationErrors(prev => ({
        ...prev,
        invitationCode: 'Please enter a valid invitation code'
      }));
      return;
    }

    try {
      await registerEmployee({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        jobTitle: formData.jobTitle,
        department: formData.department,
        employeeId: formData.employeeId,
        companyId: companyInfo.id,
        invitationCode: formData.invitationCode
      });
      onSuccess?.();
    } catch (err) {
      // Error handling is managed by the AuthContext
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.name as string;
    const value = e.target.value as string;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleOAuthLogin = (provider: 'google' | 'facebook') => {
    window.location.href = `/api/v1/auth/${provider}`;
  };

  return (
    <Paper elevation={3} sx={{ p: 4, mt: 2, width: '100%', maxWidth: '600px', mx: 'auto' }}>
      <Typography variant="h5" gutterBottom align="center" sx={{ mb: 3 }}>
        Join Your Company on Tubex
      </Typography>
      
      <Typography variant="subtitle1" color="text.secondary" gutterBottom align="center">
        Register as an employee to access your company's Tubex platform
      </Typography>

      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle2" gutterBottom fontWeight="bold">
            Company Information
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Invitation Code"
              name="invitationCode"
              value={formData.invitationCode}
              onChange={handleChange}
              error={!!validationErrors.invitationCode}
              helperText={validationErrors.invitationCode || "Enter the invitation code provided by your company administrator"}
              InputProps={{
                endAdornment: verifyingCode ? <CircularProgress size={20} /> : null
              }}
              required
            />

            {companyInfo && (
              <Box sx={{ 
                p: 2, 
                border: '1px solid #e0e0e0', 
                borderRadius: 1,
                bgcolor: 'background.paper',
                display: 'flex',
                flexDirection: 'column',
                gap: 1
              }}>
                <Typography variant="subtitle2">Company Details:</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BusinessIcon color="primary" />
                  <Typography>{companyInfo.name}</Typography>
                  <Chip 
                    label={companyInfo.type === 'dealer' ? 'Dealer' : 'Supplier'} 
                    size="small" 
                    color={companyInfo.type === 'dealer' ? 'secondary' : 'primary'}
                    sx={{ ml: 'auto' }}
                  />
                </Box>
              </Box>
            )}
          </Box>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle2" gutterBottom fontWeight="bold">
            Account Information
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={!!validationErrors.email}
              helperText={validationErrors.email}
              required
            />

            <TextField
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              error={!!validationErrors.password}
              helperText={validationErrors.password}
              required
            />

            <TextField
              fullWidth
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={!!validationErrors.confirmPassword}
              helperText={validationErrors.confirmPassword}
              required
            />
          </Box>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle2" gutterBottom fontWeight="bold">
            Personal Information
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                error={!!validationErrors.firstName}
                helperText={validationErrors.firstName}
                required
              />
              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                error={!!validationErrors.lastName}
                helperText={validationErrors.lastName}
                required
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Job Title"
                name="jobTitle"
                value={formData.jobTitle}
                onChange={handleChange}
              />
              <TextField
                fullWidth
                label="Department"
                name="department"
                value={formData.department}
                onChange={handleChange}
              />
            </Box>

            <TextField
              fullWidth
              label="Employee ID (if applicable)"
              name="employeeId"
              value={formData.employeeId}
              onChange={handleChange}
            />
          </Box>
        </Box>

        <Button
          type="submit"
          fullWidth
          variant="contained"
          color="primary"
          size="large"
          sx={{ mt: 2 }}
          disabled={!companyInfo || loading}
        >
          Register
        </Button>

        <Divider sx={{ my: 3 }}>
          <Typography variant="body2" color="textSecondary">
            OR
          </Typography>
        </Divider>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<GoogleIcon />}
            onClick={() => handleOAuthLogin('google')}
          >
            Continue with Google
          </Button>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<FacebookIcon />}
            onClick={() => handleOAuthLogin('facebook')}
          >
            Continue with Facebook
          </Button>
        </Box>

        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Typography variant="body2">
            Already have an account? <Link to="/login">Log in here</Link>
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Need to register your company? <Link to="/register">Register your company</Link>
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default EmployeeRegistrationForm;