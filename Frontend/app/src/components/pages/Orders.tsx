import React from 'react';
import { Box, Typography } from '@mui/material';

const Orders = () => (
  <Box sx={{ my: 4 }}>
    <Typography variant="h4" gutterBottom>Orders Management</Typography>
    <Typography variant="body1">
      This is the orders management page. In a real implementation, this would display orders 
      fetched from the backend using the orderService.
    </Typography>
  </Box>
);

export default Orders;