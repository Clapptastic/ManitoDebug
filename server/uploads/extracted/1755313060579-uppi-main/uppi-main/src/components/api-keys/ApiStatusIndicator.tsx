
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface ApiStatusIndicatorProps {
  status: string;
  className?: string;
}

const ApiStatusIndicator: React.FC<ApiStatusIndicatorProps> = ({ status, className }) => {
  const getVariant = () => {
    switch (status) {
      case 'active':
        return 'default';
      case 'error':
        return 'destructive';
      case 'pending':
        return 'secondary';
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

export default ApiStatusIndicator;
