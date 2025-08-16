
/**
 * Notification Types
 */

// Different types of notifications
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

// Notification position
export type NotificationPosition = 
  | 'top-right' 
  | 'top-left' 
  | 'bottom-right' 
  | 'bottom-left' 
  | 'top-center' 
  | 'bottom-center';

// Notification object
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose?: () => void;
  createdAt: Date;
}

// Notification context state
export interface NotificationState {
  notifications: Notification[];
  position: NotificationPosition;
}

// Notification context actions
export interface NotificationContextType extends NotificationState {
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => string;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  setPosition: (position: NotificationPosition) => void;
  
  // Convenience methods
  success: (message: string, title?: string, options?: Partial<Omit<Notification, 'id' | 'createdAt' | 'type' | 'message' | 'title'>>) => string;
  error: (message: string, title?: string, options?: Partial<Omit<Notification, 'id' | 'createdAt' | 'type' | 'message' | 'title'>>) => string;
  warning: (message: string, title?: string, options?: Partial<Omit<Notification, 'id' | 'createdAt' | 'type' | 'message' | 'title'>>) => string;
  info: (message: string, title?: string, options?: Partial<Omit<Notification, 'id' | 'createdAt' | 'type' | 'message' | 'title'>>) => string;
}
