import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';

interface ProtectedRouteProps {
  children: React.ReactNode;
  role?: string | string[]; // Optional role-based access control
}

/**
 * A wrapper for routes that require authentication
 * Redirects to login if user is not authenticated
 * Can also check for specific roles if needed
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, role }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // If not authenticated, redirect to login page
  if (!isAuthenticated) {
    // Redirect to login and save the location they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Note: Role checking is disabled since the user object doesn't have a role property
  // If you need role-based access control, add a role property to the user object in AuthContext
  
  // If authenticated, render children
  return <>{children}</>;
};

export default ProtectedRoute;