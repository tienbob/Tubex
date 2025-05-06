import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Box, Button, TextField, Typography, Divider, Alert, FormControl, InputLabel, Select, MenuItem, Stepper, Step, StepLabel } from '@mui/material';
import { Google as GoogleIcon, Facebook as FacebookIcon } from '@mui/icons-material';
import { Link } from 'react-router-dom';

interface CompanyRegistrationFormProps {
  onSuccess?: () => void;
}

interface CompanyDetails {
  name: string;
  type: 'dealer' | 'supplier';
  taxId: string;
  businessLicense: string;
  address: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
  };
  businessCategory: string;
  employeeCount: number;
  yearEstablished: number;
  contactPhone: string;
}

const CompanyRegistrationForm: React.FC<CompanyRegistrationFormProps> = ({ onSuccess }) => {
  const { registerCompany, error } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    company: {
      name: '',
      type: 'dealer' as 'dealer' | 'supplier',
      taxId: '',
      businessLicense: '',
      address: {
        street: '',
        city: '',
        province: '',
        postalCode: ''
      },
      businessCategory: '',
      employeeCount: 0,
      yearEstablished: new Date().getFullYear(),
      contactPhone: ''
    }
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [activeStep, setActiveStep] = useState(0);

  const steps = ['Account Details', 'Company Information', 'Address Details'];

  const validateCurrentStep = () => {
    const errors: Record<string, string> = {};
    
    if (activeStep === 0) {
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
    }

    if (activeStep === 1) {
      if (!formData.company.name) {
        errors.companyName = 'Company name is required';
      }
      
      if (!formData.company.taxId) {
        errors.taxId = 'Tax ID is required';
      } else if (!/^\d{10}$/.test(formData.company.taxId)) {
        errors.taxId = 'Invalid Tax ID format (10 digits)';
      }

      if (!formData.company.businessLicense) {
        errors.businessLicense = 'Business license number is required';
      }

      if (!formData.company.contactPhone) {
        errors.contactPhone = 'Contact phone is required';
      } else if (!/^\d{10,11}$/.test(formData.company.contactPhone)) {
        errors.contactPhone = 'Invalid phone number format';
      }
    }

    if (activeStep === 2) {
      if (!formData.company.address.street) {
        errors.street = 'Street address is required';
      }
      if (!formData.company.address.city) {
        errors.city = 'City is required';
      }
      if (!formData.company.address.province) {
        errors.province = 'Province is required';
      }
      if (!formData.company.address.postalCode) {
        errors.postalCode = 'Postal code is required';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateCurrentStep()) return;

    // If we're not on the last step, move to next step
    if (activeStep < steps.length - 1) {
      handleNext();
      return;
    }

    try {
      await registerCompany(
        formData.email,
        formData.password,
        formData.company
      );
      onSuccess?.();
    } catch (err) {
      // Error handling is managed by the AuthContext
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        company: {
          ...prev.company,
          address: {
            ...prev.company.address,
            [addressField]: value
          }
        }
      }));
    } else if (name.startsWith('company.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        company: {
          ...prev.company,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

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

  const renderAccountDetails = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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

      <Divider sx={{ my: 2 }}>
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
    </Box>
  );

  const renderCompanyInfo = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        fullWidth
        label="Company Name"
        name="company.name"
        value={formData.company.name}
        onChange={handleChange}
        error={!!validationErrors.companyName}
        helperText={validationErrors.companyName}
        required
      />

      <FormControl fullWidth>
        <InputLabel>Company Type</InputLabel>
        <Select
          value={formData.company.type}
          label="Company Type"
          onChange={(e) => setFormData(prev => ({
            ...prev,
            company: {
              ...prev.company,
              type: e.target.value as 'dealer' | 'supplier'
            }
          }))}
        >
          <MenuItem value="dealer">Dealer</MenuItem>
          <MenuItem value="supplier">Supplier</MenuItem>
        </Select>
      </FormControl>

      <TextField
        fullWidth
        label="Tax ID"
        name="company.taxId"
        value={formData.company.taxId}
        onChange={handleChange}
        error={!!validationErrors.taxId}
        helperText={validationErrors.taxId || 'Enter your 10-digit tax identification number'}
        required
      />

      <TextField
        fullWidth
        label="Business License Number"
        name="company.businessLicense"
        value={formData.company.businessLicense}
        onChange={handleChange}
        error={!!validationErrors.businessLicense}
        helperText={validationErrors.businessLicense}
        required
      />

      <TextField
        fullWidth
        label="Business Category"
        name="company.businessCategory"
        value={formData.company.businessCategory}
        onChange={handleChange}
        required
      />

      <TextField
        fullWidth
        label="Contact Phone"
        name="company.contactPhone"
        value={formData.company.contactPhone}
        onChange={handleChange}
        error={!!validationErrors.contactPhone}
        helperText={validationErrors.contactPhone}
        required
      />
    </Box>
  );

  const renderAddressDetails = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        fullWidth
        label="Street Address"
        name="address.street"
        value={formData.company.address.street}
        onChange={handleChange}
        error={!!validationErrors.street}
        helperText={validationErrors.street}
        required
      />

      <TextField
        fullWidth
        label="City"
        name="address.city"
        value={formData.company.address.city}
        onChange={handleChange}
        error={!!validationErrors.city}
        helperText={validationErrors.city}
        required
      />

      <TextField
        fullWidth
        label="Province"
        name="address.province"
        value={formData.company.address.province}
        onChange={handleChange}
        error={!!validationErrors.province}
        helperText={validationErrors.province}
        required
      />

      <TextField
        fullWidth
        label="Postal Code"
        name="address.postalCode"
        value={formData.company.address.postalCode}
        onChange={handleChange}
        error={!!validationErrors.postalCode}
        helperText={validationErrors.postalCode}
        required
      />
    </Box>
  );

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return renderAccountDetails();
      case 1:
        return renderCompanyInfo();
      case 2:
        return renderAddressDetails();
      default:
        return 'Unknown step';
    }
  };

  return (
    <Box sx={{ mt: 2, width: '100%', maxWidth: '600px', mx: 'auto' }}>
      <Typography variant="h5" gutterBottom align="center" sx={{ mb: 3 }}>
        Register your Company on Tubex
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {getStepContent(activeStep)}

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            disabled={activeStep === 0}
            onClick={handleBack}
          >
            Back
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
          >
            {activeStep === steps.length - 1 ? 'Register' : 'Next'}
          </Button>
        </Box>
      </Box>

      <Box sx={{ textAlign: 'center', mt: 3 }}>
        <Typography variant="body2">
          Already have an account? <Link to="/login">Log in here</Link>
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          Need to join an existing company? <Link to="/employee-register">Register as an employee</Link>
        </Typography>
      </Box>
    </Box>
  );
};

export default CompanyRegistrationForm;