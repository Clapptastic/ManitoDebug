
import { useEffect } from 'react';
import { useNotification } from '@/contexts/NotificationContext';
import { registerNotificationFunctions } from '@/hooks/useNotifications';

/**
 * Component that initializes the notification system
 * This should be rendered once at the app root
 */
const NotificationInitializer: React.FC = () => {
  const notification = useNotification();

  useEffect(() => {
    // Register notification functions so they can be used outside of React components
    registerNotificationFunctions({
      show: notification.addNotification,
      success: notification.success,
      error: notification.error,
      warning: notification.warning,
      info: notification.info
    });
  }, [notification]);

  return null;
};

export default NotificationInitializer;
