/**
 * Real-time Status Card Component
 * Displays live system status with animated indicators
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Activity, 
  Zap,
  Server,
  Database,
  Wifi,
  Clock
} from 'lucide-react';

export interface SystemStatus {
  id: string;
  name: string;
  status: 'operational' | 'degraded' | 'down' | 'maintenance';
  uptime: number;
  responseTime: number;
  lastIncident?: string;
  description: string;
}

export interface RealtimeStatusCardProps {
  title?: string;
  showUptime?: boolean;
  showResponseTime?: boolean;
  refreshInterval?: number;
  systems?: SystemStatus[];
}

export const RealtimeStatusCard = ({
  title = 'System Status',
  showUptime = true,
  showResponseTime = true,
  refreshInterval = 30000,
  systems: initialSystems
}: RealtimeStatusCardProps) => {
  const [systems, setSystems] = useState<SystemStatus[]>(initialSystems || [
    {
      id: 'api',
      name: 'API Gateway',
      status: 'operational',
      uptime: 99.8,
      responseTime: 145,
      description: 'Core API services'
    },
    {
      id: 'database',
      name: 'Database',
      status: 'operational',
      uptime: 99.9,
      responseTime: 23,
      description: 'Supabase PostgreSQL'
    },
    {
      id: 'realtime',
      name: 'Real-time Services',
      status: 'operational',
      uptime: 98.5,
      responseTime: 78,
      description: 'WebSocket connections'
    },
    {
      id: 'ai',
      name: 'AI Processing',
      status: 'degraded',
      uptime: 97.2,
      responseTime: 2340,
      description: 'LLM API integrations',
      lastIncident: '2 hours ago'
    }
  ]);

  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate real-time updates
      setSystems(prevSystems => 
        prevSystems.map(system => ({
          ...system,
          responseTime: system.responseTime + (Math.random() - 0.5) * 20,
          uptime: Math.min(100, system.uptime + Math.random() * 0.01)
        }))
      );
      setLastUpdated(new Date());
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'down':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'maintenance':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-400" />;
    }
  };

  const getSystemIcon = (id: string) => {
    switch (id) {
      case 'api':
        return <Server className="h-4 w-4" />;
      case 'database':
        return <Database className="h-4 w-4" />;
      case 'realtime':
        return <Wifi className="h-4 w-4" />;
      case 'ai':
        return <Zap className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      operational: 'default',
      degraded: 'secondary',
      down: 'destructive',
      maintenance: 'outline'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getUptimeColor = (uptime: number) => {
    if (uptime >= 99.5) return 'text-green-600';
    if (uptime >= 98) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getResponseTimeColor = (responseTime: number) => {
    if (responseTime <= 200) return 'text-green-600';
    if (responseTime <= 1000) return 'text-yellow-600';
    return 'text-red-600';
  };

  const overallStatus = systems.every(s => s.status === 'operational') 
    ? 'operational' 
    : systems.some(s => s.status === 'down') 
    ? 'down' 
    : 'degraded';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(overallStatus)}
            {title}
          </CardTitle>
          <div className="flex items-center gap-2">
            {isLive && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-xs text-muted-foreground">Live</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Real-time monitoring active</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {getStatusBadge(overallStatus)}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {systems.map((system) => (
            <div key={system.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {getSystemIcon(system.id)}
                  {getStatusIcon(system.status)}
                </div>
                <div>
                  <p className="font-medium text-sm">{system.name}</p>
                  <p className="text-xs text-muted-foreground">{system.description}</p>
                  {system.lastIncident && (
                    <p className="text-xs text-red-500">Last incident: {system.lastIncident}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm">
                {showUptime && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <div className="text-center">
                          <p className={`font-medium ${getUptimeColor(system.uptime)}`}>
                            {system.uptime.toFixed(1)}%
                          </p>
                          <p className="text-xs text-muted-foreground">Uptime</p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>System uptime over the last 30 days</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                
                {showResponseTime && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <div className="text-center">
                          <p className={`font-medium ${getResponseTimeColor(system.responseTime)}`}>
                            {Math.round(system.responseTime)}ms
                          </p>
                          <p className="text-xs text-muted-foreground">Response</p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Average response time</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                
                {getStatusBadge(system.status)}
              </div>
            </div>
          ))}
        </div>

        {/* Overall Health Indicator */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Health</span>
            <span className="text-sm text-muted-foreground">
              {systems.filter(s => s.status === 'operational').length}/{systems.length} systems operational
            </span>
          </div>
          <Progress 
            value={(systems.filter(s => s.status === 'operational').length / systems.length) * 100}
            className="h-2"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};