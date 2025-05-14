import React, { useState, useEffect } from 'react';
import { Box, FormControlLabel, Switch, Snackbar, Alert, Typography, Paper } from '@mui/material';
import { toggleMockApi, isMockApiEnabled } from '../../services/api/apiClient';

const MockApiToggle: React.FC = () => {
  const [isMockEnabled, setIsMockEnabled] = useState(isMockApiEnabled);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  const handleToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const isEnabled = event.target.checked;
    toggleMockApi(isEnabled);
    setIsMockEnabled(isEnabled);
    setNotificationMessage(`API is now using ${isEnabled ? 'mock' : 'real'} data`);
    setShowNotification(true);
  };

  const handleCloseNotification = () => {
    setShowNotification(false);
  };

  return (
    <Paper 
      elevation={1} 
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        padding: 2,
        zIndex: 1000,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(5px)',
        border: '1px solid #eee',
        borderRadius: 2
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
        <Typography variant="subtitle2" color="text.secondary" mb={1}>
          Development Mode
        </Typography>
        <FormControlLabel
          control={
            <Switch 
              checked={isMockEnabled}
              onChange={handleToggle}
              color="primary"
            />
          }
          label={isMockEnabled ? "Using Mock API" : "Using Real API"}
        />
      </Box>
      
      <Snackbar
        open={showNotification}
        autoHideDuration={3000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseNotification} severity="info" sx={{ width: '100%' }}>
          {notificationMessage}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default MockApiToggle;
