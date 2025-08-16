
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export interface ApiProviderStatusInfo {
  status: string;
  isWorking: boolean;
  exists: boolean;
  errorMessage?: string | null;
}

interface ApiKeyDisplayProps {
  provider: string;
  status: ApiProviderStatusInfo;
  lastChecked?: string;
  onDelete?: () => void;
  onRefresh?: () => void;
}

const ApiKeyDisplay: React.FC<ApiKeyDisplayProps> = ({
  provider,
  status,
  lastChecked,
  onDelete,
  onRefresh
}) => {
  // Create a safe status object with default values
  const safeStatus: ApiProviderStatusInfo = {
    status: status?.status || 'unknown',
    isWorking: status?.isWorking || false,
    exists: status?.exists || false,
    errorMessage: status?.errorMessage || null
  };
  
  // Get status info
  const getStatusInfo = () => {
    if (!safeStatus.exists) {
      return { color: 'bg-gray-100 text-gray-800', icon: <Clock className="h-4 w-4" />, text: 'Not Set' };
    }
    if (safeStatus.isWorking) {
      return { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-4 w-4" />, text: 'Working' };
    }
    if (safeStatus.status === 'error') {
      return { color: 'bg-red-100 text-red-800', icon: <XCircle className="h-4 w-4" />, text: 'Error' };
    }
    return { color: 'bg-yellow-100 text-yellow-800', icon: <AlertCircle className="h-4 w-4" />, text: 'Pending' };
  };

  const { color, icon, text } = getStatusInfo();

  return (
    <div className="flex items-center justify-between mb-2 p-2 rounded">
      <div className="flex items-center space-x-2">
        <span className="font-semibold">{provider}</span>
        <Badge className={color}>
          <span className="flex items-center">
            {icon}
            <span className="ml-1">{text}</span>
          </span>
        </Badge>
      </div>
      <div className="flex items-center space-x-2">
        {lastChecked && (
          <span className="text-xs text-gray-500">
            Last checked: {new Date(lastChecked).toLocaleString()}
          </span>
        )}
      </div>
    </div>
  );
};

export default ApiKeyDisplay;
