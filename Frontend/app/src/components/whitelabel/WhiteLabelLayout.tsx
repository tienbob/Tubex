import React, { ReactNode, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import CircularProgress from '@mui/material/CircularProgress';
import WhiteLabelHeader from './WhiteLabelHeader';
import WhiteLabelFooter from './WhiteLabelFooter';
import WhiteLabelStyleInjector from './WhiteLabelStyleInjector';
import { useAuth } from '../../contexts/AuthContext';

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

  // Handle authentication check on component mount
  useEffect(() => {
    if (!loading) {
      // Auth check completed
      setIsInitializing(false);
    }
  }, [loading]);

  // Show loading spinner while checking auth
  if ((requireAuth && isInitializing) || (requireAuth && loading)) {
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

  // If auth is required but user is not authenticated, you could redirect here
  // or show a login prompt component instead of the requested page
  if (requireAuth && !isAuthenticated) {
    // In a real app, you might redirect to login page or show a login component
    // For this example, we'll just render a message
    return (
      <Box className="wl-page-container">
        <WhiteLabelStyleInjector />
        {showHeader && <WhiteLabelHeader />}
        <Container maxWidth={maxWidth} className="wl-content">
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <h2>Authentication Required</h2>
            <p>You need to be logged in to access this page.</p>
            {/* A login button or form could be added here */}
          </Box>
        </Container>
        {showFooter && <WhiteLabelFooter />}
      </Box>
    );
  }

  return (
    <Box className="wl-page-container">
      {/* Inject CSS variables for theme */}
      <WhiteLabelStyleInjector />
      
      {/* Header */}
      {showHeader && <WhiteLabelHeader />}
      
      {/* Main content */}
      <Container maxWidth={maxWidth} className="wl-content">
        {children}
      </Container>
      
      {/* Footer */}
      {showFooter && <WhiteLabelFooter />}
    </Box>
  );
};

export default WhiteLabelLayout;