import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Avatar,
  TextField,
  Button,
  Divider,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Edit as EditIcon,
  PhotoCamera as PhotoCameraIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useAuth } from '../components/auth/AuthContext';
import { LogoutButton } from '../components/shared';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const UserProfile: React.FC = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  
  // Profile data state
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
    // Form state
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    // Update form state when user data changes
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    
    // Reset form if canceling edit
    if (isEditing) {
      setFirstName(user?.firstName || '');
      setLastName(user?.lastName || '');
      setEmail(user?.email || '');
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // This would be replaced with your actual API call
      // For now we'll simulate an API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
        // Mock success response - replace with actual API call
      // await userService.updateProfile({
      //   firstName,
      //   lastName
      // });
      
      setSuccess('Profile updated successfully');
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }
    
    try {
      // Replace with actual API call
      // await authService.changePassword({
      //   currentPassword,
      //   newPassword
      // });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: { xs: 2, md: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            User Profile
          </Typography>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="profile tabs">
            <Tab label="Personal Info" />
            <Tab label="Security" />
            <Tab label="Preferences" />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}
          
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
            <Box sx={{ 
              flex: { xs: '1 1 100%', md: '0 0 33%' }, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center' 
            }}>
              <Avatar
                src={(user as any)?.avatarUrl || ''}
                alt={`${firstName} ${lastName}`}
                sx={{
                  width: 160,
                  height: 160,
                  fontSize: 64,
                  mb: 2
                }}
              >
                {firstName ? firstName[0].toUpperCase() : 'U'}
              </Avatar>
              
              {isEditing && (
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<PhotoCameraIcon />}
                >
                  Change Photo
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                  />
                </Button>
              )}
            </Box>
            
            <Box sx={{ flex: { xs: '1 1 100%', md: '0 0 67%' } }}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                {!isEditing ? (
                  <Button
                    startIcon={<EditIcon />}
                    onClick={handleEditToggle}
                    variant="outlined"
                  >
                    Edit Profile
                  </Button>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      startIcon={<CancelIcon />}
                      onClick={handleEditToggle}
                      variant="outlined"
                      color="error"
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button
                      startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                      onClick={handleProfileUpdate}
                      variant="contained"
                      color="primary"
                      disabled={loading}
                    >
                      Save Changes
                    </Button>
                  </Box>
                )}
              </Box>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ flex: { xs: '1 1 100%', sm: '0 0 calc(50% - 8px)' } }}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={!isEditing || loading}
                  />
                </Box>
                <Box sx={{ flex: { xs: '1 1 100%', sm: '0 0 calc(50% - 8px)' } }}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={!isEditing || loading}
                  />
                </Box>                <Box sx={{ flex: '1 1 100%' }}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={email}
                    disabled={true} // Email cannot be changed
                  />
                </Box>
              </Box>
            </Box>
          </Box>
          
          <Divider sx={{ my: 4 }} />
          
          <Box>
            <Typography variant="h6" gutterBottom>
              Account Information
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 30%', md: '1 1 30%' } }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Account Type
                </Typography>
                <Typography variant="body1">
                  {user?.role || 'User'}
                </Typography>
              </Box>
              <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 30%', md: '1 1 30%' } }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Company
                </Typography>
                <Typography variant="body1">
                  {user?.companyId ? 'Connected' : 'Not connected'}
                </Typography>
              </Box>
              <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 30%', md: '1 1 30%' } }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Status
                </Typography>
                <Typography variant="body1">
                  {user?.status || 'Active'}
                </Typography>
              </Box>
            </Box>
          </Box>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}
          
          <Box component="form" onSubmit={handlePasswordChange} sx={{ maxWidth: 500 }}>
            <Typography variant="h6" gutterBottom>
              Change Password
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ width: '100%' }}>
                <TextField
                  fullWidth
                  type="password"
                  label="Current Password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </Box>
              <Box sx={{ width: '100%' }}>
                <TextField
                  fullWidth
                  type="password"
                  label="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={loading}
                  helperText="Password must be at least 8 characters long"
                />
              </Box>
              <Box sx={{ width: '100%' }}>
                <TextField
                  fullWidth
                  type="password"
                  label="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  error={confirmPassword !== '' && confirmPassword !== newPassword}
                  helperText={
                    confirmPassword !== '' && confirmPassword !== newPassword
                      ? 'Passwords do not match'
                      : ''
                  }
                />
              </Box>
              <Box sx={{ width: '100%' }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                  Update Password
                </Button>
              </Box>
            </Box>
          </Box>
          
          <Divider sx={{ my: 4 }} />
            <Box>
            <Typography variant="h6" gutterBottom>
              Two-Factor Authentication
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Add an extra layer of security to your account by enabling two-factor authentication.
            </Typography>
            <Button
              variant="outlined"
              color="primary"
            >
              Enable 2FA
            </Button>
          </Box>
          
          <Divider sx={{ my: 4 }} />
          
          <Box>
            <Typography variant="h6" gutterBottom>
              Account Access
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Sign out of your account securely. You'll need to sign in again to access your account.
            </Typography>
            <LogoutButton 
              size="medium"
              showConfirmation={true}
            />
          </Box>
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Notification Settings
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Coming soon. This section will allow you to customize your notification preferences.
          </Typography>
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default UserProfile;
