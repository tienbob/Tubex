import React, { createContext, useContext, useState, useCallback } from 'react';
import { 
  Snackbar,
  Alert,
  AlertColor,
  Slide,
  SlideProps
} from '@mui/material';

type SlideDirection = 'up' | 'down' | 'left' | 'right';

interface Toast {
  id: number;
  message: string;
  severity: AlertColor;
  duration?: number;
  slideDirection?: SlideDirection;
}

interface ToastContextType {
  showToast: (message: string, severity?: AlertColor, duration?: number, slideDirection?: SlideDirection) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Custom SlideTransition component
const SlideTransition = (props: SlideProps & { direction: SlideDirection }) => {
  return <Slide {...props} direction={props.direction} />;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<Toast | null>(null);
  const [toastIdCounter, setToastIdCounter] = useState(0);

  const showToast = useCallback((
    message: string, 
    severity: AlertColor = 'info', 
    duration: number = 4000,
    slideDirection: SlideDirection = 'left'
  ) => {
    const id = toastIdCounter;
    setToastIdCounter(prev => prev + 1);
    
    const newToast = { id, message, severity, duration, slideDirection };
    
    setToasts(prev => [...prev, newToast]);
    
    if (!open) {
      setCurrent(newToast);
      setOpen(true);
    }
  }, [open, toastIdCounter]);
  
  const success = useCallback((message: string, duration?: number) => 
    showToast(message, 'success', duration), [showToast]);
    
  const error = useCallback((message: string, duration?: number) => 
    showToast(message, 'error', duration), [showToast]);
    
  const warning = useCallback((message: string, duration?: number) => 
    showToast(message, 'warning', duration), [showToast]);
    
  const info = useCallback((message: string, duration?: number) => 
    showToast(message, 'info', duration), [showToast]);

  const handleClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };

  const handleExited = () => {
    setToasts(prev => {
      const newToasts = prev.filter(toast => toast.id !== current?.id);
      
      if (newToasts.length > 0) {
        setCurrent(newToasts[0]);
        setOpen(true);
      } else {
        setCurrent(null);
      }
      
      return newToasts;
    });
  };

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={current?.duration}
        onClose={handleClose}
        TransitionComponent={(props) => (
          <SlideTransition {...props} direction={current?.slideDirection || 'left'} />
        )}
        TransitionProps={{ 
          onExited: handleExited 
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleClose} 
          severity={current?.severity || 'info'}
          variant="filled"
          elevation={6}
          sx={{ width: '100%' }}
        >
          {current?.message || ''}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
