
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ApiStatus } from '@/types/core/enums';

interface ApiKeyStatusComponentProps {
  status: ApiStatus;
}

export const ApiKeyStatusComponent: React.FC<ApiKeyStatusComponentProps> = ({ status }) => {
  const getStatusColor = (status: ApiStatus) => {
    switch (status) {
      case ApiStatus.ACTIVE:
        return 'bg-green-100 text-green-800';
      case ApiStatus.INACTIVE:
        return 'bg-gray-100 text-gray-800';
      case ApiStatus.ERROR:
        return 'bg-red-100 text-red-800';
      case ApiStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Badge className={getStatusColor(status)}>
      {status}
    </Badge>
  );
};
