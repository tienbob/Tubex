import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { defaultTheme, createTenantTheme } from '../config/theme';

// Define theme interface
export interface Theme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  logoUrl: string;
  companyName: string;
  fontFamily?: string;
  borderRadius?: number;
  buttonRadius?: number;
}

// Define context type
interface ThemeContextType {
  theme: Theme;
  updateTheme: (newTheme: Partial<Theme>) => void;
}

// Default theme values aligned with MUI theme
const defaultThemeValues: Theme = {
  primaryColor: defaultTheme.palette.primary.main,
  secondaryColor: defaultTheme.palette.secondary.main,
  backgroundColor: defaultTheme.palette.background.default,
  textColor: defaultTheme.palette.text?.primary || '#333333',
  logoUrl: '/logo.svg',
  companyName: 'Tubex',
  fontFamily: defaultTheme.typography.fontFamily,
  borderRadius: defaultTheme.shape.borderRadius
};

// Create context
const ThemeContext = createContext<ThemeContextType>({
  theme: defaultThemeValues,
  updateTheme: () => {},
});

interface ThemeProviderProps {
  children: ReactNode;
  initialTheme?: Partial<Theme>;
}

// Provider component
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children,
  initialTheme = {}
}) => {
  // Merge default theme with any provided initial theme
  const [theme, setTheme] = useState<Theme>({
    ...defaultThemeValues,
    ...initialTheme,
  });

  // Function to update theme partially or fully
  const updateTheme = (newTheme: Partial<Theme>) => {
    setTheme(prevTheme => ({
      ...prevTheme,
      ...newTheme,
    }));
  };

  // Create MUI theme based on current theme values
  const muiTheme = useMemo(() => {
    return createTenantTheme(
      theme.primaryColor,
      theme.secondaryColor,
      theme.fontFamily,
      theme.borderRadius
    );
  }, [theme.primaryColor, theme.secondaryColor, theme.fontFamily, theme.borderRadius]);

  return (
    <ThemeContext.Provider value={{ theme, updateTheme }}>
      <MuiThemeProvider theme={muiTheme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

// Custom hook for using theme
export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;