import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  ResponsiveContainer, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  DollarSign, 
  TrendingUp, 
  BarChart3,
  Calendar,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface ApiCostData {
  provider: string;
  totalCost: number;
  tokensSpent: number;
  tokensLeft: number | null;
  dataQuality: number;
  dailyCosts: Array<{
    date: string;
    cost: number;
    tokens: number;
  }>;
  avgConfidenceScore: number;
  usageCount: number;
  lastUsed: string;
}

interface TimeSeriesData {
  date: string;
  total: number;
  [key: string]: number | string;
}

interface EnhancedCostAnalysisChartProps {
  timeRange?: '7d' | '30d' | '90d';
  onTimeRangeChange?: (range: '7d' | '30d' | '90d') => void;
}

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--chart-6))',
  'hsl(var(--chart-7))',
  'hsl(var(--chart-8))'
];

export const EnhancedCostAnalysisChart: React.FC<EnhancedCostAnalysisChartProps> = ({
  timeRange = '30d',
  onTimeRangeChange
}) => {
  const { user } = useAuth();
  const [costData, setCostData] = useState<ApiCostData[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleProviders, setVisibleProviders] = useState<Record<string, boolean>>({});
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');

  const totalCost = useMemo(() => 
    costData.reduce((sum, item) => sum + item.totalCost, 0), 
    [costData]
  );

  const totalTokens = useMemo(() => 
    costData.reduce((sum, item) => sum + item.tokensSpent, 0), 
    [costData]
  );

  const avgDataQuality = useMemo(() => {
    if (costData.length === 0) return 0;
    return costData.reduce((sum, item) => sum + item.dataQuality, 0) / costData.length;
  }, [costData]);

  useEffect(() => {
    if (user) {
      fetchCostData();
    }
  }, [user, timeRange]);

  const fetchCostData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
      }

      // Fetch API usage costs
      const { data: usageCosts, error: usageError } = await supabase
        .from('api_usage_costs')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (usageError) throw usageError;

      // Fetch API keys for token limits
      const { data: apiKeys, error: keysError } = await supabase
        .from('api_keys')
        .select('provider, metadata')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (keysError) throw keysError;

      // Fetch user provider costs
      const { data: providerCosts, error: providerError } = await supabase
        .rpc('get_user_provider_costs', { user_id_param: user.id });

      if (providerError) throw providerError;

      // Process data by provider
      const providerMap = new Map<string, ApiCostData>();
      
      usageCosts?.forEach(cost => {
        const existing = providerMap.get(cost.provider) || {
          provider: cost.provider,
          totalCost: 0,
          tokensSpent: 0,
          tokensLeft: null,
          dataQuality: 0,
          dailyCosts: [],
          avgConfidenceScore: 0,
          usageCount: 0,
          lastUsed: cost.created_at
        };

        existing.totalCost += Number(cost.cost_usd);
        existing.tokensSpent += cost.tokens_used || 0;
        existing.usageCount += 1;
        existing.lastUsed = cost.created_at > existing.lastUsed ? cost.created_at : existing.lastUsed;

        // Calculate confidence score from metadata
        const metadata = cost.metadata as any;
        if (metadata?.confidence_score) {
          existing.avgConfidenceScore = 
            (existing.avgConfidenceScore * (existing.usageCount - 1) + metadata.confidence_score) / existing.usageCount;
        }

        // Add to daily costs
        const existingDay = existing.dailyCosts.find(d => d.date === cost.date);
        if (existingDay) {
          existingDay.cost += Number(cost.cost_usd);
          existingDay.tokens += cost.tokens_used || 0;
        } else {
          existing.dailyCosts.push({
            date: cost.date,
            cost: Number(cost.cost_usd),
            tokens: cost.tokens_used || 0
          });
        }

        providerMap.set(cost.provider, existing);
      });

      // Add token limits from provider costs
      providerCosts?.forEach(pc => {
        const existing = providerMap.get(pc.provider);
        if (existing && pc.monthly_token_allotment) {
          existing.tokensLeft = Math.max(0, pc.monthly_token_allotment - existing.tokensSpent);
        }
      });

      // Calculate data quality score (0-100)
      providerMap.forEach(data => {
        data.dataQuality = Math.round(data.avgConfidenceScore * 100);
      });

      const processedData = Array.from(providerMap.values());
      setCostData(processedData);

      // Initialize visibility state
      const initialVisibility = processedData.reduce((acc, item) => {
        acc[item.provider] = true;
        return acc;
      }, {} as Record<string, boolean>);
      setVisibleProviders(initialVisibility);

      // Prepare time series data
      const timeSeriesMap = new Map<string, TimeSeriesData>();
      
      processedData.forEach(providerData => {
        providerData.dailyCosts.forEach(day => {
          const existing = timeSeriesMap.get(day.date) || {
            date: day.date,
            total: 0
          };
          
          existing.total += day.cost;
          existing[providerData.provider] = (existing[providerData.provider] as number || 0) + day.cost;
          
          timeSeriesMap.set(day.date, existing);
        });
      });

      const sortedTimeSeries = Array.from(timeSeriesMap.values())
        .sort((a, b) => a.date.localeCompare(b.date));
      
      setTimeSeriesData(sortedTimeSeries);

    } catch (error) {
      console.error('Error fetching cost data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load cost analysis data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleProvider = (provider: string) => {
    setVisibleProviders(prev => ({
      ...prev,
      [provider]: !prev[provider]
    }));
  };

  const visibleCostData = costData.filter(item => visibleProviders[item.provider]);
  const visibleTimeSeriesData = timeSeriesData.map(item => {
    const filtered: TimeSeriesData = { date: item.date, total: 0 };
    
    costData.forEach(provider => {
      if (visibleProviders[provider.provider]) {
        const value = item[provider.provider] as number || 0;
        filtered[provider.provider] = value;
        filtered.total += value;
      }
    });
    
    return filtered;
  });

  const formatCurrency = (value: number) => `$${value.toFixed(4)}`;
  const formatNumber = (value: number) => value.toLocaleString();
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <span>Cost Analysis</span>
            </CardTitle>
            <div className="flex items-center space-x-4">
              <Select 
                value={timeRange} 
                onValueChange={(value: '7d' | '30d' | '90d') => onTimeRangeChange?.(value)}
              >
                <SelectTrigger className="w-32">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={chartType} onValueChange={(value: 'bar' | 'pie') => setChartType(value)}>
                <SelectTrigger className="w-32">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">Bar Chart</SelectItem>
                  <SelectItem value="pie">Pie Chart</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="sm" onClick={fetchCostData}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{formatCurrency(totalCost)}</div>
              <div className="text-sm text-muted-foreground">Total Cost</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-secondary">{formatNumber(totalTokens)}</div>
              <div className="text-sm text-muted-foreground">Tokens Spent</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-accent">{Math.round(avgDataQuality)}%</div>
              <div className="text-sm text-muted-foreground">Avg Data Quality</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{costData.length}</div>
              <div className="text-sm text-muted-foreground">Active APIs</div>
            </div>
          </div>

          {/* Provider Toggles */}
          <div className="flex flex-wrap gap-2 mb-6">
            {costData.map((item, index) => (
              <div key={item.provider} className="flex items-center space-x-2">
                <Switch
                  id={`toggle-${item.provider}`}
                  checked={visibleProviders[item.provider]}
                  onCheckedChange={() => toggleProvider(item.provider)}
                />
                <Label 
                  htmlFor={`toggle-${item.provider}`}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                  />
                  <span className="capitalize">{item.provider}</span>
                  {visibleProviders[item.provider] ? (
                    <Eye className="h-3 w-3" />
                  ) : (
                    <EyeOff className="h-3 w-3" />
                  )}
                </Label>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bar' ? (
                <BarChart data={visibleTimeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    tickFormatter={formatCurrency}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Cost']}
                    labelFormatter={formatDate}
                  />
                  <Legend />
                  {costData.map((item, index) => 
                    visibleProviders[item.provider] && (
                      <Bar
                        key={item.provider}
                        dataKey={item.provider}
                        stackId="1"
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    )
                  )}
                </BarChart>
              ) : (
                <PieChart>
                  <Pie
                    data={visibleCostData}
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    dataKey="totalCost"
                    nameKey="provider"
                    label={({ provider, totalCost }) => 
                      `${provider}: ${formatCurrency(totalCost)}`
                    }
                  >
                    {visibleCostData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={CHART_COLORS[index % CHART_COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              )}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>API Key Cost Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Provider</th>
                  <th className="text-right p-3 font-medium">Total Cost</th>
                  <th className="text-right p-3 font-medium">Tokens Spent</th>
                  <th className="text-right p-3 font-medium">Tokens Left</th>
                  <th className="text-right p-3 font-medium">Usage Count</th>
                  <th className="text-right p-3 font-medium">Data Quality</th>
                  <th className="text-right p-3 font-medium">Last Used</th>
                </tr>
              </thead>
              <tbody>
                {costData.map((item, index) => (
                  <tr key={item.provider} className="border-b hover:bg-muted/50">
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                        />
                        <span className="capitalize font-medium">{item.provider}</span>
                      </div>
                    </td>
                    <td className="text-right p-3 font-mono">{formatCurrency(item.totalCost)}</td>
                    <td className="text-right p-3">{formatNumber(item.tokensSpent)}</td>
                    <td className="text-right p-3">
                      {item.tokensLeft !== null ? (
                        <span className={item.tokensLeft < 1000 ? 'text-destructive' : ''}>
                          {formatNumber(item.tokensLeft)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Unlimited</span>
                      )}
                    </td>
                    <td className="text-right p-3">{item.usageCount}</td>
                    <td className="text-right p-3">
                      <Badge 
                        variant={item.dataQuality >= 80 ? 'default' : item.dataQuality >= 60 ? 'secondary' : 'destructive'}
                      >
                        {item.dataQuality}%
                      </Badge>
                    </td>
                    <td className="text-right p-3 text-sm text-muted-foreground">
                      {formatDate(item.lastUsed)}
                    </td>
                  </tr>
                ))}
                {costData.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center p-8 text-muted-foreground">
                      No cost data available for the selected time period
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t-2 font-semibold bg-muted/30">
                  <td className="p-3">Total</td>
                  <td className="text-right p-3 font-mono">{formatCurrency(totalCost)}</td>
                  <td className="text-right p-3">{formatNumber(totalTokens)}</td>
                  <td className="p-3"></td>
                  <td className="text-right p-3">{costData.reduce((sum, item) => sum + item.usageCount, 0)}</td>
                  <td className="text-right p-3">
                    <Badge variant={avgDataQuality >= 80 ? 'default' : avgDataQuality >= 60 ? 'secondary' : 'destructive'}>
                      {Math.round(avgDataQuality)}%
                    </Badge>
                  </td>
                  <td className="p-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};