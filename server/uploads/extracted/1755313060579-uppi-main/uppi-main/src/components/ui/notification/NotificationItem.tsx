
import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  X 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Notification, NotificationPosition } from '@/types/notification';
import { Button } from '@/components/ui/button';

interface NotificationItemProps {
  notification: Notification;
  onClose: () => void;
  position: NotificationPosition;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onClose,
  position
}) => {
  const [isVisible, setIsVisible] = useState(false);

  // Animate in after first render
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 10);
    return () => clearTimeout(timer);
  }, []);

  // Handle close with animation
  const handleClose = () => {
    setIsVisible(false);
    // Wait for animation to finish
    setTimeout(() => {
      onClose();
    }, 300);
  };

  // Get icon based on notification type
  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  // Get color classes based on notification type
  const getTypeClasses = () => {
    switch (notification.type) {
      case 'success':
        return 'border-green-100 bg-green-50 dark:border-green-900 dark:bg-green-950/50';
      case 'warning':
        return 'border-amber-100 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/50';
      case 'error':
        return 'border-red-100 bg-red-50 dark:border-red-900 dark:bg-red-950/50';
      case 'info':
      default:
        return 'border-blue-100 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/50';
    }
  };

  // Get slide animation based on position
  const getAnimationClasses = () => {
    if (!isVisible) {
      // Initial hidden state
      if (position.startsWith('top')) {
        return 'opacity-0 translate-y-[-1rem]';
      } else {
        return 'opacity-0 translate-y-[1rem]';
      }
    }
    return 'opacity-100 translate-y-0';
  };

  return (
    <div
      className={cn(
        'w-full max-w-sm border rounded-lg shadow-md backdrop-blur p-4 transition-all duration-300 pointer-events-auto',
        getTypeClasses(),
        getAnimationClasses()
      )}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium">{notification.title}</h3>
          <div className="mt-1 text-sm text-muted-foreground">
            {notification.message}
          </div>
          {notification.action && (
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  notification.action?.onClick();
                  if (!notification.persistent) {
                    handleClose();
                  }
                }}
              >
                {notification.action.label}
              </Button>
            </div>
          )}
        </div>
        <button
          type="button"
          className="ml-4 flex-shrink-0 inline-flex text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          onClick={handleClose}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      </div>
    </div>
  );
};

export default NotificationItem;
