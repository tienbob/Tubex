import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { canAccessPage, User, CompanyType } from '../../utils/accessControl';
import { Box, Typography, Button } from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';
import { companyService } from '../../services/api';

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
  const [companyType, setCompanyType] = useState<CompanyType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (user?.companyId) {
      companyService.getCompanyById(user.companyId)
        .then(company => {
          if (isMounted) {
            setCompanyType(company.type as CompanyType);
            setLoading(false);
          }
        })
        .catch(() => {
          if (isMounted) {
            setCompanyType(null);
            setLoading(false);
          }
        });
    } else {
      setLoading(false);
    }
    return () => { isMounted = false; };
  }, [user?.companyId]);

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (loading) {
    return null; // Or a spinner/loading indicator
  }

  if (!companyType) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="error">
          Unable to determine company type.
        </Typography>
      </Box>
    );
  }

  const accessUser: User = {
    userId: user.userId,
    role: user.role,
    companyId: user.companyId,
    companyType: companyType
  };

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