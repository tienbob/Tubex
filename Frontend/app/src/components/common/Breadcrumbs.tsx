import React from 'react';
import { 
  Breadcrumbs as MuiBreadcrumbs, 
  Link, 
  Typography, 
  Box,
  useTheme as useMuiTheme
} from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { useTheme } from '../../contexts/ThemeContext';
import HomeIcon from '@mui/icons-material/Home';

// Map of paths to friendly names
const pathNameMap: Record<string, string> = {
  'dashboard': 'Dashboard',
  'products': 'Products',
  'inventory': 'Inventory',
  'warehouses': 'Warehouses',
  'orders': 'Orders',
  'payments': 'Payments',
  'invoices': 'Invoices',
  'quotes': 'Quotes',
  'pricelists': 'Price Lists',
  'profile': 'User Profile',
  'settings': 'Settings',
  'analytics': 'Analytics'
};

const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const { theme: customTheme } = useTheme();
  const muiTheme = useMuiTheme();
  
  // Don't show breadcrumbs on home page
  if (location.pathname === '/' || location.pathname === '/dashboard') {
    return null;
  }
    // Generate breadcrumb items based on current path
  const pathnames = location.pathname.split('/').filter(Boolean);
  
  const breadcrumbs = pathnames.map((value, index) => {
    const last = index === pathnames.length - 1;
    const to = `/${pathnames.slice(0, index + 1).join('/')}`;
    
    // Check for ID patterns (UUIDs, ObjectIDs, etc.)
    const isId = value.length > 20 || /^[0-9a-f]{24}$/.test(value);
    // Use lookup map for friendly names, fallback to the path value
    let name = pathNameMap[value] || value;
    
    // If it looks like an ID, try to get the resource type from the previous path segment
    if (isId && index > 0) {
      const resourceType = pathnames[index - 1];
      // Remove trailing 's' if present (e.g., "products" -> "product")
      const singularType = resourceType.endsWith('s') ? resourceType.slice(0, -1) : resourceType;
      name = `${singularType[0].toUpperCase() + singularType.slice(1)} ${value.substring(0, 8)}...`;
    }

    return { name, to, last };
  });
  
  return (
    <Box 
      sx={{ 
        p: 1.5, 
        backgroundColor: 'background.paper',
        borderBottom: `1px solid ${muiTheme.palette.divider}`,
        mb: 2,
        display: 'flex',
        alignItems: 'center'
      }}
      role="navigation"
      aria-label="breadcrumb"
    >
      <MuiBreadcrumbs 
        separator={<NavigateNextIcon fontSize="small" />}
        aria-label="breadcrumb"
      >
        <Link
          component={RouterLink}
          to="/dashboard"
          color="inherit"
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            color: customTheme?.primaryColor || muiTheme.palette.primary.main,
            '&:hover': {
              textDecoration: 'none',
              opacity: 0.8
            }
          }}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
          Home
        </Link>
        
        {breadcrumbs.map((breadcrumb, index) => (
          breadcrumb.last ? (
            <Typography 
              key={index} 
              color="text.primary"
              aria-current="page"
              sx={{ fontWeight: 500 }}
            >
              {breadcrumb.name}
            </Typography>
          ) : (
            <Link
              key={index}
              component={RouterLink}
              to={breadcrumb.to}
              color="inherit"
              sx={{ 
                color: customTheme?.primaryColor || muiTheme.palette.primary.main,
                '&:hover': {
                  textDecoration: 'none',
                  opacity: 0.8
                }
              }}
            >
              {breadcrumb.name}
            </Link>
          )
        ))}
      </MuiBreadcrumbs>
    </Box>
  );
};

export default Breadcrumbs;
