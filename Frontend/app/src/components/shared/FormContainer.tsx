import React from 'react';
import { 
  Paper, 
  Box, 
  Typography, 
  Alert, 
  LinearProgress, 
  Divider,
  useTheme as useMuiTheme
} from '@mui/material';
import { useTheme } from '../../contexts/ThemeContext';

interface FormContainerProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  loading?: boolean;
  error?: string | null;
  maxWidth?: string | number;
  padding?: number;
}

const FormContainer: React.FC<FormContainerProps> = ({
  children,
  title,
  subtitle,
  loading = false,
  error = null,
  maxWidth = '100%',
  padding = 3
}) => {
  const muiTheme = useMuiTheme();
  const { theme: whitelabelTheme } = useTheme();
  
  return (
    <Box 
      sx={{ 
        maxWidth, 
        width: '100%', 
        mx: 'auto',
      }}
    >
      <Paper 
        elevation={2} 
        sx={{ 
          position: 'relative',
          borderRadius: whitelabelTheme?.buttonRadius !== undefined ? 
            `${whitelabelTheme.buttonRadius}px` : undefined,
          overflow: 'hidden'
        }}
      >
        {loading && (
          <LinearProgress 
            sx={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              backgroundColor: 'transparent',
              '& .MuiLinearProgress-bar': {
                backgroundColor: whitelabelTheme?.primaryColor || muiTheme.palette.primary.main
              }
            }} 
          />
        )}
        
        <Box sx={{ p: padding }}>
          <Box sx={{ mb: 3 }}>
            <Typography 
              variant="h5" 
              component="h2" 
              gutterBottom
              sx={{ 
                color: whitelabelTheme?.primaryColor || muiTheme.palette.primary.main,
                fontFamily: whitelabelTheme?.fontFamily || 'inherit'
              }}
            >
              {title}
            </Typography>
            
            {subtitle && (
              <Typography 
                variant="subtitle1" 
                color="text.secondary"
              >
                {subtitle}
              </Typography>
            )}
          </Box>
          
          {error && (
            <Alert 
              severity="error" 
              sx={{ mb: 3 }}
            >
              {error}
            </Alert>
          )}
          
          <Divider sx={{ mb: 3 }} />
          
          <Box 
            sx={{ 
              opacity: loading ? 0.7 : 1,
              pointerEvents: loading ? 'none' : 'auto'
            }}
          >
            {children}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default FormContainer;