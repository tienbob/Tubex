import React, { useState } from 'react';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import AccountCircle from '@mui/icons-material/AccountCircle';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

interface WhiteLabelHeaderProps {
  showLogo?: boolean;
  showCompanyName?: boolean;
}

const WhiteLabelHeader: React.FC<WhiteLabelHeaderProps> = ({
  showLogo = true,
  showCompanyName = true,
}) => {
  const { theme } = useTheme();
  const { isAuthenticated, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
  };

  return (
    <AppBar position="static" color="primary">
      <Toolbar>
        {showLogo && (
          <Box 
            component="img"
            sx={{
              height: 40,
              mr: 2
            }}
            alt={`${theme.companyName} logo`}
            src={theme.logoUrl}
          />
        )}
        {showCompanyName && (
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {theme.companyName}
          </Typography>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button color="inherit" href="/">Home</Button>
          
          {isAuthenticated && (
            <>
              <Button color="inherit" href="/dashboard">Dashboard</Button>
              <Button color="inherit" href="/products">Products</Button>
              <Button color="inherit" href="/orders">Orders</Button>
              <Button color="inherit" href="/inventory">Inventory</Button>
            </>
          )}
          
          {isAuthenticated ? (
            <div>
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
              >
                <AccountCircle />
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem onClick={handleClose}>Profile</MenuItem>
                <MenuItem onClick={handleClose}>My Account</MenuItem>
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </Menu>
            </div>
          ) : (
            <>
              <Button color="inherit" href="/login">Login</Button>
              <Button color="inherit" href="/register">Register</Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default WhiteLabelHeader;