
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Check, AlertCircle, Clock } from 'lucide-react';
import { ApiKeyStatus as ApiKeyStatusEnum } from '@/types/api-keys/unified';

// Helper function to get status color classes
export const getApiStatusColor = (status: string | ApiKeyStatusEnum) => {
  if (!status) return 'bg-gray-100 text-gray-500';

  const statusStr = String(status).toLowerCase();
  
  if (['active', 'valid', 'verified', 'working'].includes(statusStr)) {
    return 'bg-green-100 text-green-800';
  }
  
  if (['error', 'invalid', 'expired'].includes(statusStr)) {
    return 'bg-red-100 text-red-800';
  }
  
  if (['pending', 'checking'].includes(statusStr)) {
    return 'bg-amber-100 text-amber-800';
  }
  
  return 'bg-gray-100 text-gray-500';
};

interface ApiKeyStatusComponentProps {
  apiStatus: {
    status?: string;
    isWorking?: boolean;
    exists?: boolean;
    lastChecked?: string | Date | null;
    errorMessage?: string | null;
  };
  showDetails?: boolean;
}

export const ApiKeyStatusComponent: React.FC<ApiKeyStatusComponentProps> = ({ apiStatus, showDetails = false }) => {
  const { status, isWorking, exists, errorMessage } = apiStatus;
  
  if (!exists || status === 'unconfigured' || status === 'not_found') {
    return (
      <Badge variant="outline" className="bg-gray-100 text-gray-500 text-xs">
        <Clock className="h-3 w-3 mr-1" />
        <span>Not configured</span>
      </Badge>
    );
  }
  
  if (isWorking && (status === 'active' || status === 'valid' || status === 'working')) {
    return (
      <Badge variant="outline" className="bg-green-100 text-green-800 text-xs">
        <Check className="h-3 w-3 mr-1" />
        <span>Active</span>
      </Badge>
    );
  }
  
  if (status === 'pending' || status === 'checking') {
    return (
      <Badge variant="outline" className="bg-amber-100 text-amber-800 text-xs">
        <Clock className="h-3 w-3 mr-1 animate-spin" />
        <span>Checking</span>
      </Badge>
    );
  }
  
  return (
    <Badge variant="outline" className="bg-red-100 text-red-800 text-xs">
      <AlertCircle className="h-3 w-3 mr-1" />
      <span>{errorMessage || 'Error'}</span>
    </Badge>
  );
};

// Default export for backward compatibility
export default ApiKeyStatusComponent;
