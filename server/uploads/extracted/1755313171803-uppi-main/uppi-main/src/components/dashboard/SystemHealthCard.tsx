
import React from 'react';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Loading } from '@/components/ui/loading';

interface SystemHealth {
  api_status: string;
  database_status: string;
  services_status: string;
  storage_status: string;
}

interface SystemHealthCardProps {
  health: SystemHealth;
  isLoading: boolean;
}

const SystemHealthCard: React.FC<SystemHealthCardProps> = ({ health, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-4">
        <Loading size="md" variant="primary" text="Loading system health..." fadeIn={true} />
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    if (status === 'operational') {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (status === 'degraded') {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    } else {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusClass = (status: string) => {
    if (status === 'operational') {
      return 'text-green-600';
    } else if (status === 'degraded') {
      return 'text-yellow-600';
    } else {
      return 'text-red-600';
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="p-2">
        <div className="flex items-center mb-1">
          {getStatusIcon(health.api_status)}
          <span className="ml-2 font-medium">API</span>
        </div>
        <p className={cn("text-sm capitalize", getStatusClass(health.api_status))}>
          {health.api_status || 'Unknown'}
        </p>
      </div>
      
      <div className="p-2">
        <div className="flex items-center mb-1">
          {getStatusIcon(health.database_status)}
          <span className="ml-2 font-medium">Database</span>
        </div>
        <p className={cn("text-sm capitalize", getStatusClass(health.database_status))}>
          {health.database_status || 'Unknown'}
        </p>
      </div>
      
      <div className="p-2">
        <div className="flex items-center mb-1">
          {getStatusIcon(health.services_status)}
          <span className="ml-2 font-medium">Services</span>
        </div>
        <p className={cn("text-sm capitalize", getStatusClass(health.services_status))}>
          {health.services_status || 'Unknown'}
        </p>
      </div>
      
      <div className="p-2">
        <div className="flex items-center mb-1">
          {getStatusIcon(health.storage_status)}
          <span className="ml-2 font-medium">Storage</span>
        </div>
        <p className={cn("text-sm capitalize", getStatusClass(health.storage_status))}>
          {health.storage_status || 'Unknown'}
        </p>
      </div>
    </div>
  );
};

export default SystemHealthCard;
