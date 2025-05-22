import { useState, useCallback, useEffect } from 'react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  title?: string;
  duration?: number;
  autoClose?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface NotificationOptions {
  title?: string;
  duration?: number;
  autoClose?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Custom hook for managing notifications in the application
 * @returns Object with functions to show notifications and the current notifications array
 */
export function useNotification() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Generate a unique ID for notifications
  const generateId = useCallback(() => {
    return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Show a notification
  const showNotification = useCallback(
    (type: NotificationType, message: string, options: NotificationOptions = {}) => {
      const {
        title,
        duration = type === 'error' ? 8000 : 5000, // Errors stay longer
        autoClose = true,
        action
      } = options;
      
      const id = generateId();
      
      const newNotification: Notification = {
        id,
        type,
        message,
        title,
        duration,
        autoClose,
        action
      };
      
      setNotifications(prev => [...prev, newNotification]);
      
      return id;
    },
    [generateId]
  );
  
  // Remove a notification by ID
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Helper methods for different notification types
  const success = useCallback(
    (message: string, options?: NotificationOptions) => 
      showNotification('success', message, options),
    [showNotification]
  );
  
  const error = useCallback(
    (message: string, options?: NotificationOptions) => 
      showNotification('error', message, options),
    [showNotification]
  );
  
  const warning = useCallback(
    (message: string, options?: NotificationOptions) => 
      showNotification('warning', message, options),
    [showNotification]
  );
  
  const info = useCallback(
    (message: string, options?: NotificationOptions) => 
      showNotification('info', message, options),
    [showNotification]
  );

  // Auto-close logic for notifications with autoClose=true
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    
    notifications.forEach(notification => {
      if (notification.autoClose && notification.duration) {
        const timer = setTimeout(() => {
          removeNotification(notification.id);
        }, notification.duration);
        
        timers.push(timer);
      }
    });
    
    // Cleanup timers on component unmount
    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [notifications, removeNotification]);

  return {
    // Notification array
    notifications,
    
    // Generic notification method
    showNotification,
    
    // Type-specific shortcuts
    success,
    error,
    warning,
    info,
    
    // Management methods
    removeNotification,
    clearNotifications
  };
}

export default useNotification;
