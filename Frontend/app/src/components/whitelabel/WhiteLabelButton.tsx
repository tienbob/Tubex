import React, { ReactNode } from 'react';
import Button, { ButtonProps } from '@mui/material/Button';
import { useTheme } from '../../contexts/ThemeContext';

interface WhiteLabelButtonProps extends ButtonProps {
  children: ReactNode;
}

const WhiteLabelButton: React.FC<WhiteLabelButtonProps> = ({ 
  children, 
  variant = 'contained',
  color = 'primary',
  ...props 
}) => {
  const { theme } = useTheme();
  
  return (
    <Button
      variant={variant}
      color={color}
      sx={{
        // Using valid theme properties instead of undefined ones
        backgroundColor: color === 'primary' ? theme.primaryColor : theme.secondaryColor,
        color: theme.backgroundColor,
        ...props.sx,
      }}
      {...props}
    >
      {children}
    </Button>
  );
};

export default WhiteLabelButton;