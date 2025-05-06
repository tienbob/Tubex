import React, { useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { generateCssVariables } from './WhiteLabelUtils';

/**
 * Component that injects CSS variables based on the current theme
 * This allows the white label styles to be applied globally
 */
const WhiteLabelStyleInjector: React.FC = () => {
  const { theme } = useTheme();
  
  useEffect(() => {
    // Generate CSS variables
    const cssVars = generateCssVariables(theme);
    
    // Get the root element
    const root = document.documentElement;
    
    // Set each CSS variable
    Object.entries(cssVars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    
    // Add RGB versions of colors for opacity support
    const convertHexToRgb = (hex: string): string => {
      if (!hex) return '0, 0, 0'; // Default to black if hex is undefined
      
      // Remove # if present
      hex = hex.replace('#', '');
      
      // Convert 3-digit hex to 6-digit hex
      if (hex.length === 3) {
        hex = hex.split('').map(char => char + char).join('');
      }
      
      // Convert hex to RGB
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      
      return `${r}, ${g}, ${b}`;
    };
    
    // Add RGB versions of colors
    if (theme.primaryColor) {
      root.style.setProperty('--primary-color-rgb', convertHexToRgb(theme.primaryColor));
    }
    if (theme.secondaryColor) {
      root.style.setProperty('--secondary-color-rgb', convertHexToRgb(theme.secondaryColor));
    }
    
    return () => {
      // Clean up custom properties when component unmounts
      Object.keys(cssVars).forEach(key => {
        root.style.removeProperty(key);
      });
      root.style.removeProperty('--primary-color-rgb');
      root.style.removeProperty('--secondary-color-rgb');
    };
  }, [theme]);
  
  return null;
};

export default WhiteLabelStyleInjector;