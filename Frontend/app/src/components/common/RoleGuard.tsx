import React from 'react';
import { useAccessControl } from '../../hooks/useAccessControl';
import { AccessPermissions } from '../../utils/accessControl';
import { Box, Typography } from '@mui/material';

interface RoleGuardProps {
  children: React.ReactNode;
  permission?: keyof AccessPermissions;
  requiredPermissions?: (keyof AccessPermissions)[];
  action?: string; // For canPerform checks
  fallback?: React.ReactElement | null;
  showFallback?: boolean;
  mode?: 'all' | 'any'; // Whether all or any permissions are required
}

/**
 * Component that conditionally renders content based on user permissions
 */
const RoleGuard = ({ 
  children, 
  permission,
  requiredPermissions = [],
  action,
  fallback,
  showFallback = false,
  mode = 'all'
}: RoleGuardProps) => {
  const { hasPermission, canPerform, loading } = useAccessControl();
    if (loading) {
    return null; // or a loading spinner
  }
  
  // Check action-based permission
  if (action && !canPerform(action)) {
    return showFallback ? (fallback || <DefaultFallback />) : null;
  }
  
  // Check single permission
  if (permission && !hasPermission(permission)) {
    return showFallback ? (fallback || <DefaultFallback />) : null;
  }
  
  // Check multiple permissions
  if (requiredPermissions.length > 0) {
    const hasPermissions = mode === 'all' 
      ? requiredPermissions.every(perm => hasPermission(perm))
      : requiredPermissions.some(perm => hasPermission(perm));
      
    if (!hasPermissions) {
      return showFallback ? (fallback || <DefaultFallback />) : null;
    }
  }  
  return <>{children}</>;
};

const DefaultFallback: React.FC = () => (
  <Box sx={{ p: 2, textAlign: 'center' }}>
    <Typography variant="body2" color="text.secondary">
      You don't have permission to view this content.
    </Typography>
  </Box>
);

export default RoleGuard;
