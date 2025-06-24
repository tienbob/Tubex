import React from 'react';
import {
  Alert,
  AlertTitle,
  Snackbar,
  Button,
  Box,
  IconButton,
  Stack,
  Slide,
  SlideProps
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useNotificationContext } from '../../contexts/NotificationContext';
import { Notification } from '../../hooks/useNotification';

// Custom transition for the Snackbar
function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="down" />;
}

// The NotificationItem component for a single notification
const NotificationItem: React.FC<{
  notification: Notification;
  onClose: () => void;
}> = ({ notification, onClose }) => {
  const { id, type, message, title, action } = notification;

  return (
    <Snackbar
      key={id}
      open={true}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      TransitionComponent={SlideTransition}
    >
      <Alert
        severity={type}
        variant="filled"
        sx={{ width: '100%', minWidth: '300px', boxShadow: 3 }}
        action={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {action && (
              <Button 
                color="inherit" 
                size="small" 
                onClick={(e) => {
                  e.stopPropagation();
                  action.onClick();
                  onClose();
                }}
                sx={{ mr: 1 }}
              >
                {action.label}
              </Button>
            )}
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={onClose}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        }
      >
        {title && <AlertTitle>{title}</AlertTitle>}
        {message}
      </Alert>
    </Snackbar>
  );
};

/**
 * NotificationSystem component that displays notifications
 * Should be placed high in the component tree, typically just under the NotificationProvider
 */
const NotificationSystem: React.FC = () => {
  const { notifications, removeNotification } = useNotificationContext();

  // Safety check - limit the number of concurrent notifications
  const visibleNotifications = notifications.slice(0, 5);
  
  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <Stack 
      spacing={1} 
      sx={{ 
        position: 'fixed', 
        top: 16, 
        right: 16, 
        zIndex: 2000,
        maxWidth: 'calc(100% - 32px)',
        width: '400px',
      }}
    >
      {visibleNotifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </Stack>
  );
};

export default NotificationSystem;
