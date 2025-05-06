import React from 'react';
import { Box, Typography } from '@mui/material';

const Unauthorized = () => (
  <Box sx={{ my: 4, textAlign: 'center' }}>
    <Typography variant="h4" component="h1" gutterBottom>
      Unauthorized Access
    </Typography>
    <Typography variant="body1">
      You don't have permission to view this page.
    </Typography>
  </Box>
);

export default Unauthorized;