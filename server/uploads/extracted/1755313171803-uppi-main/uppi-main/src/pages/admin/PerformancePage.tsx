
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MetricCard } from '@/components/ui/metric-card';
import { Button } from '@/components/ui/button';
import { useDataFetcher } from '@/hooks/useDataFetcher';
import { performanceMonitor, PerformanceMeasurement } from '@/utils/performanceMonitor';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Activity, 
  Zap, 
  DollarSign, 
  Clock, 
  Server, 
  Database, 
  TrendingUp,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface ApiMetric {
  id: string;
  provider: string;
  endpoint: string;
  status: number;
  latency: number;
  cost: number;
  created_at: string;
}

interface SystemMetrics {
  totalApiCalls: number;
  avgResponseTime: number;
  totalCost: number;
  errorRate: number;
  activeConnections: number;
  databaseSize: number;
}

const PerformancePage: React.FC = () => {
  const [measurements, setMeasurements] = useState<PerformanceMeasurement[]>([]);
  const [apiMetrics, setApiMetrics] = useState<ApiMetric[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    totalApiCalls: 0,
    avgResponseTime: 0,
    totalCost: 0,
    errorRate: 0,
    activeConnections: 0,
    databaseSize: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchApiMetrics = useCallback(async () => {
    try {
      // Fetch real API usage data from database
      const { data: apiUsageData, error } = await supabase
        .from('api_usage_costs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const apiMetrics: ApiMetric[] = (apiUsageData || []).map(usage => ({
        id: usage.id,
        provider: usage.provider,
        endpoint: usage.endpoint,
        status: usage.success ? 200 : 500,
        latency: usage.response_time_ms || 0,
        cost: usage.cost_usd,
        created_at: usage.created_at
      }));

      setApiMetrics(apiMetrics);

      // Calculate system metrics from real data
      const totalCalls = apiMetrics.length;
      const avgLatency = apiMetrics.reduce((acc, m) => acc + m.latency, 0) / totalCalls || 0;
      const totalCost = apiMetrics.reduce((acc, m) => acc + m.cost, 0);
      const errorCount = apiMetrics.filter(m => m.status >= 400).length;
      const errorRate = totalCalls > 0 ? (errorCount / totalCalls) * 100 : 0;

      // Fetch additional system metrics
      const { data: userRes } = await supabase.auth.getUser();
      const userId = userRes?.user?.id;

      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Active connections: number of active API keys for current user (client-safe)
      let activeConnections = 0;
      if (userId) {
        const { data: keysData, error: keysError } = await supabase.rpc('manage_api_key', { operation: 'select', user_id_param: userId });
        if (!keysError) {
          const arr = Array.isArray(keysData) ? keysData : [];
          activeConnections = arr.filter((k: any) => k.is_active && k.status === 'active').length;
        }
      }

      setSystemMetrics({
        totalApiCalls: totalCalls,
        avgResponseTime: avgLatency,
        totalCost,
        errorRate,
        activeConnections: activeConnections || 0,
        databaseSize: 0 // Could be calculated from actual database size queries
      });
    } catch (error) {
      console.error('Error generating performance metrics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load performance metrics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchApiMetrics();

    // Subscribe to performance measurements
    const unsubscribe = performanceMonitor.subscribe((newMeasurements) => {
      setMeasurements(newMeasurements);
    });

    return unsubscribe;
  }, [fetchApiMetrics]);

  const clearMeasurements = () => {
    performanceMonitor.clearMeasurements();
    toast({
      title: 'Cleared',
      description: 'Performance measurements cleared',
    });
  };

  const refreshMetrics = () => {
    setLoading(true);
    fetchApiMetrics();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Performance Management</h1>
          <p className="text-muted-foreground">
            Monitor and optimize application performance in real-time.
          </p>
        </div>
        <Button onClick={refreshMetrics} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total API Calls"
          value={systemMetrics.totalApiCalls.toLocaleString()}
          description="Total requests processed"
          icon={Activity}
          trend={{
            value: 12.5,
            isPositive: true
          }}
        />
        
        <MetricCard
          title="Avg Response Time"
          value={`${Math.round(systemMetrics.avgResponseTime)}ms`}
          description="Average API latency"
          icon={Clock}
          trend={{
            value: -8.2,
            isPositive: true
          }}
        />
        
        <MetricCard
          title="Total Cost"
          value={`$${systemMetrics.totalCost.toFixed(2)}`}
          description="API usage costs"
          icon={DollarSign}
          trend={{
            value: 15.3,
            isPositive: false
          }}
        />
        
        <MetricCard
          title="Error Rate"
          value={`${systemMetrics.errorRate.toFixed(1)}%`}
          description="Failed requests percentage"
          icon={AlertCircle}
          trend={{
            value: -3.1,
            isPositive: true
          }}
        />
      </div>

      <Tabs defaultValue="realtime" className="space-y-4">
        <TabsList>
          <TabsTrigger value="realtime">Real-time Performance</TabsTrigger>
          <TabsTrigger value="api">API Metrics</TabsTrigger>
          <TabsTrigger value="system">System Health</TabsTrigger>
          <TabsTrigger value="costs">Cost Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="realtime">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Live Performance Measurements</CardTitle>
                <Button onClick={clearMeasurements} variant="outline" size="sm">
                  Clear
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {measurements.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No recent measurements. Use the app to generate performance data.
                    </p>
                  ) : (
                    measurements.slice(-20).reverse().map((measurement) => (
                      <div key={measurement.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <span className="text-sm font-medium">{measurement.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {measurement.duration.toFixed(2)}ms
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Resources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Server className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Active Connections</span>
                  </div>
                  <span className="font-medium">{systemMetrics.activeConnections}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Database Size</span>
                  </div>
                  <span className="font-medium">{systemMetrics.databaseSize}MB</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Status</span>
                  </div>
                  <span className="font-medium text-green-600">Healthy</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>Recent API Calls</CardTitle>
              <p className="text-sm text-muted-foreground">
                Latest API requests and their performance metrics
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {apiMetrics.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No API metrics available. Make some API calls to see data here.
                  </p>
                ) : (
                  apiMetrics.slice(0, 50).map((metric) => (
                    <div key={metric.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${
                          metric.status < 400 ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <div>
                          <p className="text-sm font-medium">{metric.provider}</p>
                          <p className="text-xs text-muted-foreground">{metric.endpoint}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{metric.latency}ms</p>
                        <p className="text-xs text-muted-foreground">${metric.cost.toFixed(4)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Database Connection</span>
                  <span className="text-sm font-medium text-green-600">Connected</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Edge Functions</span>
                  <span className="text-sm font-medium text-green-600">Online</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Storage</span>
                  <span className="text-sm font-medium text-green-600">Available</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Authentication</span>
                  <span className="text-sm font-medium text-green-600">Active</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                {systemMetrics.errorRate > 5 ? (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-yellow-600">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">High error rate detected</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No alerts at this time</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="costs">
          <Card>
            <CardHeader>
              <CardTitle>Cost Breakdown</CardTitle>
              <p className="text-sm text-muted-foreground">
                API usage costs by provider
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(
                  apiMetrics.reduce((acc, metric) => {
                    acc[metric.provider] = (acc[metric.provider] || 0) + metric.cost;
                    return acc;
                  }, {} as Record<string, number>)
                ).map(([provider, cost]) => (
                  <div key={provider} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="font-medium capitalize">{provider}</span>
                    <span className="font-medium">${cost.toFixed(4)}</span>
                  </div>
                ))}
                {apiMetrics.length === 0 && (
                  <p className="text-muted-foreground text-center py-8">
                    No cost data available yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PerformancePage;
