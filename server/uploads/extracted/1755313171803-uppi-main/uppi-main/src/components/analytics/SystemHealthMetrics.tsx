import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

interface SystemMetrics {
  uptime: string;
  responseTime: number;
  errorRate: number;
  totalRequests: number;
}

interface SystemHealthMetricsProps {
  metrics: SystemMetrics | null;
}

export const SystemHealthMetrics: React.FC<SystemHealthMetricsProps> = ({ metrics }) => {
  if (!metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>System Health</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            Loading system metrics...
          </div>
        </CardContent>
      </Card>
    );
  }

  const getUptimeStatus = (uptime: string) => {
    const uptimeNum = parseFloat(uptime);
    if (uptimeNum >= 99.9) return { label: 'Excellent', color: 'bg-green-500' };
    if (uptimeNum >= 99.0) return { label: 'Good', color: 'bg-yellow-500' };
    return { label: 'Poor', color: 'bg-red-500' };
  };

  const getResponseTimeStatus = (responseTime: number) => {
    if (responseTime <= 200) return { label: 'Fast', color: 'bg-green-500' };
    if (responseTime <= 500) return { label: 'Moderate', color: 'bg-yellow-500' };
    return { label: 'Slow', color: 'bg-red-500' };
  };

  const uptimeStatus = getUptimeStatus(metrics.uptime);
  const responseTimeStatus = getResponseTimeStatus(metrics.responseTime);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Activity className="h-5 w-5" />
          <span>System Health</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Uptime</span>
              <Badge variant="secondary" className="text-xs">
                {uptimeStatus.label}
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${uptimeStatus.color}`} />
              <span className="text-2xl font-bold">{metrics.uptime}%</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Response Time</span>
              <Badge variant="secondary" className="text-xs">
                {responseTimeStatus.label}
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{metrics.responseTime}ms</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="space-y-1">
            <span className="text-sm text-muted-foreground">Error Rate</span>
            <div className="flex items-center space-x-2">
              {metrics.errorRate < 1 ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              )}
              <span className="font-semibold">{metrics.errorRate.toFixed(2)}%</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-sm text-muted-foreground">Total Requests</span>
            <div className="font-semibold">{metrics.totalRequests.toLocaleString()}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};