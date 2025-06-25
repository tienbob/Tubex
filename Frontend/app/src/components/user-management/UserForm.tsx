import React, { useState, useEffect, useCallback } from 'react';
import { 
  TextField, 
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Switch,
  FormControlLabel,
  Divider,
  Typography,
  Alert,
  Link,
  SelectChangeEvent,
  Stack,
  Paper
} from '@mui/material';
import { useTheme } from '../../contexts/ThemeContext';
import WhiteLabelButton from '../whitelabel/WhiteLabelButton';
import FormContainer from '../shared/FormContainer';
import { userManagementService, User, UserCreateRequest, UserUpdateRequest } from '../../services/api';
import { useAccessControl } from '../../hooks/useAccessControl';

interface Company {
  id: string;
  name: string;
  type: string;
}

interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'admin' | 'manager' | 'staff' | '';
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  companyId: string;
  sendInvitation: boolean;
}

interface UserFormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  role?: string;
  companyId?: string;
}

interface UserFormProps {
  userId?: string;
  companyId?: string;
  isAdminView?: boolean;
  onSave?: (user: User) => void;
  onCancel?: () => void;
  companies?: Company[];
}

const UserForm: React.FC<UserFormProps> = ({
  userId,
  companyId,
  isAdminView = false,
  onSave,
  onCancel,
  companies = []
}) => {
  const { theme } = useTheme();
  const { canPerform } = useAccessControl();
  const isEditMode = !!userId;
  const isNewUser = !isEditMode;
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  
  const [formData, setFormData] = useState<UserFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    status: 'active',
    companyId: companyId || '',
    sendInvitation: true
  });
  
  const [errors, setErrors] = useState<UserFormErrors>({});
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [invitationCode, setInvitationCode] = useState<string | null>(null);
  
  useEffect(() => {
    if (userId) {
      fetchUserDetails();
    }
  }, [userId]);

  const fetchUserDetails = async () => {
    if (!userId) return;
    
    setFetchLoading(true);
    setApiError(null);
    
    try {
      const user = await userManagementService.getUser(userId);      // Ensure role is valid - filter out old roles
      const validRole = ['admin', 'manager', 'staff'].includes(user.role) ? user.role : '';
      
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        password: '',
        confirmPassword: '',
        role: validRole,
        status: user.status || 'active',
        companyId: user.company_id || companyId || '',
        sendInvitation: false
      });
    } catch (err: any) {
      setApiError(err.message || 'Failed to load user details');
      console.error('Error fetching user:', err);
    } finally {
      setFetchLoading(false);
    }
  };

  const validateEmail = useCallback(async (email: string): Promise<string | null> => {
    if (!email) return 'Email is required';
    if (!/\S+@\S+\.\S+/.test(email)) return 'Email is invalid';
    
    if (isNewUser) {
      setIsCheckingEmail(true);
      try {
        const isAvailable = await userManagementService.checkEmailAvailability(email);
        return isAvailable ? null : 'Email is already in use';
      } catch (err) {
        console.error('Error checking email availability:', err);
        return null; // Don't block submission on API error
      } finally {
        setIsCheckingEmail(false);
      }
    }
    
    return null;
  }, [isNewUser]);
  
  const validateForm = useCallback(async () => {
    const newErrors: UserFormErrors = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    const emailError = await validateEmail(formData.email);
    if (emailError) {
      newErrors.email = emailError;
    }
    
    if (isNewUser) {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }
      
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }
    
    if (!formData.role) {
      newErrors.role = 'Role is required';
    }
    
    if (!formData.companyId && isAdminView) {
      newErrors.companyId = 'Company is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, isNewUser, isAdminView, validateEmail]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (!name) return;
    
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for the field being edited
    if (errors[name as keyof UserFormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    handleChange(e as any);
  };
  
  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    
    setFormData((prev) => ({
      ...prev,
      [name]: checked
    }));
  };

  const generateInvitationCode = async () => {
    try {
      if (!formData.role || !['admin', 'manager', 'staff'].includes(formData.role)) {
        throw new Error('Please select a valid role first');
      }

      const code = await userManagementService.generateInvitationCode({
        email: formData.email,
        role: formData.role as UserCreateRequest['role'],
        companyId: formData.companyId,
      });
      setInvitationCode(code);
    } catch (err: any) {
      setApiError(err.message || 'Failed to generate invitation code');
      console.error('Error generating invitation code:', err);
    }
  };
  
  const handleSubmit = async () => {
    if (!(await validateForm())) return;
    
    setLoading(true);
    setApiError(null);
    
    try {
      // Validate required fields for API submission
      if (!formData.role || !formData.companyId) {
        throw new Error('Role and Company are required');
      }

      // Validate that role is one of the allowed values
      if (!['admin', 'manager', 'staff'].includes(formData.role)) {
        throw new Error('Invalid role selected');
      }

      const baseData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        role: formData.role as 'admin' | 'manager' | 'staff', // Cast after validation
        status: formData.status,
        companyId: isAdminView ? formData.companyId : companyId
      };

      // Ensure companyId is available
      if (!baseData.companyId) {
        throw new Error('Company ID is required');
      }

      let savedUser: User;
      
      if (isEditMode && userId) {
        const updateData: UserUpdateRequest = {
          ...baseData,
          status: formData.status
        };
        savedUser = await userManagementService.updateUser(userId, updateData);
      } else {
        const createData: UserCreateRequest = {
          ...baseData,
          password: formData.password,
          sendInvitation: formData.sendInvitation,
          companyId: baseData.companyId // Already validated above
        };
        savedUser = await userManagementService.createUser(createData);
      }
      
      if (onSave && savedUser) {
        onSave(savedUser);
      }
    } catch (err: any) {
      setApiError(err.message || `Failed to ${isEditMode ? 'update' : 'create'} user`);
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} user:`, err);
    } finally {
      setLoading(false);
    }
  };

  const getAvailableRoles = () => {    if (isAdminView) {
      return [
        { value: 'admin', label: 'Admin' },
        { value: 'manager', label: 'Manager' },
        { value: 'staff', label: 'Staff' }
      ];
    }
    
    return [
      { value: 'manager', label: 'Manager' },
      { value: 'staff', label: 'Staff' }
    ];
  };

  return (
    <FormContainer 
      title={isEditMode ? 'Edit User' : 'Add New User'}
      loading={fetchLoading}
      error={apiError}
      maxWidth="700px"
    >
      <Paper 
        elevation={2} 
        sx={{ 
          p: 3, 
          borderRadius: `${theme.buttonRadius || 4}px`,
          backgroundColor: 'background.paper'
        }}
      >
        <Stack spacing={3}>
          <TextField
            name="firstName"
            label="First Name"
            fullWidth
            required
            value={formData.firstName}
            onChange={handleChange}
            error={!!errors.firstName}
            helperText={errors.firstName}
            disabled={loading}
          />
          
          <TextField
            name="lastName"
            label="Last Name"
            fullWidth
            required
            value={formData.lastName}
            onChange={handleChange}
            error={!!errors.lastName}
            helperText={errors.lastName}
            disabled={loading}
          />
          
          <TextField
            name="email"
            label="Email"
            fullWidth
            required
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={!!errors.email}
            helperText={errors.email || (isCheckingEmail ? 'Checking email availability...' : undefined)}
            disabled={loading || isCheckingEmail || (isEditMode && !isAdminView)}
          />
          
          {isAdminView && (
            <FormControl fullWidth error={!!errors.companyId}>
              <InputLabel id="company-label">Company</InputLabel>
              <Select
                labelId="company-label"
                name="companyId"
                value={formData.companyId}
                onChange={handleSelectChange}
                disabled={loading || (isEditMode && !isAdminView)}
                label="Company"
              >
                <MenuItem value="" disabled>Select a company</MenuItem>
                {companies.map((company) => (
                  <MenuItem key={company.id} value={company.id}>
                    {company.name} ({company.type === 'supplier' ? 'Supplier' : 'Dealer'})
                  </MenuItem>
                ))}
              </Select>
              {errors.companyId && <FormHelperText>{errors.companyId}</FormHelperText>}
            </FormControl>
          )}
          
          <FormControl fullWidth required error={!!errors.role}>
            <InputLabel id="role-label">Role</InputLabel>
            <Select
              labelId="role-label"
              name="role"
              value={formData.role}
              onChange={handleSelectChange}
              disabled={loading || (isEditMode && !isAdminView)}
              label="Role"
            >
              <MenuItem value="" disabled>Select a role</MenuItem>
              {getAvailableRoles().map((role) => (
                <MenuItem key={role.value} value={role.value}>
                  {role.label}
                </MenuItem>
              ))}
            </Select>
            {errors.role && <FormHelperText>{errors.role}</FormHelperText>}
          </FormControl>

          {isEditMode && (
            <FormControl fullWidth>
              <InputLabel id="status-label">Status</InputLabel>
              <Select
                labelId="status-label"
                name="status"
                value={formData.status}
                onChange={handleSelectChange}
                disabled={loading}
                label="Status"
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="suspended">Suspended</MenuItem>
              </Select>
            </FormControl>
          )}
          
          {isNewUser && (
            <>
              <Divider textAlign="left">
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: theme.primaryColor,
                    fontFamily: theme.fontFamily
                  }}
                >
                  Login Credentials
                </Typography>
              </Divider>
              
              <TextField
                name="password"
                label="Password"
                fullWidth
                required
                type="password"
                value={formData.password}
                onChange={handleChange}
                error={!!errors.password}
                helperText={errors.password || "Must be at least 8 characters"}
                disabled={loading}
              />
              
              <TextField
                name="confirmPassword"
                label="Confirm Password"
                fullWidth
                required
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
                disabled={loading}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    name="sendInvitation"
                    checked={formData.sendInvitation}
                    onChange={handleSwitchChange}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: theme.primaryColor,
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: theme.primaryColor,
                      },
                    }}
                  />
                }
                label="Send invitation email to the user"
              />
              
              <Alert 
                severity="info"
                sx={{
                  '& .MuiAlert-icon': {
                    color: theme.primaryColor,
                  },
                  '& a': {
                    color: theme.primaryColor,
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  },
                }}
              >
                Alternatively, you can <Link 
                  href="#" 
                  onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                    e.preventDefault();
                    generateInvitationCode();
                  }}
                >
                  generate an invitation code
                </Link> to share with the user.
                {invitationCode && (
                  <Box sx={{ mt: 1 }}>
                    Invitation Code: <strong>{invitationCode}</strong>
                  </Box>
                )}
              </Alert>
            </>
          )}
        </Stack>
        
        <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          {onCancel && (
            <WhiteLabelButton
              variant="outlined"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </WhiteLabelButton>
          )}          <WhiteLabelButton
            onClick={handleSubmit}
            disabled={loading || (isEditMode ? !canPerform('user:edit') : !canPerform('user:create'))}
            title={
              isEditMode 
                ? !canPerform('user:edit') ? 'You do not have permission to edit users' : undefined
                : !canPerform('user:create') ? 'You do not have permission to create users' : undefined
            }
          >
            {isEditMode ? 'Update User' : 'Create User'}
          </WhiteLabelButton>
        </Box>
      </Paper>
    </FormContainer>
  );
};

export default UserForm;