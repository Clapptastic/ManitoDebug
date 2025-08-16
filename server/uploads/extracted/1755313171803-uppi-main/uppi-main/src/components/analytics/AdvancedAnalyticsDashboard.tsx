import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Activity, 
  Brain, 
  BarChart3,
  RefreshCw,
  Calendar,
  Target,
  Zap,
  Eye,
  Clock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { unifiedApiKeyService, type ApiKeyStatus } from '@/services/api-keys/unifiedApiKeyService';

interface AnalyticsMetrics {
  totalUsers: number;
  activeUsers: number;
  totalAnalyses: number;
  totalCost: number;
  avgResponseTime: number;
  successRate: number;
  growthRate: number;
}

interface ChartData {
  date: string;
  analyses: number;
  cost: number;
  users: number;
}

interface ApiUsageData {
  provider: string;
  usage: number;
  cost: number;
  success_rate: number;
}

const AdvancedAnalyticsDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<AnalyticsMetrics>({
    totalUsers: 0,
    activeUsers: 0,
    totalAnalyses: 0,
    totalCost: 0,
    avgResponseTime: 0,
    successRate: 0,
    growthRate: 0
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [apiUsageData, setApiUsageData] = useState<ApiUsageData[]>([]);
  
  // Merged functionality from WebAnalyticsDashboard for web analytics
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  
  // Provider statuses for quick health overview
  const [providerStatuses, setProviderStatuses] = useState<Record<string, ApiKeyStatus>>({});
  const [providerStatusLoading, setProviderStatusLoading] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch overview metrics
      const metricsData = await fetchOverviewMetrics();
      setMetrics(metricsData);

      // Fetch chart data
      const chartData = await fetchChartData();
      setChartData(chartData);

      // Fetch API usage data
      const apiData = await fetchApiUsageData();
      setApiUsageData(apiData);

      // Fetch provider statuses
      await fetchProviderStatuses();
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load analytics data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchOverviewMetrics = async (): Promise<AnalyticsMetrics> => {
    const { data: authUser } = await supabase.auth.getUser();
    if (!authUser.user) throw new Error('Not authenticated');

    // Get date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(timeRange.replace('d', '')));

    // Fetch user analytics
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Fetch active users (users who have performed actions in the time range)
    const { count: activeUsers } = await supabase
      .from('competitor_analyses')
      .select('user_id', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    // Fetch total analyses
    const { count: totalAnalyses } = await supabase
      .from('competitor_analyses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', authUser.user.id);

    // Fetch cost data
    const { data: costData } = await supabase
      .from('api_usage_costs')
      .select('cost_usd')
      .eq('user_id', authUser.user.id)
      .gte('date', startDate.toISOString().split('T')[0]);

    const totalCost = costData?.reduce((sum, record) => sum + record.cost_usd, 0) || 0;

    // Fetch performance metrics
    const { data: metricsData } = await supabase
      .from('api_metrics')
      .select('response_time_ms, status_code')
      .eq('user_id', authUser.user.id)
      .gte('created_at', startDate.toISOString());

    const avgResponseTime = metricsData?.length 
      ? metricsData.reduce((sum, m) => sum + m.response_time_ms, 0) / metricsData.length 
      : 0;

    const successCount = metricsData?.filter(m => m.status_code >= 200 && m.status_code < 300).length || 0;
    const successRate = metricsData?.length ? (successCount / metricsData.length) * 100 : 0;

    // Calculate growth rate based on current data
    const recentData = chartData.slice(-7);
    const olderData = chartData.slice(-14, -7);
    const recentAvg = recentData.length > 0 ? recentData.reduce((sum, d) => sum + d.analyses, 0) / recentData.length : 0;
    const olderAvg = olderData.length > 0 ? olderData.reduce((sum, d) => sum + d.analyses, 0) / olderData.length : 0;
    const growthRate = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;

    return {
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      totalAnalyses: totalAnalyses || 0,
      totalCost,
      avgResponseTime,
      successRate,
      growthRate
    };
  };

  const fetchChartData = async (): Promise<ChartData[]> => {
    const { data: authUser } = await supabase.auth.getUser();
    if (!authUser.user) return [];

    const days = parseInt(timeRange.replace('d', ''));
    const data: ChartData[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      // Get analyses count for this date
      const { count: analyses } = await supabase
        .from('competitor_analyses')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', authUser.user.id)
        .gte('created_at', dateStr)
        .lt('created_at', new Date(date.getTime() + 24 * 60 * 60 * 1000).toISOString());

      // Get cost for this date
      const { data: costData } = await supabase
        .from('api_usage_costs')
        .select('cost_usd')
        .eq('user_id', authUser.user.id)
        .eq('date', dateStr);

      const cost = costData?.reduce((sum, record) => sum + record.cost_usd, 0) || 0;

      // Get active users for this date (users who created analyses)
      const { data: usersData } = await supabase
        .from('competitor_analyses')
        .select('user_id')
        .gte('created_at', dateStr)
        .lt('created_at', new Date(date.getTime() + 24 * 60 * 60 * 1000).toISOString());

      const uniqueUsers = new Set(usersData?.map(d => d.user_id) || []).size;

      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        analyses: analyses || 0,
        cost: Number(cost.toFixed(4)),
        users: uniqueUsers
      });
    }

    return data;
  };

  const fetchApiUsageData = async (): Promise<ApiUsageData[]> => {
    const { data: authUser } = await supabase.auth.getUser();
    if (!authUser.user) return [];

    const { data: apiData } = await supabase
      .from('api_usage_costs')
      .select('provider, cost_usd, success')
      .eq('user_id', authUser.user.id);

    const providers = ['openai', 'anthropic', 'perplexity', 'gemini'];
    return providers.map(provider => {
      const providerData = apiData?.filter(d => d.provider === provider) || [];
      const usage = providerData.length;
      const cost = providerData.reduce((sum, d) => sum + d.cost_usd, 0);
      const successCount = providerData.filter(d => d.success).length;
      const success_rate = usage > 0 ? (successCount / usage) * 100 : 0;

      return {
        provider: provider.charAt(0).toUpperCase() + provider.slice(1),
        usage,
        cost: Number(cost.toFixed(4)),
        success_rate: Number(success_rate.toFixed(1))
      };
    }).filter(data => data.usage > 0);
  };

  const fetchProviderStatuses = async (): Promise<void> => {
    setProviderStatusLoading(true);
    try {
      const statuses = await unifiedApiKeyService.getAllProviderStatuses();
      setProviderStatuses(statuses);
    } catch (e) {
      console.error('Error loading provider statuses:', e);
    } finally {
      setProviderStatusLoading(false);
    }
  };

  const formatCurrency = (value: number) => `$${value.toFixed(4)}`;
  const formatNumber = (value: number) => value.toLocaleString();

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Loading analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            Advanced Analytics
          </h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive insights into your platform usage and performance
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchAnalytics} variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Analyses</p>
                <p className="text-2xl font-bold">{formatNumber(metrics.totalAnalyses)}</p>
                <div className="flex items-center gap-1 text-sm text-success">
                  <TrendingUp className="h-3 w-3" />
                  <span>+{metrics.growthRate}%</span>
                </div>
              </div>
              <Brain className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">API Costs</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics.totalCost)}</p>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <DollarSign className="h-3 w-3" />
                  <span>This period</span>
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">{metrics.successRate.toFixed(1)}%</p>
                <Progress value={metrics.successRate} className="mt-2" />
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Response</p>
                <p className="text-2xl font-bold">{metrics.avgResponseTime.toFixed(0)}ms</p>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Response time</span>
                </div>
              </div>
              <Zap className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="usage" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="usage">Usage Trends</TabsTrigger>
          <TabsTrigger value="costs">Cost Analysis</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="apis">API Usage</TabsTrigger>
        </TabsList>
        
        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analysis Usage Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    dataKey="analyses" 
                    fill="hsl(var(--primary))" 
                    name="Analyses"
                  />
                  <Bar 
                    dataKey="users"
                    fill="hsl(var(--chart-secondary))" 
                    name="Active Users"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="costs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cost Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Cost']} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="cost" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="Daily Cost"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Overall Success Rate</span>
                    <Badge variant="default">{metrics.successRate.toFixed(1)}%</Badge>
                  </div>
                  <Progress value={metrics.successRate} className="w-full" />
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Successful Requests</span>
                      <span className="font-medium">
                        {Math.floor((metrics.successRate / 100) * metrics.totalAnalyses)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Failed Requests</span>
                      <span className="font-medium">
                        {metrics.totalAnalyses - Math.floor((metrics.successRate / 100) * metrics.totalAnalyses)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Response Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">
                      {metrics.avgResponseTime.toFixed(0)}ms
                    </div>
                    <p className="text-sm text-muted-foreground">Average Response Time</p>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Target</span>
                      <span className="font-medium">&lt; 2000ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <Badge variant={metrics.avgResponseTime < 2000 ? "default" : "destructive"}>
                        {metrics.avgResponseTime < 2000 ? "Good" : "Slow"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="apis" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Provider Status</CardTitle>
                <Button variant="outline" size="sm" onClick={fetchProviderStatuses} disabled={providerStatusLoading}>
                  {providerStatusLoading ? 'Refreshing…' : 'Refresh'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {Object.keys(providerStatuses).length ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(providerStatuses).map(([prov, st]) => (
                    <div key={prov} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="font-medium capitalize">{prov}</span>
                      <Badge variant={st.isWorking ? 'default' : st.exists ? 'secondary' : 'destructive'}>
                        {st.isWorking ? 'active' : st.exists ? st.status : 'unconfigured'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No providers configured yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Provider Usage</CardTitle>
            </CardHeader>
            <CardContent>
              {apiUsageData.length > 0 ? (
                <div className="space-y-6">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={apiUsageData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ provider, usage }) => `${provider} (${usage})`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="usage"
                      >
                        {apiUsageData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  <div className="grid gap-4">
                    {apiUsageData.map((api, index) => (
                      <div key={api.provider} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="font-medium">{api.provider}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-muted-foreground">
                            {api.usage} requests
                          </span>
                          <span className="text-muted-foreground">
                            {formatCurrency(api.cost)}
                          </span>
                          <Badge variant={api.success_rate >= 90 ? "default" : "secondary"}>
                            {api.success_rate}% success
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No API Usage Data</h3>
                  <p className="text-muted-foreground">
                    Start using competitor analysis to see API usage statistics.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedAnalyticsDashboard;