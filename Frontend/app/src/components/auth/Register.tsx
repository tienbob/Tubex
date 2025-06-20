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
  InputLabel,  
  Select,
  Divider,
  Link as MuiLink,
  InputAdornment,
  IconButton,
  LinearProgress
} from '@mui/material';
import { Visibility, VisibilityOff, Google, Facebook, CheckCircle } from '@mui/icons-material';
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
  const [businessLicense, setBusinessLicense] = useState('');  const [businessCategory, setBusinessCategory] = useState('');
  const [yearEstablished, setYearEstablished] = useState<number | ''>('');
    // Form state - Address Info
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [contactPhone, setContactPhone] = useState('');
    // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Real-time validation state
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  const [fieldTouched, setFieldTouched] = useState<{[key: string]: boolean}>({});
  
  // Real-time validation functions
  const validateField = (fieldName: string, value: any) => {
    let errorMessage = '';
    
    switch (fieldName) {
      case 'email':
        if (!value.trim()) {
          errorMessage = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errorMessage = 'Please enter a valid email address';
        }
        break;
      case 'password':
        if (!value) {
          errorMessage = 'Password is required';
        } else if (value.length < 8) {
          errorMessage = 'Password must be at least 8 characters long';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          errorMessage = 'Password must contain uppercase, lowercase, and number';
        }
        break;
      case 'confirmPassword':
        if (!value) {
          errorMessage = 'Please confirm your password';
        } else if (value !== password) {
          errorMessage = 'Passwords do not match';
        }
        break;
      case 'firstName':
        if (!value.trim()) {
          errorMessage = 'First name is required';
        } else if (value.trim().length < 2) {
          errorMessage = 'First name must be at least 2 characters';
        }
        break;
      case 'lastName':
        if (!value.trim()) {
          errorMessage = 'Last name is required';
        } else if (value.trim().length < 2) {
          errorMessage = 'Last name must be at least 2 characters';
        }
        break;
      case 'companyName':
        if (!value.trim()) {
          errorMessage = 'Company name is required';
        } else if (value.trim().length < 2) {
          errorMessage = 'Company name must be at least 2 characters';
        }
        break;      case 'taxId':
        if (!value.trim()) {
          errorMessage = 'Tax ID is required';
        } else if (!/^\d{10}$/.test(value.trim())) {
          errorMessage = 'Tax ID must be exactly 10 digits';
        }
        break;
      case 'businessLicense':
        if (!value.trim()) {
          errorMessage = 'Business license is required';
        } else if (value.trim().length < 5) {
          errorMessage = 'Business license must be at least 5 characters';
        }
        break;
      case 'yearEstablished':
        const year = Number(value);
        const currentYear = new Date().getFullYear();
        if (value && (isNaN(year) || year < 1900 || year > currentYear)) {
          errorMessage = `Year must be between 1900 and ${currentYear}`;
        }
        break;
      case 'street':
        if (!value.trim()) {
          errorMessage = 'Street address is required';
        }
        break;
      case 'city':
        if (!value.trim()) {
          errorMessage = 'City is required';
        }
        break;
      case 'province':
        if (!value.trim()) {
          errorMessage = 'Province/State is required';
        }
        break;
      case 'contactPhone':
        if (!value.trim()) {
          errorMessage = 'Contact phone is required';
        } else if (!/^[\+]?[\d\s\-\(\)]{10,}$/.test(value.replace(/\s/g, ''))) {
          errorMessage = 'Please enter a valid phone number';
        }
        break;
    }
    
    setFieldErrors(prev => ({
      ...prev,
      [fieldName]: errorMessage
    }));
    
    return errorMessage === '';
  };
  
  const handleFieldChange = (fieldName: string, value: any, setter: (value: any) => void) => {
    setter(value);
    if (fieldTouched[fieldName]) {
      validateField(fieldName, value);
    }
  };
  
  const handleFieldBlur = (fieldName: string, value: any) => {
    setFieldTouched(prev => ({ ...prev, [fieldName]: true }));
    validateField(fieldName, value);
  };
    const handleNext = () => {
    if (activeStep === 0 && !validateAccountInfo()) return;
    if (activeStep === 1 && !validateCompanyInfo()) return;
    
    if (activeStep < 2) {
      setActiveStep((prevStep) => prevStep + 1);
      setError(null); // Clear any previous errors when moving to next step
    } else {
      handleSubmit();
    }
  };
  
  // Helper function to check if current step is valid
  const isCurrentStepValid = () => {
    switch (activeStep) {
      case 0:
        return ['email', 'password', 'confirmPassword', 'firstName', 'lastName'].every(field => 
          !fieldErrors[field] && (fieldTouched[field] || field === 'confirmPassword' ? !!{
            email, password, confirmPassword, firstName, lastName
          }[field] : true)
        );
      case 1:
        return ['companyName', 'companyType', 'taxId', 'businessLicense'].every(field => 
          !fieldErrors[field] && !!{
            companyName, companyType, taxId, businessLicense
          }[field]
        );
      case 2:
        return ['street', 'city', 'province', 'contactPhone'].every(field => 
          !fieldErrors[field] && !!{
            street, city, province, contactPhone
          }[field]
        );
      default:        return false;
    }
  };
  
  // Calculate form completion progress
  const getFormProgress = () => {
    const allFields = [
      email, password, confirmPassword, firstName, lastName,
      companyName, companyType, taxId, businessLicense,
      street, city, province, contactPhone
    ];
    const filledFields = allFields.filter(field => field && field.toString().trim()).length;
    return Math.round((filledFields / allFields.length) * 100);
  };
    // Get step completion status
  const getStepStatus = (step: number): boolean => {
    switch (step) {
      case 0:
        return !!(email && password && confirmPassword && firstName && lastName && 
               !fieldErrors.email && !fieldErrors.password && !fieldErrors.confirmPassword && 
               !fieldErrors.firstName && !fieldErrors.lastName);
      case 1:
        return !!(companyName && companyType && taxId && businessLicense &&
               !fieldErrors.companyName && !fieldErrors.taxId && !fieldErrors.businessLicense);
      case 2:
        return !!(street && city && province && contactPhone &&
               !fieldErrors.street && !fieldErrors.city && !fieldErrors.province && !fieldErrors.contactPhone);
      default:
        return false;
    }
  };
  
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };
    const validateAccountInfo = () => {
    const fields = ['email', 'password', 'confirmPassword', 'firstName', 'lastName'];
    let isValid = true;
    
    fields.forEach(field => {
      const fieldValue = {
        email,
        password,
        confirmPassword,
        firstName,
        lastName
      }[field];
      
      setFieldTouched(prev => ({ ...prev, [field]: true }));
      if (!validateField(field, fieldValue)) {
        isValid = false;
      }
    });
    
    if (!isValid) {
      setError('Please fix the errors above before continuing');
    } else {
      setError(null);
    }
    
    return isValid;
  };
    const validateCompanyInfo = () => {
    const fields = ['companyName', 'companyType', 'taxId', 'businessLicense'];
    let isValid = true;
    
    fields.forEach(field => {
      const fieldValue = {
        companyName,
        companyType,
        taxId,
        businessLicense
      }[field];
      
      setFieldTouched(prev => ({ ...prev, [field]: true }));
      if (!validateField(field, fieldValue)) {
        isValid = false;
      }
    });
    
    if (!isValid) {
      setError('Please fix the errors above before continuing');
    } else {
      setError(null);
    }
    
    return isValid;
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
        businessLicense,        address: {
          street,
          city,
          province        },
        businessCategory,
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
    const fields = ['street', 'city', 'province', 'contactPhone'];
    let isValid = true;
    
    fields.forEach(field => {
      const fieldValue = {
        street,
        city,
        province,
        contactPhone
      }[field];
      
      setFieldTouched(prev => ({ ...prev, [field]: true }));
      if (!validateField(field, fieldValue)) {
        isValid = false;
      }
    });
    
    if (!isValid) {
      setError('Please fix the errors above before continuing');
    } else {
      setError(null);
    }
    
    return isValid;
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
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)' } }}>
          <TextField
            fullWidth
            label="First Name"
            value={firstName}
            onChange={(e) => handleFieldChange('firstName', e.target.value, setFirstName)}
            onBlur={(e) => handleFieldBlur('firstName', e.target.value)}
            error={fieldTouched.firstName && !!fieldErrors.firstName}
            helperText={fieldTouched.firstName && fieldErrors.firstName}
            required
            autoFocus
          />
        </Box>
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)' } }}>
          <TextField
            fullWidth
            label="Last Name"
            value={lastName}
            onChange={(e) => handleFieldChange('lastName', e.target.value, setLastName)}
            onBlur={(e) => handleFieldBlur('lastName', e.target.value)}
            error={fieldTouched.lastName && !!fieldErrors.lastName}
            helperText={fieldTouched.lastName && fieldErrors.lastName}
            required
          />
        </Box>
        <Box sx={{ flex: '1 1 100%' }}>
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => handleFieldChange('email', e.target.value, setEmail)}
            onBlur={(e) => handleFieldBlur('email', e.target.value)}
            error={fieldTouched.email && !!fieldErrors.email}
            helperText={fieldTouched.email && fieldErrors.email}
            required
          />
        </Box>
        <Box sx={{ flex: '1 1 100%' }}>
          <TextField
            fullWidth
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => handleFieldChange('password', e.target.value, setPassword)}
            onBlur={(e) => handleFieldBlur('password', e.target.value)}
            error={fieldTouched.password && !!fieldErrors.password}
            helperText={fieldTouched.password && fieldErrors.password || "Must contain uppercase, lowercase, and number"}
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
        </Box>
        <Box sx={{ flex: '1 1 100%' }}>
          <TextField
            fullWidth
            label="Confirm Password"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => handleFieldChange('confirmPassword', e.target.value, setConfirmPassword)}
            onBlur={(e) => handleFieldBlur('confirmPassword', e.target.value)}
            error={fieldTouched.confirmPassword && !!fieldErrors.confirmPassword}
            helperText={fieldTouched.confirmPassword && fieldErrors.confirmPassword}
            required
          />
        </Box>
      </Box>
    </Box>
  );
  
  const renderCompanyInfo = () => (
    <Box>      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ flex: '1 1 100%' }}>
          <TextField
            fullWidth
            label="Company Name"
            value={companyName}
            onChange={(e) => handleFieldChange('companyName', e.target.value, setCompanyName)}
            onBlur={(e) => handleFieldBlur('companyName', e.target.value)}
            error={fieldTouched.companyName && !!fieldErrors.companyName}
            helperText={fieldTouched.companyName && fieldErrors.companyName}
            required
          />
        </Box>
        <Box sx={{ flex: '1 1 100%' }}>
          <FormControl fullWidth required error={fieldTouched.companyType && !!fieldErrors.companyType}>
            <InputLabel id="company-type-label">Company Type</InputLabel>
            <Select
              labelId="company-type-label"
              value={companyType}
              label="Company Type"
              onChange={(e) => handleFieldChange('companyType', e.target.value, setCompanyType)}
              onBlur={(e) => handleFieldBlur('companyType', e.target.value)}
            >
              <MenuItem value="dealer">Dealer</MenuItem>
              <MenuItem value="supplier">Supplier</MenuItem>
            </Select>
            {fieldTouched.companyType && fieldErrors.companyType && (
              <Typography variant="caption" color="error" sx={{ ml: 2, mt: 0.5 }}>
                {fieldErrors.companyType}
              </Typography>
            )}
          </FormControl>
        </Box>        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)' } }}>
          <TextField
            fullWidth
            label="Tax ID"
            value={taxId}
            onChange={(e) => {
              // Only allow numeric input and limit to 10 characters
              const numericValue = e.target.value.replace(/\D/g, '').slice(0, 10);
              handleFieldChange('taxId', numericValue, setTaxId);
            }}
            onBlur={(e) => handleFieldBlur('taxId', e.target.value)}
            error={fieldTouched.taxId && !!fieldErrors.taxId}
            helperText={fieldTouched.taxId && fieldErrors.taxId || "Must be exactly 10 digits"}
            inputProps={{ 
              maxLength: 10,
              pattern: '[0-9]*',
              inputMode: 'numeric'
            }}
            required
          />
        </Box>
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)' } }}>
          <TextField
            fullWidth
            label="Business License Number"
            value={businessLicense}
            onChange={(e) => handleFieldChange('businessLicense', e.target.value, setBusinessLicense)}
            onBlur={(e) => handleFieldBlur('businessLicense', e.target.value)}
            error={fieldTouched.businessLicense && !!fieldErrors.businessLicense}
            helperText={fieldTouched.businessLicense && fieldErrors.businessLicense}
            required
          />
        </Box>
        <Box sx={{ flex: '1 1 100%' }}>
          <TextField
            fullWidth
            label="Business Category"
            value={businessCategory}
            onChange={(e) => setBusinessCategory(e.target.value)}
            helperText="Optional - e.g., Electronics, Automotive, etc."
          />        </Box>
        <Box sx={{ flex: '1 1 100%' }}>
          <TextField
            fullWidth
            label="Year Established"
            type="number"
            value={yearEstablished}
            onChange={(e) => handleFieldChange('yearEstablished', e.target.value === '' ? '' : Number(e.target.value), setYearEstablished)}
            onBlur={(e) => handleFieldBlur('yearEstablished', e.target.value === '' ? '' : Number(e.target.value))}
            error={fieldTouched.yearEstablished && !!fieldErrors.yearEstablished}
            helperText={fieldTouched.yearEstablished && fieldErrors.yearEstablished || "Optional"}
            inputProps={{ min: 1900, max: new Date().getFullYear() }}
          />
        </Box>
      </Box>
    </Box>
  );
  
  const renderAddressInfo = () => (
    <Box>      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ flex: '1 1 100%' }}>
          <TextField
            fullWidth
            label="Street Address"
            value={street}
            onChange={(e) => handleFieldChange('street', e.target.value, setStreet)}
            onBlur={(e) => handleFieldBlur('street', e.target.value)}
            error={fieldTouched.street && !!fieldErrors.street}
            helperText={fieldTouched.street && fieldErrors.street}
            required
          />
        </Box>
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)' } }}>
          <TextField
            fullWidth
            label="City"
            value={city}
            onChange={(e) => handleFieldChange('city', e.target.value, setCity)}
            onBlur={(e) => handleFieldBlur('city', e.target.value)}
            error={fieldTouched.city && !!fieldErrors.city}
            helperText={fieldTouched.city && fieldErrors.city}
            required
          />
        </Box>
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)' } }}>
          <TextField
            fullWidth
            label="Province/State"
            value={province}
            onChange={(e) => handleFieldChange('province', e.target.value, setProvince)}
            onBlur={(e) => handleFieldBlur('province', e.target.value)}
            error={fieldTouched.province && !!fieldErrors.province}
            helperText={fieldTouched.province && fieldErrors.province}
            required
          />        </Box>
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)' } }}>
          <TextField
            fullWidth
            label="Contact Phone"
            value={contactPhone}
            onChange={(e) => handleFieldChange('contactPhone', e.target.value, setContactPhone)}
            onBlur={(e) => handleFieldBlur('contactPhone', e.target.value)}
            error={fieldTouched.contactPhone && !!fieldErrors.contactPhone}
            helperText={fieldTouched.contactPhone && fieldErrors.contactPhone}
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
      <Paper sx={{ p: 3, width: '100%' }}>        <Typography variant="h5" component="h1" align="center" gutterBottom>
          Register your Company
        </Typography>
        
        {/* Progress Bar */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Form Progress
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {getFormProgress()}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={getFormProgress()} 
            sx={{ height: 8, borderRadius: 5 }}
          />
        </Box>
        
        <Stepper activeStep={activeStep} sx={{ my: 3 }}>
          <Step completed={getStepStatus(0)}>
            <StepLabel 
              icon={getStepStatus(0) ? <CheckCircle color="success" /> : undefined}
            >
              Account
            </StepLabel>
          </Step>
          <Step completed={getStepStatus(1)}>
            <StepLabel
              icon={getStepStatus(1) ? <CheckCircle color="success" /> : undefined}
            >
              Company
            </StepLabel>
          </Step>
          <Step completed={getStepStatus(2)}>
            <StepLabel
              icon={getStepStatus(2) ? <CheckCircle color="success" /> : undefined}
            >
              Address
            </StepLabel>
          </Step>
        </Stepper>
          {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {/* Success message for completed steps */}
        {activeStep > 0 && getStepStatus(0) && (
          <Alert severity="success" sx={{ mb: 2 }}>
            ✓ Account information completed successfully
          </Alert>
        )}
        {activeStep > 1 && getStepStatus(1) && (
          <Alert severity="success" sx={{ mb: 2 }}>
            ✓ Company information completed successfully
          </Alert>
        )}
        
        {activeStep === 0 && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Step 1:</strong> Create your account with a strong password. Your email will be used for login and important notifications.
            </Typography>
          </Alert>
        )}
        
        {activeStep === 1 && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Step 2:</strong> Provide your company details. This information helps us verify your business and set up your account properly.
            </Typography>
          </Alert>
        )}
        
        {activeStep === 2 && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Step 3:</strong> Add your business address and contact information. This will be used for invoicing and communication.
            </Typography>
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
          </Button>          <Button
            variant="contained"
            onClick={handleNext}
            disabled={loading || !isCurrentStepValid()}
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
