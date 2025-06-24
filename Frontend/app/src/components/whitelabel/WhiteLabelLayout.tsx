import React, { ReactNode, useEffect, useState } from 'react';
import { Box, useTheme as useMuiTheme } from '@mui/material';
import Container from '@mui/material/Container';
import CircularProgress from '@mui/material/CircularProgress';
import WhiteLabelFooter from './WhiteLabelFooter';
import WhiteLabelStyleInjector from './WhiteLabelStyleInjector';
import { useAuth } from '../../components/auth/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import SideNavigation from './SideNavigation';
import WhiteLabelHeader from './WhiteLabelHeader';

interface WhiteLabelLayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  requireAuth?: boolean;
}

const WhiteLabelLayout: React.FC<WhiteLabelLayoutProps> = ({
  children,
  showHeader = true,
  showFooter = true,
  maxWidth = 'lg',
  requireAuth = false,
}) => {
  const { isAuthenticated, loading } = useAuth();
  const [isInitializing, setIsInitializing] = useState(true);
  const { theme: customTheme } = useTheme();
  const muiTheme = useMuiTheme();

  // Handle authentication check on component mount
  useEffect(() => {
    if (!loading) {
      setIsInitializing(false);
    }
  }, [loading]);
  // Show loading spinner while checking auth
  if (requireAuth && (isInitializing || loading)) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <CircularProgress />
      </Box>
    );
  }
  // If auth is required but user is not authenticated, show login prompt
  if (requireAuth && !isAuthenticated) {
    return (
      <Box sx={{ 
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh'
      }}>
        <WhiteLabelStyleInjector />
        {showHeader && <WhiteLabelHeader/>}
        <Container 
          maxWidth={maxWidth} 
          sx={{ 
            flex: '1 0 auto',
            display: 'flex',
            flexDirection: 'column',
            py: 3
          }}
        >
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <h2>Authentication Required</h2>
            <p>You need to be logged in to access this page.</p>
          </Box>
        </Container>
        {showFooter && (
          <Box component="footer" sx={{ flexShrink: 0 }}>
            <WhiteLabelFooter />
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: customTheme?.backgroundColor || muiTheme.palette.background.default,
      }}
    >
      <WhiteLabelStyleInjector />
      {/* Header removed as requested */}
      <Box sx={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Side Navigation */}
        <SideNavigation />
        {/* Main Content Area (with footer below) */}
        <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, minHeight: 0 }}>
          <Box
            component="main"
            id="main-content"
            tabIndex={-1}
            sx={{
              flexGrow: 1,
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
              outline: 'none',
              minHeight: 0,
            }}
          >
            {/* Breadcrumbs removed for cleaner UI */}
            <Box sx={{ p: 2, flexGrow: 1 }}>{children}</Box>
          </Box>
          {/* Footer always at the bottom of main content, not under side nav */}
          {showFooter && (
            <Box component="footer" sx={{ width: '100%', mt: 'auto' }}>
              <WhiteLabelFooter />
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default WhiteLabelLayout;