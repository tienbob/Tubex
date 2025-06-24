import React, { useState } from 'react';
import { Button, IconButton, Tooltip } from '@mui/material';
import { Logout as LogoutIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import ConfirmationDialog from './ConfirmationDialog';

interface LogoutButtonProps {
  variant?: 'button' | 'icon';
  size?: 'small' | 'medium' | 'large';
  showConfirmation?: boolean;
  onLogoutSuccess?: () => void;
  className?: string;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({
  variant = 'button',
  size = 'medium',
  showConfirmation = true,
  onLogoutSuccess,
  className
}) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const handleLogoutClick = () => {
    if (showConfirmation) {
      setLogoutDialogOpen(true);
    } else {
      performLogout();
    }
  };

  const performLogout = () => {
    logout();
    navigate('/login');
    if (onLogoutSuccess) {
      onLogoutSuccess();
    }
  };

  const handleLogoutConfirm = () => {
    setLogoutDialogOpen(false);
    performLogout();
  };

  const handleLogoutCancel = () => {
    setLogoutDialogOpen(false);
  };

  if (variant === 'icon') {
    return (
      <>
        <Tooltip title="Logout">
          <IconButton
            size={size}
            color="inherit"
            onClick={handleLogoutClick}
            className={className}
            aria-label="logout"
          >
            <LogoutIcon />
          </IconButton>
        </Tooltip>
        
        {showConfirmation && (
          <ConfirmationDialog
            open={logoutDialogOpen}
            title="Confirm Logout"
            content="Are you sure you want to logout? You will need to sign in again to access your account."
            onConfirm={handleLogoutConfirm}
            onCancel={handleLogoutCancel}
            confirmText="Logout"
            cancelText="Cancel"
            confirmColor="error"
          />
        )}
      </>
    );
  }

  return (
    <>
      <Button
        variant="outlined"
        color="error"
        size={size}
        startIcon={<LogoutIcon />}
        onClick={handleLogoutClick}
        className={className}
      >
        Logout
      </Button>
      
      {showConfirmation && (
        <ConfirmationDialog
          open={logoutDialogOpen}
          title="Confirm Logout"
          content="Are you sure you want to logout? You will need to sign in again to access your account."
          onConfirm={handleLogoutConfirm}
          onCancel={handleLogoutCancel}
          confirmText="Logout"
          cancelText="Cancel"
          confirmColor="error"
        />
      )}
    </>
  );
};

export default LogoutButton;
