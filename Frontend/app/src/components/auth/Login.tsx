import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  CircularProgress, 
  Alert, 
  FormControlLabel,
  Checkbox,
  Divider,
  Link as MuiLink,
  InputAdornment,
  IconButton
} from '@mui/material';
import { Visibility, VisibilityOff, Google, Facebook } from '@mui/icons-material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../../services/api/authService';

interface LoginProps {
  onLoginSuccess?: (userData: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
    // Extract redirect URL from query parameters if present
  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const redirect = params.get('redirect');
    if (redirect) {
      // Store the redirect URL for use after login
      localStorage.setItem('redirectAfterLogin', redirect);
    }
  }, [location]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Input validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await authService.login({
        email: email.trim(),
        password
      });
      
      if (!response || !response.data) {
        setError('Login failed. No response from server.');
        return;
      }

      if (!response.data.accessToken) {
        setError('Login failed. Authentication token not received.');
        return;
      }

      // Store auth tokens
      authService.setToken(response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      
      // If the component has a callback, call it
      if (onLoginSuccess) {
        onLoginSuccess(response.data);
      }
      
      // Redirect to the stored URL or dashboard
      const redirectTo = localStorage.getItem('redirectAfterLogin') || '/dashboard';
      localStorage.removeItem('redirectAfterLogin'); // Clean up
      navigate(redirectTo);
    } catch (err: any) {
      // Handle specific error cases
      if (err.response?.status === 401) {
        setError('Invalid email or password');
      } else if (err.response?.status === 403) {
        setError('Your account is not active. Please check your email for verification instructions.');
      } else if (err.response?.status === 429) {
        setError('Too many login attempts. Please try again later.');
      } else if (!navigator.onLine) {
        setError('No internet connection. Please check your network and try again.');
      } else {
        setError(err.message || 'Login failed. Please check your credentials and try again.');
      }
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleGoogleLogin = () => {
    authService.loginWithGoogle();
  };
  
  const handleFacebookLogin = () => {
    authService.loginWithFacebook();
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
          Log In to Tubex
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleLogin} sx={{ mt: 2 }}>
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
            disabled={loading}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            id="password"
            autoComplete="current-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
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
          
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
            <FormControlLabel
              control={
                <Checkbox 
                  value="remember" 
                  color="primary" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                />
              }
              label="Remember me"
            />
            
            <MuiLink 
              component={Link} 
              to="/forgot-password" 
              variant="body2"
              underline="hover"
            >
              Forgot password?
            </MuiLink>
          </Box>
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Log In'}
          </Button>
          
          <Divider sx={{ my: 3 }}>OR</Divider>
          
          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Google />}
              onClick={handleGoogleLogin}
              disabled={loading}
              sx={{ mb: { xs: 1, sm: 0 } }}
            >
              Sign in with Google
            </Button>
            
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Facebook />}
              onClick={handleFacebookLogin}
              disabled={loading}
            >
              Sign in with Facebook
            </Button>
          </Box>
          
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2">
              Don't have an account?{' '}
              <MuiLink component={Link} to="/register" underline="hover">
                Register now
              </MuiLink>
            </Typography>
            
            <Typography variant="body2" sx={{ mt: 1 }}>
              Have an invitation code?{' '}
              <MuiLink component={Link} to="/join" underline="hover">
                Join your company
              </MuiLink>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default Login;
