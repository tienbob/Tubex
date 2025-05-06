import React from 'react';
import { Box, Typography } from '@mui/material';
import Dashboard from '../dashboard/Dashboard';

const Home = () => (
  <Box sx={{ my: 4 }}>
    <Typography variant="h4" component="h1" gutterBottom className="wl-title">
      Tubex Dashboard
    </Typography>
    
    <Typography variant="subtitle1" gutterBottom className="wl-subtitle">
      Welcome back to your construction materials management portal
    </Typography>
    
    <Box sx={{ my: 4 }}>
      <Dashboard />
    </Box>
  </Box>
);

export default Home;