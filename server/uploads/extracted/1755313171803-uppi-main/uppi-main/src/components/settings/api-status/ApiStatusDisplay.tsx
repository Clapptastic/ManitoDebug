
import React from 'react';
import { ApiStatusInfo } from '@/types/api-keys';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface ApiStatusDisplayProps {
  status: ApiStatusInfo;
}

const ApiStatusDisplay = ({ status }: ApiStatusDisplayProps) => {
  // Return early if status is not provided
  if (!status) {
    return <div className="text-muted-foreground text-sm">Status information unavailable</div>;
  }

  const getStatusBadge = () => {
    if (status.isWorking) {
      return (
        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1">
          <CheckCircle2 className="h-4 w-4" />
          <span>Working</span>
        </Badge>
      );
    }
    
    switch (status.status) {
      case 'down':
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200 flex items-center gap-1">
            <XCircle className="h-4 w-4" />
            <span>Down</span>
          </Badge>
        );
      case 'degraded':
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            <span>Degraded</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            <span>{status.status}</span>
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Status:</div>
        {getStatusBadge()}
      </div>
      
      {status.lastChecked && (
        <div className="text-xs text-muted-foreground">
          Last checked: {
            typeof status.lastChecked === 'string' && status.lastChecked ? 
              format(new Date(status.lastChecked), 'MMM d, yyyy h:mm a') : 
              'Never'
          }
        </div>
      )}
      
      {status.errorMessage && (
        <div className="text-xs text-red-500 mt-1">
          {status.errorMessage}
        </div>
      )}
    </div>
  );
};

export default ApiStatusDisplay;
