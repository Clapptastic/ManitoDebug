import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff } from 'lucide-react';

interface RealTimeIndicatorProps {
  isConnected: boolean;
  className?: string;
}

export const RealTimeIndicator: React.FC<RealTimeIndicatorProps> = ({ 
  isConnected, 
  className = "" 
}) => {
  return (
    <Badge 
      variant={isConnected ? "default" : "secondary"} 
      className={`flex items-center gap-1 ${className}`}
    >
      {isConnected ? (
        <>
          <Wifi className="h-3 w-3" />
          Live
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3" />
          Offline
        </>
      )}
    </Badge>
  );
};

export default RealTimeIndicator;