import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';

const LandingPage = () => (
  <Box sx={{ my: 4, textAlign: 'center' }}>
    <Typography variant="h3" component="h1" gutterBottom className="wl-title">
      Welcome to Tubex Platform
    </Typography>
    
    <Typography variant="h5" gutterBottom className="wl-subtitle">
      B2B SaaS Platform for Construction Materials Dealers
    </Typography>
    
    <Typography variant="body1" paragraph sx={{ mb: 4 }}>
      Streamline your construction materials business with our comprehensive 
      inventory and order management solution.
    </Typography>
    
    <Box sx={{ mt: 3 }}>
      <Button 
        variant="contained" 
        color="primary" 
        component={Link} 
        to="/login" 
        size="large"
        sx={{ mx: 1 }}
      >
        Login
      </Button>
      <Button 
        variant="outlined" 
        color="primary" 
        component={Link} 
        to="/register" 
        size="large"
        sx={{ mx: 1 }}
      >
        Register
      </Button>
    </Box>
  </Box>
);

export default LandingPage;