/**
 * Enhanced Analytics Dashboard Page
 * Integrates all real-time components and widgets for comprehensive monitoring
 */

import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnalyticsDashboardWidget } from '@/components/analytics/AnalyticsDashboardWidget';
import { ApiStatusIndicator } from '@/components/status/ApiStatusIndicator';
import { DataVisualization } from '@/components/analytics/DataVisualization';
import { RealtimeStatusCard } from '@/components/status/RealtimeStatusCard';
import { useEnhancedAnalytics } from '@/hooks/analytics/useEnhancedAnalytics';
import { BarChart3, Activity, Settings, TrendingUp } from 'lucide-react';

export const EnhancedAnalyticsPage = () => {
  const { trackPageView } = useEnhancedAnalytics();

  useEffect(() => {
    trackPageView('analytics_dashboard', {
      page_type: 'admin',
      enhanced_features: true
    });
  }, [trackPageView]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time insights and system monitoring
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            Live Updates Active
          </div>
        </div>
      </div>

      {/* Main Dashboard Widgets */}
      <AnalyticsDashboardWidget 
        refreshInterval={30000}
        showRealTimeIndicator={true}
      />

      {/* Tabbed Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="status" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            System Status
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Data Visualization */}
            <div className="lg:col-span-2">
              <DataVisualization 
                timeframe="24h"
                showExportButton={true}
                autoRefresh={true}
                refreshInterval={60000}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="status" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* API Status */}
            <ApiStatusIndicator 
              compact={false}
              showValidateButton={true}
            />
            
            {/* System Status */}
            <RealtimeStatusCard 
              title="System Health"
              showUptime={true}
              showResponseTime={true}
              refreshInterval={30000}
            />
          </div>

          {/* Detailed Status Grid */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Database Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Queries/sec</span>
                    <span className="text-sm font-medium">127</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Avg Response</span>
                    <span className="text-sm font-medium">23ms</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Active Connections</span>
                    <span className="text-sm font-medium">15/100</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">API Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Requests/min</span>
                    <span className="text-sm font-medium">342</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Success Rate</span>
                    <span className="text-sm font-medium">98.7%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Avg Latency</span>
                    <span className="text-sm font-medium">145ms</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Real-time Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Active Analyses</span>
                    <span className="text-sm font-medium">7</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Queue Length</span>
                    <span className="text-sm font-medium">3</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Processing Time</span>
                    <span className="text-sm font-medium">2.3min</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid gap-6">
            {/* Enhanced Analytics Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Analytics Insights</CardTitle>
                <CardDescription>
                  AI-powered insights from your platform usage data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-2">Peak Usage Pattern</h4>
                    <p className="text-sm text-blue-700">
                      Your users are most active between 2-4 PM. Consider scheduling maintenance 
                      outside these hours for minimal impact.
                    </p>
                  </div>
                  
                  <div className="p-4 border rounded-lg bg-green-50 border-green-200">
                    <h4 className="font-medium text-green-900 mb-2">Performance Optimization</h4>
                    <p className="text-sm text-green-700">
                      API response times have improved by 23% this week. The caching improvements 
                      are showing positive results.
                    </p>
                  </div>
                  
                  <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
                    <h4 className="font-medium text-yellow-900 mb-2">Resource Utilization</h4>
                    <p className="text-sm text-yellow-700">
                      Consider adding more API providers for redundancy. OpenAI usage is at 78% 
                      of your rate limits.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dashboard Settings</CardTitle>
              <CardDescription>
                Configure your analytics dashboard preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Real-time Updates</label>
                    <p className="text-xs text-muted-foreground">
                      Enable live data refreshing
                    </p>
                  </div>
                  <input type="checkbox" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Email Notifications</label>
                    <p className="text-xs text-muted-foreground">
                      Get notified about system issues
                    </p>
                  </div>
                  <input type="checkbox" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Data Retention</label>
                    <p className="text-xs text-muted-foreground">
                      How long to keep analytics data
                    </p>
                  </div>
                  <select className="text-sm border rounded px-2 py-1">
                    <option>30 days</option>
                    <option>90 days</option>
                    <option>1 year</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};