import React, { useEffect, useState } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Collapse,
  Divider,
  Tooltip,
  IconButton,
  useTheme as useMuiTheme,
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';

// Icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import DescriptionIcon from '@mui/icons-material/Description';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import PaymentIcon from '@mui/icons-material/Payment';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import BarChartIcon from '@mui/icons-material/BarChart';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import MenuIcon from '@mui/icons-material/Menu';
import ReceiptIcon from '@mui/icons-material/Receipt';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';

// Define navigation items
const navigationItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: <DashboardIcon />,
  },
  {
    id: 'analytics',
    label: 'Analytics',
    path: '/analytics',
    icon: <BarChartIcon />,
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: <InventoryIcon />,
    children: [
      { id: 'products', label: 'Products', path: '/products' },
      { id: 'inventory', label: 'Inventory', path: '/inventory' },
      { id: 'warehouses', label: 'Warehouses', path: '/warehouses' },
    ],
  },
  {
    id: 'sales',
    label: 'Sales',
    icon: <ShoppingCartIcon />,
    children: [
      { id: 'orders', label: 'Orders', path: '/orders' },
      { id: 'payments', label: 'Payments', path: '/payments' },
      { id: 'invoices', label: 'Invoices', path: '/invoices' },
      { id: 'quotes', label: 'Quotes', path: '/quotes' },
      { id: 'pricelists', label: 'Price Lists', path: '/pricelists' },
    ],
  },
  {
    id: 'account',
    label: 'Account',
    icon: <AccountCircleIcon />,
    children: [
      { id: 'profile', label: 'My Profile', path: '/profile' },
      { id: 'settings', label: 'Settings', path: '/settings' },
    ],
  },
];

const STORAGE_KEY = 'tubex_side_nav_expanded_groups';

const drawerWidth = 240;

const DRAWER_STATE_KEY = 'tubex_side_nav_open';

const SideNavigation: React.FC = () => {
  // Load drawer open state from localStorage
  const [open, setOpen] = useState(() => {
    try {
      const saved = localStorage.getItem(DRAWER_STATE_KEY);
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });
  
  // Load expanded groups from localStorage
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    const initial: Record<string, boolean> = {};
    navigationItems.forEach((item) => {
      if (item.children) {
        initial[item.id] = item.id === 'inventory';
      }
    });
    return initial;
  });
  
  // Persist group expansion to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(expandedGroups));
    } catch (e) {
      console.warn('Failed to save navigation state to localStorage', e);
    }
  }, [expandedGroups]);
  
  // Persist drawer state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(DRAWER_STATE_KEY, String(open));
    } catch (e) {
      console.warn('Failed to save drawer state to localStorage', e);
    }
  }, [open]);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { theme: customTheme } = useTheme();
  const muiTheme = useMuiTheme();
  
  const toggleDrawer = () => {
    setOpen(!open);
  };
  
  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = { ...prev, [groupId]: !prev[groupId] };
      return next;
    });
  };
  
  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };
  
  const isActiveGroup = (groupId: string) => {
    const group = navigationItems.find(item => item.id === groupId);
    if (!group || !group.children) return false;
    
    return group.children.some(child => location.pathname.startsWith(child.path));
  };

  // Helper: only use user state for expansion, never auto-expand by route
  const isGroupExpanded = (groupId: string) => {
    return !!expandedGroups[groupId];
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: open ? drawerWidth : 56,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: open ? drawerWidth : 56,
          boxSizing: 'border-box',
          overflow: open ? 'auto' : 'hidden',
          transition: muiTheme.transitions.create(['width'], {
            easing: muiTheme.transitions.easing.sharp,
            duration: muiTheme.transitions.duration.enteringScreen,
          }),
          backgroundColor: customTheme?.backgroundColor || muiTheme.palette.background.paper,
          borderRight: `1px solid ${muiTheme.palette.divider}`,
          color: customTheme?.textColor || 'inherit',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: open ? 'flex-end' : 'center',
          p: 1,
          minHeight: 64,
        }}
      >
        <IconButton onClick={toggleDrawer}>
          {open ? <MenuOpenIcon /> : <MenuIcon />}
        </IconButton>
      </Box>
      
      <Divider />
      
      <List sx={{ pt: 0 }}>
        {navigationItems.map((item) => (
          item.children ? (
            <React.Fragment key={item.id}>
              <ListItem 
                disablePadding
                sx={{
                  display: 'block',
                  backgroundColor: isActiveGroup(item.id) ? 
                    `${customTheme?.primaryColor || muiTheme.palette.primary.main}22` : 
                    'transparent',
                }}
              >
                <ListItemButton
                  onClick={() => toggleGroup(item.id)}
                  sx={{
                    minHeight: 48,
                    justifyContent: open ? 'initial' : 'center',
                    px: 2.5,
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: open ? 2 : 'auto',
                      justifyContent: 'center',
                      color: isActiveGroup(item.id) ? 
                        customTheme?.primaryColor || muiTheme.palette.primary.main : 
                        'inherit',
                    }}
                  >
                    <Tooltip title={open ? '' : item.label} placement="right" arrow>
                      <Box component="span">{item.icon}</Box>
                    </Tooltip>
                  </ListItemIcon>
                  {open && (
                    <>
                      <ListItemText 
                        primary={item.label} 
                        primaryTypographyProps={{
                          fontWeight: isActiveGroup(item.id) ? 600 : 400,
                          color: isActiveGroup(item.id) ? 
                            customTheme?.primaryColor || muiTheme.palette.primary.main : 
                            'inherit',
                        }}
                      />
                      {expandedGroups[item.id] ? <ExpandMoreIcon /> : <ChevronRightIcon />}
                    </>
                  )}
                </ListItemButton>
              </ListItem>
              
              {open && (
                <Collapse in={isGroupExpanded(item.id)} timeout="auto" unmountOnExit>
                  <List disablePadding>
                    {item.children.map((child) => (
                      <ListItemButton
                        key={child.id}
                        onClick={() => navigate(child.path)}
                        sx={{
                          pl: 4,
                          py: 1,
                          backgroundColor: isActiveRoute(child.path) ? 
                            `${customTheme?.primaryColor || muiTheme.palette.primary.main}22` : 
                            'transparent',
                        }}
                      >
                        <ListItemText 
                          primary={child.label} 
                          primaryTypographyProps={{
                            fontWeight: isActiveRoute(child.path) ? 600 : 400,
                            fontSize: '0.9rem',
                            color: isActiveRoute(child.path) ? 
                              customTheme?.primaryColor || muiTheme.palette.primary.main : 
                              'inherit',
                          }}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                </Collapse>
              )}
            </React.Fragment>
          ) : (
            <ListItem 
              key={item.id} 
              disablePadding
              sx={{
                display: 'block',
                backgroundColor: isActiveRoute(item.path) ? 
                  `${customTheme?.primaryColor || muiTheme.palette.primary.main}22` : 
                  'transparent',
              }}
            >
              <ListItemButton
                onClick={() => navigate(item.path)}
                sx={{
                  minHeight: 48,
                  justifyContent: open ? 'initial' : 'center',
                  px: 2.5,
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: open ? 2 : 'auto',
                    justifyContent: 'center',
                    color: isActiveRoute(item.path) ? 
                      customTheme?.primaryColor || muiTheme.palette.primary.main : 
                      'inherit',
                  }}
                >
                  <Tooltip title={open ? '' : item.label} placement="right" arrow>
                    <Box component="span">{item.icon}</Box>
                  </Tooltip>
                </ListItemIcon>
                {open && (
                  <ListItemText 
                    primary={item.label} 
                    primaryTypographyProps={{
                      fontWeight: isActiveRoute(item.path) ? 600 : 400,
                      color: isActiveRoute(item.path) ? 
                        customTheme?.primaryColor || muiTheme.palette.primary.main : 
                        'inherit',
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          )
        ))}
      </List>
    </Drawer>
  );
};

export default SideNavigation;
