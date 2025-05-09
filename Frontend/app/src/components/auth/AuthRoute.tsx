import React from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../../services/api/authService';

interface AuthRouteProps {
  children: React.ReactNode;
}

const AuthRoute: React.FC<AuthRouteProps> = ({ children }) => {
  const isAuthenticated = authService.isAuthenticated();

  if (isAuthenticated) {
    // Already logged in, redirect to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default AuthRoute;
