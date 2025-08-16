import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, TrendingUp, Users, Activity, Download, ExternalLink, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { OutboundLink } from '@/components/shared/OutboundLink';

interface ApiMetrics {
  summary: {
    total_cost_30_days: number;
    total_tokens_30_days: number;
    total_requests_last_hour: number;
    success_rate: number;
    avg_response_time_ms: number;
  };
  providers: Record<string, {
    total_cost: number;
    total_tokens: number;
    success_count: number;
    total_count: number;
  }>;
  daily_costs: Array<{
    usage_date: string;
    api_provider: string;
    total_cost_usd: number;
    total_requests: number;
    total_tokens: number;
  }>;
  top_spenders: Array<[string, number]>;
  timestamp: string;
}

const ApiCostsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<ApiMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const { user, isLoading: authLoading } = useAuthGuard('super_admin');

  useEffect(() => {
    if (!authLoading && user) {
      fetchMetrics();
      // Auto-refresh every 5 minutes
      const interval = setInterval(fetchMetrics, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [authLoading, user]);

  const fetchMetrics = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('api-metrics');
      
      if (error) throw error;
      
      setMetrics(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching API metrics:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch API cost metrics',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const exportPrometheusMetrics = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('api-metrics', {
        body: { format: 'prometheus' }
      });
      
      if (error) throw error;
      
      const blob = new Blob([data], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `api-metrics-${new Date().toISOString().split('T')[0]}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Export Complete',
        description: 'Prometheus metrics exported successfully'
      });
    } catch (error) {
      console.error('Error exporting metrics:', error);
      toast({
        title: 'Export Error',
        description: 'Failed to export Prometheus metrics',
        variant: 'destructive'
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading API cost dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <div>Access denied. Super admin role required.</div>;
  }

  if (!metrics) {
    return <div>No metrics data available.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-primary" />
            API Cost Dashboard
          </h1>
          <p className="text-muted-foreground">
            Monitor and analyze API usage costs across all providers
          </p>
          {lastUpdate && (
            <p className="text-sm text-muted-foreground">
              Last updated: {lastUpdate.toLocaleString()}
            </p>
          )}
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchMetrics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportPrometheusMetrics}>
            <Download className="h-4 w-4 mr-2" />
            Export Prometheus
          </Button>
          <Button variant="outline" asChild>
            <OutboundLink href={window.location.origin} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Grafana
            </OutboundLink>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">30-Day Cost</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(metrics.summary.total_cost_30_days)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tokens</p>
                <p className="text-2xl font-bold">
                  {formatNumber(metrics.summary.total_tokens_30_days)}
                </p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Requests/Hour</p>
                <p className="text-2xl font-bold">
                  {formatNumber(metrics.summary.total_requests_last_hour)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">
                  {(metrics.summary.success_rate * 100).toFixed(1)}%
                </p>
              </div>
              <Badge variant={metrics.summary.success_rate > 0.95 ? 'default' : 'destructive'}>
                {metrics.summary.success_rate > 0.95 ? 'Healthy' : 'Issues'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Response</p>
                <p className="text-2xl font-bold">
                  {Math.round(metrics.summary.avg_response_time_ms)}ms
                </p>
              </div>
              <Activity className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="providers" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="providers">By Provider</TabsTrigger>
          <TabsTrigger value="users">Top Users</TabsTrigger>
          <TabsTrigger value="daily">Daily Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cost by Provider (Last 30 Days)</CardTitle>
              <CardDescription>
                Breakdown of API costs and usage by provider
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Provider</TableHead>
                    <TableHead className="text-right">Total Cost</TableHead>
                    <TableHead className="text-right">Tokens</TableHead>
                    <TableHead className="text-right">Requests</TableHead>
                    <TableHead className="text-right">Success Rate</TableHead>
                    <TableHead className="text-right">Avg Cost/Request</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(metrics.providers).map(([provider, data]) => (
                    <TableRow key={provider}>
                      <TableCell className="font-medium capitalize">{provider}</TableCell>
                      <TableCell className="text-right">{formatCurrency(data.total_cost)}</TableCell>
                      <TableCell className="text-right">{formatNumber(data.total_tokens)}</TableCell>
                      <TableCell className="text-right">{formatNumber(data.total_count)}</TableCell>
                      <TableCell className="text-right">
                        {((data.success_count / data.total_count) * 100).toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(data.total_cost / data.total_count)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Spending Users (Last 30 Days)</CardTitle>
              <CardDescription>
                Users with highest API costs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead className="text-right">Total Spent</TableHead>
                    <TableHead className="text-right">% of Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.top_spenders.map(([userId, amount], index) => (
                    <TableRow key={userId}>
                      <TableCell className="font-mono">{userId.slice(0, 8)}...</TableCell>
                      <TableCell className="text-right">{formatCurrency(amount)}</TableCell>
                      <TableCell className="text-right">
                        {((amount / metrics.summary.total_cost_30_days) * 100).toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="daily" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Daily Usage Trends (Last 7 Days)</CardTitle>
              <CardDescription>
                Daily API usage and costs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead className="text-right">Requests</TableHead>
                    <TableHead className="text-right">Tokens</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.daily_costs
                    .sort((a, b) => new Date(b.usage_date).getTime() - new Date(a.usage_date).getTime())
                    .map((day, index) => (
                    <TableRow key={`${day.usage_date}-${day.api_provider}`}>
                      <TableCell>{new Date(day.usage_date).toLocaleDateString()}</TableCell>
                      <TableCell className="capitalize">{day.api_provider}</TableCell>
                      <TableCell className="text-right">{formatNumber(day.total_requests)}</TableCell>
                      <TableCell className="text-right">{formatNumber(day.total_tokens)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(day.total_cost_usd)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ApiCostsDashboard;