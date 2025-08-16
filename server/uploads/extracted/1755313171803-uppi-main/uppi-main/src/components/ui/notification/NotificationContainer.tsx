
import React from 'react';
import { useNotification } from '@/contexts/NotificationContext';
import NotificationItem from './NotificationItem';
import { cn } from '@/lib/utils';

const NotificationContainer: React.FC = () => {
  const { notifications, position, removeNotification } = useNotification();

  if (notifications.length === 0) {
    return null;
  }

  // Determine the CSS classes based on the position
  const positionClasses = {
    'top-right': 'top-0 right-0 items-end justify-start',
    'top-left': 'top-0 left-0 items-start justify-start',
    'bottom-right': 'bottom-0 right-0 items-end justify-end',
    'bottom-left': 'bottom-0 left-0 items-start justify-end',
    'top-center': 'top-0 left-1/2 -translate-x-1/2 items-center justify-start',
    'bottom-center': 'bottom-0 left-1/2 -translate-x-1/2 items-center justify-end'
  }[position];

  return (
    <div 
      className={cn(
        "fixed flex flex-col p-4 z-50 pointer-events-none space-y-3 max-h-screen overflow-hidden",
        positionClasses
      )}
      aria-live="polite"
    >
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
          position={position}
        />
      ))}
    </div>
  );
};

export default NotificationContainer;
