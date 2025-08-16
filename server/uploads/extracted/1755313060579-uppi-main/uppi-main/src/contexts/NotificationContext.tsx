
import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Notification,
  NotificationContextType,
  NotificationPosition,
  NotificationState,
  NotificationType
} from '@/types/notification';

// Create notification context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Define action types
type NotificationAction =
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'CLEAR_NOTIFICATIONS' }
  | { type: 'SET_POSITION'; payload: NotificationPosition };

// Initial state
const initialState: NotificationState = {
  notifications: [],
  position: 'top-right',
};

// Notification reducer
function notificationReducer(
  state: NotificationState,
  action: NotificationAction
): NotificationState {
  switch (action.type) {
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [...state.notifications, action.payload],
      };
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(
          (notification) => notification.id !== action.payload
        ),
      };
    case 'CLEAR_NOTIFICATIONS':
      return {
        ...state,
        notifications: [],
      };
    case 'SET_POSITION':
      return {
        ...state,
        position: action.payload,
      };
    default:
      return state;
  }
}

interface NotificationProviderProps {
  children: ReactNode;
  defaultPosition?: NotificationPosition;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  defaultPosition = 'top-right',
}) => {
  const [state, dispatch] = useReducer(notificationReducer, {
    ...initialState,
    position: defaultPosition,
  });

  // Add a new notification
  const addNotification = (
    notification: Omit<Notification, 'id' | 'createdAt'>
  ): string => {
    const id = uuidv4();
    const newNotification: Notification = {
      ...notification,
      id,
      createdAt: new Date(),
    };

    dispatch({ type: 'ADD_NOTIFICATION', payload: newNotification });

    // Auto-dismiss non-persistent notifications
    if (!notification.persistent && notification.duration !== 0) {
      const duration = notification.duration || 5000;
      setTimeout(() => {
        removeNotification(id);
        notification.onClose?.();
      }, duration);
    }

    return id;
  };

  // Remove a notification by id
  const removeNotification = (id: string): void => {
    const notification = state.notifications.find(n => n.id === id);
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
    notification?.onClose?.();
  };

  // Clear all notifications
  const clearNotifications = (): void => {
    dispatch({ type: 'CLEAR_NOTIFICATIONS' });
  };

  // Set notification position
  const setPosition = (position: NotificationPosition): void => {
    dispatch({ type: 'SET_POSITION', payload: position });
  };

  // Convenience methods for different notification types
  const createNotification = (
    type: NotificationType,
    message: string,
    title?: string,
    options?: Partial<Omit<Notification, 'id' | 'createdAt' | 'type' | 'message' | 'title'>>
  ): string => {
    const finalTitle = title || {
      success: 'Success',
      error: 'Error',
      warning: 'Warning',
      info: 'Information',
    }[type];

    return addNotification({
      type,
      title: finalTitle,
      message,
      ...options,
    });
  };

  const success = (message: string, title?: string, options?: Partial<Omit<Notification, 'id' | 'createdAt' | 'type' | 'message' | 'title'>>) => 
    createNotification('success', message, title, options);

  const error = (message: string, title?: string, options?: Partial<Omit<Notification, 'id' | 'createdAt' | 'type' | 'message' | 'title'>>) => 
    createNotification('error', message, title, options);

  const warning = (message: string, title?: string, options?: Partial<Omit<Notification, 'id' | 'createdAt' | 'type' | 'message' | 'title'>>) => 
    createNotification('warning', message, title, options);

  const info = (message: string, title?: string, options?: Partial<Omit<Notification, 'id' | 'createdAt' | 'type' | 'message' | 'title'>>) => 
    createNotification('info', message, title, options);

  return (
    <NotificationContext.Provider
      value={{
        ...state,
        addNotification,
        removeNotification,
        clearNotifications,
        setPosition,
        success,
        error,
        warning,
        info,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook to use the notification context
export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
