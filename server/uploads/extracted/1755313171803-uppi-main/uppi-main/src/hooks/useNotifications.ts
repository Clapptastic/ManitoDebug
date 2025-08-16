
import { useNotification } from '@/contexts/NotificationContext';
import { Notification } from '@/types/notification';

/**
 * A hook that provides access to the notification system
 * @returns Notification context methods
 */
export function useNotifications() {
  return useNotification();
}

/**
 * Standalone notification functions (can be used outside React components)
 */
let notificationFunctions: {
  show: (notification: Omit<Notification, 'id' | 'createdAt'>) => string;
  success: (message: string, title?: string, options?: any) => string;
  error: (message: string, title?: string, options?: any) => string;
  warning: (message: string, title?: string, options?: any) => string;
  info: (message: string, title?: string, options?: any) => string;
} | null = null;

// Function to register notification functions from the context
export function registerNotificationFunctions(functions: any) {
  notificationFunctions = functions;
}

// Standalone notification functions for use outside components
export const toast = {
  show: (notification: Omit<Notification, 'id' | 'createdAt'>) => {
    if (!notificationFunctions) {
      console.error('Notification functions not registered yet');
      return '';
    }
    return notificationFunctions.show(notification);
  },
  success: (message: string, title?: string, options?: any) => {
    if (!notificationFunctions) {
      console.error('Notification functions not registered yet');
      return '';
    }
    return notificationFunctions.success(message, title, options);
  },
  error: (message: string, title?: string, options?: any) => {
    if (!notificationFunctions) {
      console.error('Notification functions not registered yet');
      return '';
    }
    return notificationFunctions.error(message, title, options);
  },
  warning: (message: string, title?: string, options?: any) => {
    if (!notificationFunctions) {
      console.error('Notification functions not registered yet');
      return '';
    }
    return notificationFunctions.warning(message, title, options);
  },
  info: (message: string, title?: string, options?: any) => {
    if (!notificationFunctions) {
      console.error('Notification functions not registered yet');
      return '';
    }
    return notificationFunctions.info(message, title, options);
  }
};
