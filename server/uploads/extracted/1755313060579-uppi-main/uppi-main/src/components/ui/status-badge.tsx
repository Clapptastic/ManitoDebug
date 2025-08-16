
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const getVariant = () => {
    switch (status?.toLowerCase()) {
      case 'operational':
      case 'active':
      case 'healthy':
      case 'valid':
        return 'default';
      case 'degraded':
      case 'warning':
        return 'secondary';
      case 'down':
      case 'error':
      case 'invalid':
      case 'critical':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <Badge variant={getVariant()} className={className}>
      {status}
    </Badge>
  );
};

export default StatusBadge;
