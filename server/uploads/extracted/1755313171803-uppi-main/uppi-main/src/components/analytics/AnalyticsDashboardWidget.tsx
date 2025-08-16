/**
 * Real-time Analytics Dashboard Widget
 * Displays live system metrics with auto-refresh
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useEnhancedAnalytics } from '@/hooks/analytics/useEnhancedAnalytics';
import { Activity, Users, TrendingUp, AlertCircle } from 'lucide-react';

export interface AnalyticsDashboardWidgetProps {
  refreshInterval?: number;
  showRealTimeIndicator?: boolean;
}

export const AnalyticsDashboardWidget = ({ 
  refreshInterval = 30000, 
  showRealTimeIndicator = true 
}: AnalyticsDashboardWidgetProps) => {
  const { metrics, isLoading, error, refreshMetrics } = useEnhancedAnalytics();
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      refreshMetrics();
      setLastUpdated(new Date());
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshMetrics, refreshInterval]);

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Analytics Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Active Users Widget */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isLoading ? '...' : metrics?.activeUsers || 0}
          </div>
          <p className="text-xs text-muted-foreground">
            of {metrics?.totalUsers || 0} total users
          </p>
          {metrics && (
            <Progress 
              value={(metrics.activeUsers / metrics.totalUsers) * 100} 
              className="mt-2"
            />
          )}
        </CardContent>
      </Card>

      {/* Analyses Completed Widget */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Analyses Today</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isLoading ? '...' : metrics?.analysesCompleted || 0}
          </div>
          <p className="text-xs text-muted-foreground">
            competitor analyses completed
          </p>
        </CardContent>
      </Card>

      {/* System Performance Widget */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isLoading ? '...' : `${Math.round(metrics?.avgResponseTime || 0)}ms`}
          </div>
          <p className="text-xs text-muted-foreground">
            {metrics?.errorRate ? `${metrics.errorRate.toFixed(1)}% error rate` : 'No errors'}
          </p>
          {metrics && (
            <Progress 
              value={Math.min((metrics.avgResponseTime / 2000) * 100, 100)} 
              className={`mt-2 ${metrics.avgResponseTime > 1000 ? 'bg-destructive' : ''}`}
            />
          )}
        </CardContent>
      </Card>

      {/* Real-time Status Widget */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">System Status</CardTitle>
          {showRealTimeIndicator && (
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              <span className="text-xs text-muted-foreground">
                {isLive ? 'Live' : 'Offline'}
              </span>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">API Keys</span>
              <Badge variant={metrics?.apiKeyValidations ? 'default' : 'secondary'}>
                {metrics?.apiKeyValidations || 0} active
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Documents</span>
              <Badge variant="outline">
                {metrics?.documentsUploaded || 0} uploaded
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};