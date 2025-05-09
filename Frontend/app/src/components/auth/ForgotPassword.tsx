import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  CircularProgress, 
  Alert, 
  Link as MuiLink
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/api/authService';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await authService.forgotPassword({ email });
      
      if (response.success) {
        setSuccess('Password reset instructions have been sent to your email address');
      } else {
        setError('Failed to request password reset. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to request password reset. Please try again.');
      console.error('Forgot password error:', err);
    } finally {
      setLoading(false);
    }
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
          Forgot Password
        </Typography>
        
        <Typography variant="body2" align="center" color="text.secondary" paragraph>
          Enter your email address and we'll send you instructions to reset your password.
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
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading || !!success}
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading || !!success}
          >
            {loading ? <CircularProgress size={24} /> : 'Send Reset Link'}
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

export default ForgotPassword;
