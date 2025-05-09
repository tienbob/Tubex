import React from 'react';
import {
  Box,
  Button,
  CircularProgress,
  useTheme as useMuiTheme
} from '@mui/material';
import { useTheme } from '../../contexts/ThemeContext';

interface FormButtonsProps {
  onSubmit: () => void;
  onCancel?: () => void;
  submitText?: string;
  cancelText?: string;
  loading?: boolean;
  disabled?: boolean;
  submitVariant?: 'contained' | 'outlined' | 'text';
  cancelVariant?: 'contained' | 'outlined' | 'text';
  align?: 'left' | 'center' | 'right';
  direction?: 'row' | 'row-reverse';
}

const FormButtons: React.FC<FormButtonsProps> = ({
  onSubmit,
  onCancel,
  submitText = 'Save',
  cancelText = 'Cancel',
  loading = false,
  disabled = false,
  submitVariant = 'contained',
  cancelVariant = 'outlined',
  align = 'right',
  direction = 'row',
}) => {
  const { theme: whitelabelTheme } = useTheme();
  const muiTheme = useMuiTheme();

  // Determine the justifyContent value based on alignment and direction
  const getJustifyContent = () => {
    if (direction === 'row') {
      switch (align) {
        case 'left':
          return 'flex-start';
        case 'center':
          return 'center';
        case 'right':
          return 'flex-end';
        default:
          return 'flex-end';
      }
    } else {
      // For row-reverse, we need to invert the justification
      switch (align) {
        case 'left':
          return 'flex-end';
        case 'center':
          return 'center';
        case 'right':
          return 'flex-start';
        default:
          return 'flex-start';
      }
    }
  };

  // Custom button styles based on the whitelabel theme
  const primaryButtonStyle = {
    backgroundColor: 
      submitVariant === 'contained' 
        ? whitelabelTheme?.primaryColor || muiTheme.palette.primary.main 
        : 'transparent',
    color: 
      submitVariant === 'contained' 
        ? '#fff' 
        : whitelabelTheme?.primaryColor || muiTheme.palette.primary.main,
    borderRadius: whitelabelTheme?.buttonRadius !== undefined 
      ? `${whitelabelTheme.buttonRadius}px` 
      : undefined,
    '&:hover': {
      backgroundColor: 
        submitVariant === 'contained' 
          ? whitelabelTheme?.primaryColor 
            ? `${whitelabelTheme.primaryColor}dd` 
            : muiTheme.palette.primary.dark
          : 'rgba(0, 0, 0, 0.04)',
    },
  };

  const secondaryButtonStyle = {
    color: whitelabelTheme?.secondaryColor || muiTheme.palette.secondary.main,
    borderColor: 
      cancelVariant === 'outlined' 
        ? whitelabelTheme?.secondaryColor || muiTheme.palette.secondary.main 
        : undefined,
    borderRadius: whitelabelTheme?.buttonRadius !== undefined 
      ? `${whitelabelTheme.buttonRadius}px` 
      : undefined,
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: direction },
        justifyContent: { xs: 'stretch', sm: getJustifyContent() },
        gap: 2,
        mt: 2,
        width: '100%',
      }}
    >
      {onCancel && (
        <Button
          variant={cancelVariant}
          onClick={onCancel}
          disabled={loading}
          sx={secondaryButtonStyle}
          fullWidth={true}
        >
          {cancelText}
        </Button>
      )}
      <Button
        variant={submitVariant}
        onClick={onSubmit}
        disabled={disabled || loading}
        sx={primaryButtonStyle}
        fullWidth={true}
      >
        {loading && (
          <CircularProgress
            size={24}
            sx={{ 
              color: submitVariant === 'contained' ? 'white' : primaryButtonStyle.color,
              mr: 1 
            }}
          />
        )}
        {submitText}
      </Button>
    </Box>
  );
};

export default FormButtons;