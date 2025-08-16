
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';

interface StatusIndicatorProps {
  status: string;
  showLabel?: boolean;
  className?: string;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ 
  status, 
  showLabel = false, 
  className = "" 
}) => {
  const getStatusConfig = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    
    switch (normalizedStatus) {
      case 'healthy':
      case 'operational':
      case 'active':
      case 'working':
      case 'online':
      case 'success':
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          variant: 'default' as const,
          text: 'Healthy',
          color: 'text-green-600'
        };
      
      case 'warning':
      case 'degraded':
      case 'maintenance':
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          variant: 'secondary' as const,
          text: 'Warning',
          color: 'text-yellow-600'
        };
      
      case 'error':
      case 'outage':
      case 'offline':
      case 'failed':
      case 'critical':
        return {
          icon: <XCircle className="h-4 w-4" />,
          variant: 'destructive' as const,
          text: 'Error',
          color: 'text-red-600'
        };
      
      case 'pending':
      case 'checking':
      case 'loading':
        return {
          icon: <Clock className="h-4 w-4" />,
          variant: 'outline' as const,
          text: 'Pending',
          color: 'text-blue-600'
        };
      
      default:
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          variant: 'outline' as const,
          text: 'Unknown',
          color: 'text-gray-600'
        };
    }
  };

  const config = getStatusConfig(status);

  if (showLabel) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <span className={config.color}>{config.icon}</span>
        <Badge variant={config.variant}>{config.text}</Badge>
      </div>
    );
  }

  return (
    <span className={`${config.color} ${className}`}>
      {config.icon}
    </span>
  );
};

export default StatusIndicator;
