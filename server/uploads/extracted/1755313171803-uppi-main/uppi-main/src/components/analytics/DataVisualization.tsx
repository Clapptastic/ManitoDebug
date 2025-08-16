/**
 * Interactive Data Visualization Component
 * Displays analytics data with interactive charts and real-time updates
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useEnhancedAnalytics } from '@/hooks/analytics/useEnhancedAnalytics';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart as PieChartIcon, 
  Activity,
  RefreshCw,
  Download
} from 'lucide-react';

export interface DataVisualizationProps {
  timeframe?: '24h' | '7d' | '30d';
  showExportButton?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const DataVisualization = ({
  timeframe = '24h',
  showExportButton = true,
  autoRefresh = true,
  refreshInterval = 60000
}: DataVisualizationProps) => {
  const { insights, isLoading, getInsights } = useEnhancedAnalytics();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe);

  useEffect(() => {
    loadInsights();
    
    if (autoRefresh) {
      const interval = setInterval(loadInsights, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [selectedTimeframe, autoRefresh, refreshInterval]);

  const loadInsights = async () => {
    await getInsights(selectedTimeframe);
  };

  const handleExport = () => {
    if (!insights) return;
    
    const dataStr = JSON.stringify(insights, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics-${selectedTimeframe}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Real data from analytics insights or default to empty arrays
  const hourlyData = insights?.hourlyData || [];
  const analysisData = insights?.analysisStatusDistribution || [];
  const apiUsageData = insights?.apiUsageData || [];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading analytics data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Analytics Dashboard</h3>
        <div className="flex items-center gap-2">
          <Tabs value={selectedTimeframe} onValueChange={(value) => setSelectedTimeframe(value as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="24h">24 Hours</TabsTrigger>
              <TabsTrigger value="7d">7 Days</TabsTrigger>
              <TabsTrigger value="30d">30 Days</TabsTrigger>
            </TabsList>
          </Tabs>
          {showExportButton && (
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={loadInsights}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Visualization Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-1">
            <Activity className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-1">
            <PieChartIcon className="h-4 w-4" />
            Analysis
          </TabsTrigger>
          <TabsTrigger value="apis" className="flex items-center gap-1">
            <BarChart3 className="h-4 w-4" />
            API Usage
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Activity Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Activity Timeline</CardTitle>
                <CardDescription>Events and user activity over time</CardDescription>
              </CardHeader>
              <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="events" fill="#3b82f6" />
                  <Bar dataKey="users" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Error Rate */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Error Monitoring</CardTitle>
                <CardDescription>System errors and response times</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="errors" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      dot={{ fill: '#ef4444', strokeWidth: 2, r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">User Engagement Trends</CardTitle>
              <CardDescription>Active users and session patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="users" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="events" 
                    stroke="#22c55e" 
                    strokeWidth={2}
                    dot={{ fill: '#22c55e', strokeWidth: 2, r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Analysis Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={analysisData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {analysisData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center space-x-4 mt-4">
                  {analysisData.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm">{item.name}: {item.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Analysis Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Average Completion Time</span>
                    <Badge>2.3 minutes</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Success Rate</span>
                    <Badge variant="default">96.8%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Analyses</span>
                    <Badge variant="outline">1,247</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Peak Hour</span>
                    <Badge variant="secondary">2:00 PM</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="apis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">API Provider Usage</CardTitle>
              <CardDescription>Request distribution across providers</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={apiUsageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="usage" fill="#3b82f6" />
                  <Bar dataKey="requests" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};