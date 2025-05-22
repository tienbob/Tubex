import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import { useTheme } from '../../contexts/ThemeContext';

interface WhiteLabelFooterProps {
  showLogo?: boolean;
  showCopyright?: boolean;
}

const WhiteLabelFooter: React.FC<WhiteLabelFooterProps> = ({
  showLogo = true,
  showCopyright = true,
}) => {
  const { theme } = useTheme();
  const currentYear = new Date().getFullYear();
  return (
    <Box 
      component="footer" 
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) => theme.palette.mode === 'light' 
          ? theme.palette.grey[200] 
          : theme.palette.grey[800],
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {showLogo && theme.logoUrl && (
          <Box 
            component="img"
            sx={{
              height: 30,
              mr: 2
            }}
            alt={`${theme.companyName || 'Company'} logo`}
            src={theme.logoUrl}
          />
        )}
        
        {showCopyright && (
          <Typography variant="body2" color="text.secondary">
            {'© '}
            <Link color="inherit" href="#">
              {theme.companyName || 'Company'}
            </Link>{' '}
            {currentYear}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default WhiteLabelFooter;