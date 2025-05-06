/**
 * Theme configuration file
 * Contains all theme-related settings and customizations
 */
import { createTheme, ThemeOptions } from '@mui/material/styles';

// Default theme options
export const themeOptions: ThemeOptions = {
  palette: {
    primary: {
      main: '#3f51b5',
      light: '#757de8',
      dark: '#002984',
    },
    secondary: {
      main: '#f50057',
      light: '#ff5983',
      dark: '#bb002f',
    },
    error: {
      main: '#f44336',
    },
    warning: {
      main: '#ff9800',
    },
    info: {
      main: '#2196f3',
    },
    success: {
      main: '#4caf50',
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 500,
    },
    h2: {
      fontWeight: 500,
    },
    h3: {
      fontWeight: 500,
    },
    h4: {
      fontWeight: 500,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 4,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
};

// Create the default theme
export const defaultTheme = createTheme(themeOptions);

// Define defaults to use if values are missing or undefined
const DEFAULT_PRIMARY_COLOR = '#3f51b5';
const DEFAULT_SECONDARY_COLOR = '#f50057';
const DEFAULT_FONT_FAMILY = '"Roboto", "Helvetica", "Arial", sans-serif';

// Function to create tenant-specific themes
export const createTenantTheme = (
  primaryColor?: string, 
  secondaryColor?: string, 
  fontFamily?: string,
  borderRadius?: number
) => {
  // Create a new theme by merging with the default theme
  const customOptions: ThemeOptions = {
    ...themeOptions,
    palette: {
      ...themeOptions.palette,
      primary: {
        main: primaryColor || DEFAULT_PRIMARY_COLOR,
      },
      secondary: {
        main: secondaryColor || DEFAULT_SECONDARY_COLOR,
      },
    },
    typography: {
      ...themeOptions.typography,
      // Type-safe approach for fontFamily
      fontFamily: fontFamily || DEFAULT_FONT_FAMILY,
    },
  };

  if (borderRadius !== undefined) {
    customOptions.shape = {
      ...themeOptions.shape,
      borderRadius,
    };

    customOptions.components = {
      ...themeOptions.components,
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius,
          },
        },
      },
    };
  }

  return createTheme(customOptions);
};

export default defaultTheme;