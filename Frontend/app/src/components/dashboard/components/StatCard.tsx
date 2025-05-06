import React from 'react';
import { Card, CardContent, Typography, Box, SvgIconProps } from '@mui/material';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactElement<SvgIconProps>;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning';
}

/**
 * A reusable card component for displaying statistics/metrics on the dashboard
 */
const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon, 
  color = 'primary' 
}) => {
  return (
    <Card elevation={2}>
      <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
        {React.cloneElement(icon, { 
          sx: { fontSize: 40, mr: 2, color: `${color}.main` } 
        })}
        <Box>
          <Typography variant="h5" component="div">
            {value}
          </Typography>
          <Typography color="textSecondary">
            {title}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatCard;