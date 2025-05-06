import React from 'react';
import { Box, Typography } from '@mui/material';

const Inventory = () => (
  <Box sx={{ my: 4 }}>
    <Typography variant="h4" gutterBottom>Inventory Management</Typography>
    <Typography variant="body1">
      This is the inventory management page. In a real implementation, this would display inventory 
      items fetched from the backend using the inventoryService.
    </Typography>
  </Box>
);

export default Inventory;