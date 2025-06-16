import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  ListItemIcon,
  useMediaQuery,
  useTheme as useMuiTheme,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  ShoppingCart as OrdersIcon,
  Warehouse as WarehouseIcon,
  Assessment as AnalyticsIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Payment as PaymentIcon
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import ConfirmationDialog from './ConfirmationDialog';

interface WhiteLabelHeaderProps {
  showLogo?: boolean;
}

const WhiteLabelHeader: React.FC<WhiteLabelHeaderProps> = ({
  showLogo = true,
}) => {
  const { theme } = useTheme();
  const muiTheme = useMuiTheme();
  const navigate = useNavigate();
  // FIXED: Use single auth declaration
  const { isAuthenticated, user, loading, logout } = useAuth();
  
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
    // Debug - log auth state in header
  useEffect(() => {
    console.log("WhiteLabelHeader - Auth state:", { 
      isAuthenticated,
      user,
      loading
    });
  }, [isAuthenticated, user, loading]);
  
  // Determine if user is logged in, accounting for loading state
  const userIsLoggedIn = isAuthenticated && !loading && !!user;
  
  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };
    const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };
  
  const handleLogoutClick = () => {
    handleUserMenuClose();
    setLogoutDialogOpen(true);
  };

  const handleLogoutConfirm = () => {
    setLogoutDialogOpen(false);
    logout();
    navigate('/login');
  };

  const handleLogoutCancel = () => {
    setLogoutDialogOpen(false);
  };
  
  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  const navigationItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Products', icon: <InventoryIcon />, path: '/products' },
    { text: 'Inventory', icon: <InventoryIcon />, path: '/inventory' },
    { text: 'Orders', icon: <OrdersIcon />, path: '/orders' },
    { text: 'Warehouses', icon: <WarehouseIcon />, path: '/warehouses' },
    { text: 'Payment', icon: <PaymentIcon />, path: '/payments' },
    { text: 'Analytics', icon: <AnalyticsIcon />, path: '/analytics' },
  ];

  const renderMobileMenu = () => (
    <Drawer
      anchor="right"
      open={mobileMenuOpen}
      onClose={handleMobileMenuToggle}
    >
      <Box
        sx={{ width: 250 }}
        role="presentation"
        onClick={handleMobileMenuToggle}
      >
        <List>
          {/* PROBLEM #2: Use userIsLoggedIn instead of isAuthenticated for consistency */}
          {userIsLoggedIn ? (
            <>
              {navigationItems.map((item) => (
                <ListItem key={item.text} disablePadding>
                  <ListItemButton onClick={() => navigate(item.path)}>
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.text} />
                  </ListItemButton>
                </ListItem>
              ))}
              <Divider />
              <ListItem disablePadding>
                <ListItemButton onClick={() => navigate('/profile')}>
                  <ListItemIcon><PersonIcon /></ListItemIcon>
                  <ListItemText primary="Profile" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton onClick={() => navigate('/settings')}>
                  <ListItemIcon><SettingsIcon /></ListItemIcon>
                  <ListItemText primary="Settings" />
                </ListItemButton>
              </ListItem>              <ListItem disablePadding>
                <ListItemButton onClick={handleLogoutClick}>
                  <ListItemIcon><LogoutIcon /></ListItemIcon>
                  <ListItemText primary="Logout" />
                </ListItemButton>
              </ListItem>
            </>
          ) : (
            <>
              <ListItem disablePadding>
                <ListItemButton onClick={() => navigate('/login')}>
                  <ListItemText primary="Login" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton onClick={() => navigate('/register')}>
                  <ListItemText primary="Register" />
                </ListItemButton>
              </ListItem>
            </>
          )}
        </List>
      </Box>
    </Drawer>
  );

  return (
    <>
      <AppBar 
        position="static" 
        sx={{ 
          bgcolor: theme.primaryColor || muiTheme.palette.primary.main,
          color: 'white'
        }}
      >
        <Toolbar>
          {showLogo && (
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                mr: 2,
                cursor: 'pointer'
              }}
              onClick={() => navigate('/')}
            >
              {theme.logoUrl ? (
                <Box 
                  component="img"
                  sx={{
                    height: 40,
                    mr: 1
                  }}
                  alt={`${theme.companyName || 'Tubex'} logo`}
                  src={theme.logoUrl}
                />
              ) : (
                <Typography
                  variant="h6"
                  noWrap
                  component="div"
                  sx={{ display: { xs: 'none', sm: 'block' } }}
                >
                  {theme.companyName || 'Tubex'}
                </Typography>
              )}
            </Box>
          )}
          
          <Box sx={{ flexGrow: 1 }} />
          
          {!isMobile && userIsLoggedIn && (
            <Box sx={{ display: 'flex' }}>
              {navigationItems.map((item) => (
                <Button
                  key={item.text}
                  sx={{ 
                    color: 'white',
                    display: 'block',
                    textTransform: 'none' 
                  }}
                  onClick={() => navigate(item.path)}
                >
                  {item.text}
                </Button>
              ))}
            </Box>
          )}
          
          {userIsLoggedIn ? (
            <Box sx={{ ml: 2 }}>
              <IconButton
                size="large"
                onClick={handleUserMenuOpen}
                color="inherit"
                edge="end"
              >                <Avatar 
                  sx={{ width: 32, height: 32 }} 
                  alt={user?.firstName || 'User'}
                >
                  {/* FIXED: Updated user reference */}
                  {user?.firstName ? user.firstName[0].toUpperCase() : 'U'}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={userMenuAnchor}
                open={Boolean(userMenuAnchor)}
                onClose={handleUserMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >                <Box sx={{ p: 1.5 }}>
                  <Typography variant="subtitle1">
                    {user?.firstName} {user?.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user?.email}
                  </Typography>
                </Box>
                <Divider />
                <MenuItem onClick={() => { handleUserMenuClose(); navigate('/profile'); }}>
                  <ListItemIcon>
                    <PersonIcon fontSize="small" />
                  </ListItemIcon>
                  Profile
                </MenuItem>
                <MenuItem onClick={() => { handleUserMenuClose(); navigate('/settings'); }}>
                  <ListItemIcon>
                    <SettingsIcon fontSize="small" />
                  </ListItemIcon>
                  Settings
                </MenuItem>
                <Divider />                <MenuItem onClick={handleLogoutClick}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  Logout
                </MenuItem>
              </Menu>
            </Box>
          ) : (
            // Only show login/register if we're certain user is not logged in
            <Box>
              <Button 
                color="inherit" 
                component={Link} 
                to="/login"
                sx={{ mr: 1 }}
              >
                Login
              </Button>
              <Button 
                variant="contained" 
                color="secondary" 
                component={Link} 
                to="/register"
                sx={{ 
                  bgcolor: theme.secondaryColor || muiTheme.palette.secondary.main,
                  '&:hover': {
                    bgcolor: theme.secondaryColor ? `${theme.secondaryColor}cc` : muiTheme.palette.secondary.dark
                  }
                }}
              >
                Register
              </Button>
            </Box>
          )}
          
          {isMobile && (
            <IconButton
              size="large"
              edge="end"
              color="inherit"
              aria-label="menu"
              sx={{ ml: 1 }}
              onClick={handleMobileMenuToggle}
            >
              <MenuIcon />
            </IconButton>
          )}
        </Toolbar>      </AppBar>
      
      {renderMobileMenu()}
      
      {/* Logout Confirmation Dialog */}
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
    </>
  );
};

export default WhiteLabelHeader;