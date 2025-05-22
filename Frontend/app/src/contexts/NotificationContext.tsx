import React, { createContext, useContext, ReactNode } from 'react';
import useNotification, {
  Notification,
  NotificationType,
  NotificationOptions
} from '../hooks/useNotification';

// Context interface
interface NotificationContextType {
  notifications: Notification[];
  showNotification: (type: NotificationType, message: string, options?: NotificationOptions) => string;
  success: (message: string, options?: NotificationOptions) => string;
  error: (message: string, options?: NotificationOptions) => string;
  warning: (message: string, options?: NotificationOptions) => string;
  info: (message: string, options?: NotificationOptions) => string;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

// Create the context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Props for the provider component
interface NotificationProviderProps {
  children: ReactNode;
}

/**
 * Provider component that wraps your app and makes notification API
 * available throughout your app.
 */
export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const notificationManager = useNotification();
  
  return (
    <NotificationContext.Provider value={notificationManager}>
      {children}
    </NotificationContext.Provider>
  );
};

/**
 * Hook to use the notification context
 * @returns The notification context
 * @throws Error if used outside of NotificationProvider
 */
export const useNotificationContext = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  
  return context;
};

export default NotificationContext;
