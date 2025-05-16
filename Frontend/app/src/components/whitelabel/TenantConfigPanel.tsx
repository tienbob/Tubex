import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Paper, Divider } from '@mui/material';
import { useTheme, Theme } from '../../contexts/ThemeContext';
import { saveTenantConfig } from './WhiteLabelUtils';

interface TenantConfigPanelProps {
  tenantId: string;
}

// Extended theme interface to include optional fields for form
interface ExtendedTheme extends Theme {
  fontFamily?: string;
  buttonRadius?: number;
}

const TenantConfigPanel: React.FC<TenantConfigPanelProps> = ({ tenantId }) => {
  const { theme, updateTheme } = useTheme();
  const [formState, setFormState] = useState<Partial<ExtendedTheme>>(theme);
  const [previewVisible, setPreviewVisible] = useState(false);
  
  // Update form state when theme changes
  useEffect(() => {
    setFormState(theme);
  }, [theme]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState((prev: Partial<ExtendedTheme>) => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Update the theme context
    updateTheme(formState);
    
    // Save tenant configuration to localStorage (or API in production)
    saveTenantConfig(tenantId, formState);
  };
  
  // Handle reset by applying default theme
  const handleReset = () => {
    // Create our own reset functionality since resetTheme doesn't exist in context
    const defaultTheme = {
      primaryColor: '#1976d2',
      secondaryColor: '#dc004e',
      backgroundColor: '#ffffff',
      textColor: '#333333',
      logoUrl: '/logo.svg',
      companyName: 'Tubex'
    };
    
    updateTheme(defaultTheme);
    setFormState(defaultTheme);
  };
  
  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        White Label Configuration
      </Typography>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Tenant ID: {tenantId}
      </Typography>
      
      <Divider sx={{ my: 2 }} />
      
      <form onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          <Box sx={{ flex: '1 1 auto', width: { xs: '100%', sm: '48%' } }}>
            <Typography variant="subtitle1">Branding</Typography>
            
            <TextField
              fullWidth
              margin="normal"
              label="Company Name"
              name="companyName"
              value={formState.companyName || ''}
              onChange={handleChange}
            />
            
            <TextField
              fullWidth
              margin="normal"
              label="Logo URL"
              name="logoUrl"
              value={formState.logoUrl || ''}
              onChange={handleChange}
            />
          </Box>
          
          <Box sx={{ flex: '1 1 auto', width: { xs: '100%', sm: '48%' } }}>
            <Typography variant="subtitle1">Styling</Typography>
            
            <TextField
              fullWidth
              margin="normal"
              label="Primary Color"
              name="primaryColor"
              type="color"
              value={formState.primaryColor || '#3f51b5'}
              onChange={handleChange}
              inputProps={{ style: { height: '50px' } }}
            />
            
            <TextField
              fullWidth
              margin="normal"
              label="Secondary Color"
              name="secondaryColor"
              type="color"
              value={formState.secondaryColor || '#f50057'}
              onChange={handleChange}
              inputProps={{ style: { height: '50px' } }}
            />
            
            <TextField
              fullWidth
              margin="normal"
              label="Font Family"
              name="fontFamily"
              value={formState.fontFamily || 'Roboto, sans-serif'}
              onChange={handleChange}
            />
            
            <TextField
              fullWidth
              margin="normal"
              label="Button Radius (px)"
              name="buttonRadius"
              type="number"
              InputProps={{ inputProps: { min: 0, max: 24 } }}
              value={formState.buttonRadius || 4}
              onChange={handleChange}
            />
          </Box>
        </Box>
        
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
          <Button variant="outlined" onClick={handleReset}>
            Reset to Default
          </Button>
          
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
          >
            Save Configuration
          </Button>
        </Box>
      </form>
      
      {previewVisible && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6">Preview</Typography>
          {/* Preview components could be added here */}
        </Box>
      )}
    </Paper>
  );
};

export default TenantConfigPanel;