import React, { useState } from 'react';
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
  MenuItem,
  FormControl,
  InputLabel,  Select,
  Divider,
  Link as MuiLink,
  InputAdornment,
  IconButton
} from '@mui/material';
import { Visibility, VisibilityOff, Google, Facebook } from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { authService, RegisterCompanyRequest } from '../../services/api/authService';

interface RegisterProps {
  onRegisterSuccess?: (userData: any) => void;
}

const Register: React.FC<RegisterProps> = ({ onRegisterSuccess }) => {
  const navigate = useNavigate();
  
  // Step state
  const [activeStep, setActiveStep] = useState(0);
  
  // Form state - Account Info
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Form state - Company Info
  const [companyName, setCompanyName] = useState('');
  const [companyType, setCompanyType] = useState<'dealer' | 'supplier'>('dealer');
  const [taxId, setTaxId] = useState('');
  const [businessLicense, setBusinessLicense] = useState('');
  const [businessCategory, setBusinessCategory] = useState('');
  const [employeeCount, setEmployeeCount] = useState<number | ''>('');
  const [yearEstablished, setYearEstablished] = useState<number | ''>('');
  
  // Form state - Address Info
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleNext = () => {
    if (activeStep === 0 && !validateAccountInfo()) return;
    if (activeStep === 1 && !validateCompanyInfo()) return;
    
    if (activeStep < 2) {
      setActiveStep((prevStep) => prevStep + 1);
    } else {
      handleSubmit();
    }
  };
  
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };
  
  const validateAccountInfo = () => {
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }
    
    if (!password || password.length < 8) {
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
    
    setError(null);
    return true;
  };
  
  const validateCompanyInfo = () => {
    if (!companyName.trim()) {
      setError('Company name is required');
      return false;
    }
    
    if (!companyType) {
      setError('Please select a company type');
      return false;
    }
    
    if (!taxId.trim()) {
      setError('Tax ID is required');
      return false;
    }
    
    if (!businessLicense.trim()) {
      setError('Business license number is required');
      return false;
    }
    
    setError(null);
    return true;
  };
  
  const handleSubmit = async () => {
    if (!validateAddressInfo()) return;
    
    setLoading(true);
    setError(null);
    
    const registrationData: RegisterCompanyRequest = {
      email,
      password,
      firstName,
      lastName,
      company: {
        name: companyName,
        type: companyType,
        taxId,
        businessLicense,
        address: {
          street,
          city,
          province,
          postalCode
        },
        businessCategory,
        employeeCount: employeeCount as number,
        yearEstablished: yearEstablished as number,
        contactPhone
      }
    };
      try {
      console.log('About to register company with data:', {
        email: registrationData.email,
        company: registrationData.company
      });
      
      const response = await authService.registerCompany(registrationData);
      
      console.log('Registration successful, response:', response);
      
      if (response.data) {
        // Call success callback if provided
        if (onRegisterSuccess) {
          onRegisterSuccess(response.data);
        }
        
        // Check if verification is required
        if (response.data.requiresVerification) {
          navigate('/auth/pending-approval', { state: { email } });
        } else {
          // Direct to dashboard or welcome screen
          navigate('/dashboard');
        }
      } else {
        setError('Registration failed. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const validateAddressInfo = () => {
    if (!street.trim() || !city.trim() || !province.trim() || !postalCode.trim()) {
      setError('All address fields are required');
      return false;
    }
    
    if (!contactPhone.trim()) {
      setError('Contact phone number is required');
      return false;
    }
    
    setError(null);
    return true;
  };
  
  const handleGoogleRegister = () => {
    authService.loginWithGoogle();
  };
  
  const handleFacebookRegister = () => {
    authService.loginWithFacebook();
  };
  
  const handleTogglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };
  
  const renderAccountInfo = () => (
    <Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)' } }}>
          <TextField
            fullWidth
            label="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            autoFocus
          />
        </Box>
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)' } }}>
          <TextField
            fullWidth
            label="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </Box>
        <Box sx={{ flex: '1 1 100%' }}>
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Box>
        <Box sx={{ flex: '1 1 100%' }}>
          <TextField
            fullWidth
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            helperText="Password must be at least 8 characters long"
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
        </Box>
        <Box sx={{ flex: '1 1 100%' }}>
          <TextField
            fullWidth
            label="Confirm Password"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </Box>
      </Box>
    </Box>
  );
  
  const renderCompanyInfo = () => (
    <Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ flex: '1 1 100%' }}>
          <TextField
            fullWidth
            label="Company Name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
          />
        </Box>
        <Box sx={{ flex: '1 1 100%' }}>
          <FormControl fullWidth required>
            <InputLabel id="company-type-label">Company Type</InputLabel>
            <Select
              labelId="company-type-label"
              value={companyType}
              label="Company Type"
              onChange={(e) => setCompanyType(e.target.value as 'dealer' | 'supplier')}
            >
              <MenuItem value="dealer">Dealer</MenuItem>
              <MenuItem value="supplier">Supplier</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)' } }}>
          <TextField
            fullWidth
            label="Tax ID"
            value={taxId}
            onChange={(e) => setTaxId(e.target.value)}
            required
          />
        </Box>
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)' } }}>
          <TextField
            fullWidth
            label="Business License Number"
            value={businessLicense}
            onChange={(e) => setBusinessLicense(e.target.value)}
            required
          />
        </Box>
        <Box sx={{ flex: '1 1 100%' }}>
          <TextField
            fullWidth
            label="Business Category"
            value={businessCategory}
            onChange={(e) => setBusinessCategory(e.target.value)}
          />
        </Box>
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)' } }}>
          <TextField
            fullWidth
            label="Number of Employees"
            type="number"
            value={employeeCount}
            onChange={(e) => setEmployeeCount(e.target.value === '' ? '' : Number(e.target.value))}
            inputProps={{ min: 1 }}
          />
        </Box>
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)' } }}>
          <TextField
            fullWidth
            label="Year Established"
            type="number"
            value={yearEstablished}
            onChange={(e) => setYearEstablished(e.target.value === '' ? '' : Number(e.target.value))}
            inputProps={{ min: 1900, max: new Date().getFullYear() }}
          />
        </Box>
      </Box>
    </Box>
  );
  
  const renderAddressInfo = () => (
    <Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ flex: '1 1 100%' }}>
          <TextField
            fullWidth
            label="Street Address"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            required
          />
        </Box>
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)' } }}>
          <TextField
            fullWidth
            label="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
          />
        </Box>
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)' } }}>
          <TextField
            fullWidth
            label="Province/State"
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            required
          />
        </Box>
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)' } }}>
          <TextField
            fullWidth
            label="Postal/Zip Code"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            required
          />
        </Box>
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)' } }}>
          <TextField
            fullWidth
            label="Contact Phone"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            required
          />
        </Box>
      </Box>
    </Box>
  );
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        maxWidth: '700px',
        mx: 'auto',
        py: 4
      }}
    >
      <Paper sx={{ p: 3, width: '100%' }}>
        <Typography variant="h5" component="h1" align="center" gutterBottom>
          Register your Company
        </Typography>
        
        <Stepper activeStep={activeStep} sx={{ my: 3 }}>
          <Step>
            <StepLabel>Account</StepLabel>
          </Step>
          <Step>
            <StepLabel>Company</StepLabel>
          </Step>
          <Step>
            <StepLabel>Address</StepLabel>
          </Step>
        </Stepper>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {activeStep === 0 && renderAccountInfo()}
        {activeStep === 1 && renderCompanyInfo()}
        {activeStep === 2 && renderAddressInfo()}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            onClick={handleBack}
            disabled={activeStep === 0 || loading}
          >
            Back
          </Button>
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 
              activeStep === 2 ? 'Register' : 'Next'}
          </Button>
        </Box>
        
        {activeStep === 0 && (
          <>
            <Divider sx={{ my: 3 }}>OR</Divider>
            
            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Google />}
                onClick={handleGoogleRegister}
                disabled={loading}
                sx={{ mb: { xs: 1, sm: 0 } }}
              >
                Register with Google
              </Button>
              
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Facebook />}
                onClick={handleFacebookRegister}
                disabled={loading}
              >
                Register with Facebook
              </Button>
            </Box>
          </>
        )}
        
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2">
            Already have an account?{' '}
            <MuiLink component={Link} to="/login" underline="hover">
              Log in
            </MuiLink>
          </Typography>
          
          <Typography variant="body2" sx={{ mt: 1 }}>
            Have an invitation code?{' '}
            <MuiLink component={Link} to="/join" underline="hover">
              Join your company
            </MuiLink>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default Register;
