
import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Clock, Info } from 'lucide-react';

interface StatusBadgeProps {
  status: string | {
    text: string;
    className?: string;
  };
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  let statusText: string;
  let statusClassName: string | undefined;
  
  // Handle different input types
  if (typeof status === 'string') {
    statusText = status;
    statusClassName = undefined;
  } else {
    statusText = status.text || 'Unknown';
    statusClassName = status.className;
  }
  
  // Normalize status for consistent handling
  const normalizedStatus = statusText.toLowerCase();
  
  // Define status styles
  const getStatusStyle = (): { className: string; icon: React.ReactNode } => {
    if (['active', 'success', 'completed', 'valid', 'working'].includes(normalizedStatus)) {
      return {
        className: 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400',
        icon: <CheckCircle className="h-3.5 w-3.5" />
      };
    }
    
    if (['error', 'failed', 'invalid', 'expired'].includes(normalizedStatus)) {
      return {
        className: 'bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-400',
        icon: <AlertCircle className="h-3.5 w-3.5" />
      };
    }
    
    if (['pending', 'waiting', 'unchecked', 'checking'].includes(normalizedStatus)) {
      return {
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-800/20 dark:text-blue-400',
        icon: <Clock className="h-3.5 w-3.5" />
      };
    }
    
    return {
      className: 'bg-gray-100 text-gray-800 dark:bg-gray-800/20 dark:text-gray-400',
      icon: <Info className="h-3.5 w-3.5" />
    };
  };

  const { className: statusStyleClass, icon } = getStatusStyle();

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "flex items-center gap-1 font-normal capitalize px-2 py-0.5",
        statusStyleClass,
        statusClassName,
        className
      )}
    >
      {icon}
      {statusText}
    </Badge>
  );
};

export default StatusBadge;
