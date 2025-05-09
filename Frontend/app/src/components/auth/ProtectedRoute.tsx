import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { authService } from '../../services/api/authService';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string | string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const location = useLocation();
  const isAuthenticated = authService.isAuthenticated();
  const userInfo = authService.getCurrentUser();
  const loading = false; // You can add loading state if needed

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated || !userInfo) {
    // Save the attempted URL for redirection after login
    localStorage.setItem('redirectAfterLogin', location.pathname);
    return <Navigate to="/login" replace />;
  }

  // Check for required role if specified
  if (requiredRole && userInfo.role) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes(userInfo.role)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
