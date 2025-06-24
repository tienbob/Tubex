import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { canAccessPage, User } from '../../utils/accessControl';
import { Box, Typography, Button } from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPage?: string;
  fallbackPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredPage,
  fallbackPath = '/dashboard' 
}) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  
  // If not authenticated, redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Convert UserInfo to User type for access control
  const accessUser: User = {
    userId: user.userId,
    role: user.role,
    companyId: user.companyId,
  };
  
  // If specific page access is required, check permissions
  if (requiredPage && !canAccessPage(accessUser, requiredPage)) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          textAlign: 'center',
          p: 3
        }}
      >
        <LockIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          Access Denied
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 400 }}>
          You don't have permission to access this page. Please contact your administrator 
          if you believe this is an error.
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => window.history.back()}
          sx={{ mr: 2 }}
        >
          Go Back
        </Button>
        <Button 
          variant="outlined" 
          href={fallbackPath}
        >
          Go to Dashboard
        </Button>
      </Box>
    );
  }
  
  return <>{children}</>;
};

export default ProtectedRoute;
