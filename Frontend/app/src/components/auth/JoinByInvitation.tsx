import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  CircularProgress, 
  Alert, 
  Stepper, 
  Step, 
  StepLabel,
  InputAdornment,
  IconButton
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../../services/api';

interface JoinByInvitationProps {
  onRegisterSuccess?: (userData: any) => void;
}

const JoinByInvitation: React.FC<JoinByInvitationProps> = ({ onRegisterSuccess }) => {  const navigate = useNavigate();
  const location = useLocation();
  
  // Get code from URL query parameter or route parameter
  const urlParams = new URLSearchParams(location.search);
  const codeFromQuery = urlParams.get('code');
  
  // Get code from URL path parameter if available (for /join/:invitationCode)
  const pathSegments = location.pathname.split('/');
  const codeFromPath = pathSegments[pathSegments.length - 1] !== 'join' ? pathSegments[pathSegments.length - 1] : null;
  
  // Use either code source
  const codeFromUrl = codeFromQuery || codeFromPath;
  // Form state
  const [invitationCode, setInvitationCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // UI state
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [codeValid, setCodeValid] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
    // Validate the invitation code on component mount if code is provided
  useEffect(() => {
    // Check if we have a code from the URL
    if (codeFromUrl) {
      console.log("Invitation code found in URL:", codeFromUrl);
      setInvitationCode(codeFromUrl);
      validateCode();
    }
  }, []);
  
  const validateCode = async () => {    if (!invitationCode.trim()) {
      setError('Please enter an invitation code');
      return;
    }
    
    setVerifying(true);
    setError(null);
      try {
      console.log('Validating invitation code:', invitationCode);
      const response = await authService.validateInvitationCode(invitationCode);
      console.log('Validation response:', response);
      
      if (response.valid) {
        setCompanyName(response.companyName || null);
        setCompanyId(response.companyId || null);
        setCodeValid(true);
        setActiveStep(1);
        console.log('Code validated successfully. Company ID:', response.companyId);
      } else {
        setError('Invalid or expired invitation code. Please contact your administrator.');
        console.error('Invalid invitation code response:', response);      }
    } catch (err: any) {
      console.error('Error validating invitation code:', err);
      setError(`Failed to verify invitation code: ${err.message || 'Unknown error'}`);
    } finally {
      setVerifying(false);
    }
  };
    const handleNext = () => {
    setError(null);
    
    if (activeStep === 0) {
      validateCode();
    } else if (activeStep === 1) {
      if (validatePersonalInfo()) {
        handleRegistration();
      }
    }
  };
  
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };
  
  const validatePersonalInfo = () => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    } else if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }
    
    if (!password) {
      setError('Password is required');
      return false;
    } else if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    if (!firstName.trim() || !lastName.trim()) {
      setError('First and last name are required');
      return false;
    }
      return true;
  };
  
  const handleRegistration = async () => {
    setLoading(true);
    setError(null);
    
    try {      console.log('Submitting registration with data:', {
        email,
        firstName,
        lastName,
        invitationCode
      });
      
      const response = await authService.registerEmployee({
        email,
        password,
        firstName,
        lastName,
        invitationCode
      });
      
      console.log('Registration response:', response);
      
      if (response.data.requiresVerification) {
        // Redirect to a pending approval page
        console.log('Account requires verification, redirecting to pending approval');
        navigate('/auth/pending-approval', { state: { email } });
      } else {
        // Direct login successful
        console.log('Registration successful, redirecting to dashboard');
        if (onRegisterSuccess) {
          onRegisterSuccess(response.data);
        }
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to complete registration. Please try again.');
      console.error('Error during employee registration:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleTogglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };
  
  // Render different form steps
  const renderCodeVerification = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Join Your Company
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Enter the invitation code provided by your company administrator.
      </Typography>
      
      <TextField
        margin="normal"
        fullWidth
        label="Invitation Code"
        value={invitationCode}
        onChange={(e) => setInvitationCode(e.target.value)}
        disabled={verifying}
        autoFocus
      />
      
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleNext}
          disabled={verifying}
        >
          {verifying ? <CircularProgress size={24} /> : 'Verify Code'}
        </Button>
      </Box>
    </Box>
  );
  
  const renderPersonalInfo = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Personal Information
      </Typography>
      {companyName && (
        <Typography variant="body1" paragraph>
          You're joining <strong>{companyName}</strong>
        </Typography>
      )}
      
      <TextField
        margin="normal"
        fullWidth
        label="Email Address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        type="email"
        disabled={loading}
        required
      />
      
      <TextField
        margin="normal"
        fullWidth
        label="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        type={showPassword ? 'text' : 'password'}
        disabled={loading}
        required
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label="toggle password visibility"
                onClick={handleTogglePasswordVisibility}
                edge="end"
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      
      <TextField
        margin="normal"
        fullWidth
        label="Confirm Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        type={showPassword ? 'text' : 'password'}
        disabled={loading}
        required
      />
      
      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
        <TextField
          margin="normal"
          fullWidth
          label="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          disabled={loading}
          required
        />
        
        <TextField
          margin="normal"
          fullWidth
          label="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          disabled={loading}
          required
        />
      </Box>
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Button onClick={handleBack} disabled={loading}>
          Back
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleNext}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Complete Registration'}
        </Button>
      </Box>
    </Box>
  );
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        maxWidth: '600px',
        mx: 'auto',
        py: 4
      }}
    >
      <Paper sx={{ p: 3, width: '100%' }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          <Step>
            <StepLabel>Invitation</StepLabel>
          </Step>
          <Step>
            <StepLabel>Personal Info</StepLabel>
          </Step>
        </Stepper>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {activeStep === 0 && renderCodeVerification()}
        {activeStep === 1 && renderPersonalInfo()}
      </Paper>
    </Box>
  );
};

export default JoinByInvitation;