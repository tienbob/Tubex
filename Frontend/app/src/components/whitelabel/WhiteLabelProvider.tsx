import React, { useEffect, useState, ReactNode } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider as CustomThemeProvider, useTheme } from '../../contexts/ThemeContext';
import { loadTenantConfig, detectTenant } from './WhiteLabelUtils';

interface WhiteLabelProviderProps {
  children: ReactNode;
}

// Inner component that uses the theme context
const ThemedContent: React.FC<{children: ReactNode}> = ({ children }) => {
  const { theme } = useTheme();
  
  // Create MUI theme from custom theme
  const muiTheme = createTheme({
    palette: {
      primary: {
        main: theme.primaryColor,
      },
      secondary: {
        main: theme.secondaryColor,
      },
      background: {
        default: theme.backgroundColor,
      },
      text: {
        primary: theme.textColor,
      }
    },
  });
  
  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

const WhiteLabelProvider: React.FC<WhiteLabelProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [initialTheme, setInitialTheme] = useState({});
  
  useEffect(() => {
    const initTenant = async () => {
      // Detect tenant from URL, subdomain, etc.
      const detectedTenantId = detectTenant();
      
      try {
        // Load tenant configuration
        const tenantConfig = await loadTenantConfig(detectedTenantId);
        setInitialTheme(tenantConfig);
      } catch (error) {
        console.error('Failed to load tenant configuration:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initTenant();
  }, []);
  
  if (isLoading) {
    // You can add a loading spinner here if needed
    return <div>Loading...</div>;
  }
  
  return (
    <CustomThemeProvider initialTheme={initialTheme}>
      <ThemedContent>
        {children}
      </ThemedContent>
    </CustomThemeProvider>
  );
};

export default WhiteLabelProvider;