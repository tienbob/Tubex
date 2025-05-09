import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  CircularProgress, 
  Alert, 
  Link as MuiLink,
  InputAdornment,
  IconButton
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../../services/api/authService';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Extract token from URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tokenParam = params.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setError('Reset token is missing. Please use the link from your email.');
    }
  }, [location]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setError('Reset token is required. Please use the link from your email.');
      return;
    }
    
    if (!newPassword) {
      setError('New password is required');
      return;
    }
    
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await authService.resetPassword({
        token,
        newPassword
      });
      
      if (response.success) {
        setSuccess('Your password has been reset successfully. You can now log in with your new password.');
        // Redirect after a short delay
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError('Failed to reset password. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. The link may have expired.');
      console.error('Password reset error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleTogglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        maxWidth: '500px',
        mx: 'auto',
        py: 4
      }}
    >
      <Paper sx={{ p: 3, width: '100%' }}>
        <Typography variant="h5" component="h1" align="center" gutterBottom>
          Reset Password
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            name="newPassword"
            label="New Password"
            type={showPassword ? 'text' : 'password'}
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={loading || !!success}
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
          
          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="Confirm New Password"
            type={showPassword ? 'text' : 'password'}
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading || !!success}
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading || !!success || !token}
          >
            {loading ? <CircularProgress size={24} /> : 'Reset Password'}
          </Button>
          
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2">
              Remember your password?{' '}
              <MuiLink component={Link} to="/login" underline="hover">
                Back to login
              </MuiLink>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default ResetPassword;
