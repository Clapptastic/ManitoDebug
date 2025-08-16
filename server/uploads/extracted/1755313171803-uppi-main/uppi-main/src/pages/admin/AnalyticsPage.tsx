
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, Eye, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AnalyticsSummary, WebsiteMetrics, Website } from '@/types/admin';
import CompetitorAnalyticsDashboard from '@/components/admin/competitor/CompetitorAnalyticsDashboard';
import { CompetitorAnalysisDebugger } from '@/components/testing/CompetitorAnalysisDebugger';
import { SystemTestPanel } from '@/components/testing/SystemTestPanel';

const AnalyticsPage: React.FC = () => {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary>({
    total_pageviews: 0,
    unique_visitors: 0,
    bounce_rate: 0,
    avg_session_duration: 0
  });
  const [metrics, setMetrics] = useState<WebsiteMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        
        // Fetch real analytics data from website_analytics table
        const { data: analyticsData, error: analyticsError } = await supabase
          .from('website_analytics')
          .select('*')
          .order('date', { ascending: false });

        // If primary source fails or has no rows, gracefully fall back to edge_function_metrics
        if (analyticsError) {
          console.error('Error fetching analytics:', analyticsError);
        }

        let effectiveData = analyticsData;

        if (!effectiveData || effectiveData.length === 0) {
          // Fallback: use edge_function_metrics to keep the dashboard informative
          const startIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
          const { data: edgeData, error: edgeError } = await supabase
            .from('edge_function_metrics')
            .select('user_id, created_at, status')
            .gte('created_at', startIso)
            .order('created_at', { ascending: false });

          if (!edgeError && edgeData) {
            const totalEvents = edgeData.length;
            const uniqueUsers = new Set(edgeData.map((d: any) => d.user_id).filter(Boolean)).size;
            const failures = edgeData.filter((d: any) => d.status !== 'success').length;

            setWebsites([]);
            setSummary({
              total_pageviews: totalEvents,
              unique_visitors: uniqueUsers,
              bounce_rate: totalEvents > 0 ? (failures / totalEvents) * 100 : 0,
              avg_session_duration: 0
            });
            setMetrics([]);
            return;
          }

          // If fallback also fails, set empty state and exit
          setWebsites([]);
          setSummary({
            total_pageviews: 0,
            unique_visitors: 0,
            bounce_rate: 0,
            avg_session_duration: 0
          });
          setMetrics([]);
          return;
        }

        // Group analytics by website and calculate summary
        const websiteMap = new Map<string, Website>();
        let totalPageviews = 0;
        let totalUniqueVisitors = 0;
        let totalBounceRate = 0;
        let totalSessionDuration = 0;
        const metricsArray: WebsiteMetrics[] = [];

        if (analyticsData && analyticsData.length > 0) {
          analyticsData.forEach((record) => {
            const websiteId = record.id;
            
            // Create website entry if it doesn't exist
            if (!websiteMap.has(websiteId)) {
              websiteMap.set(websiteId, {
                id: websiteId,
                name: 'Website',
                domain: 'example.com',
                created_at: record.created_at
              });
            }

            // Add to metrics
            metricsArray.push({
              website_id: websiteId,
              pageviews: record.pageviews || 0,
              unique_visitors: record.unique_visitors || 0,
              bounce_rate: record.bounce_rate || 0,
              avg_session_duration: record.session_duration || 0,
              date: record.date
            });

            // Accumulate totals
            totalPageviews += record.pageviews || 0;
            totalUniqueVisitors += record.unique_visitors || 0;
            totalBounceRate += record.bounce_rate || 0;
            totalSessionDuration += record.session_duration || 0;
          });

          // Calculate averages
          const recordCount = analyticsData.length;
          totalBounceRate = recordCount > 0 ? totalBounceRate / recordCount : 0;
          totalSessionDuration = recordCount > 0 ? totalSessionDuration / recordCount : 0;
        }

        setWebsites(Array.from(websiteMap.values()));
        setSummary({
          total_pageviews: totalPageviews,
          unique_visitors: totalUniqueVisitors,
          bounce_rate: totalBounceRate,
          avg_session_duration: totalSessionDuration
        });
        setMetrics(metricsArray);

      } catch (error) {
        console.error('Error fetching analytics:', error);
        toast({
          title: 'Error',
          description: 'Failed to load analytics data',
          variant: 'destructive',
        });
        
        // Set empty data on error
        setWebsites([]);
        setSummary({
          total_pageviews: 0,
          unique_visitors: 0,
          bounce_rate: 0,
          avg_session_duration: 0
        });
        setMetrics([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [toast]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
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
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
        <p className="text-muted-foreground">
          Monitor website performance and user engagement metrics.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pageviews</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total_pageviews.toLocaleString()}</div>
            {/* Remove hardcoded percentage for now - would need historical data for comparison */}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.unique_visitors.toLocaleString()}</div>
            {/* Remove hardcoded percentage for now - would need historical data for comparison */}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.bounce_rate.toFixed(1)}%</div>
            {/* Remove hardcoded percentage for now - would need historical data for comparison */}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Session</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.floor(summary.avg_session_duration / 60)}m {summary.avg_session_duration % 60}s</div>
            {/* Remove hardcoded percentage for now - would need historical data for comparison */}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="websites">Websites</TabsTrigger>
          <TabsTrigger value="competitor-analytics">Competitor Analytics</TabsTrigger>
          <TabsTrigger value="system-testing">System Testing</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Traffic Overview</CardTitle>
                <CardDescription>Your website traffic over the last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center">
                  {metrics.length > 0 ? (
                    <div className="w-full h-full">
                      <div className="grid grid-cols-2 gap-4 h-full">
                        <div className="space-y-2">
                          <h4 className="font-medium">Recent Metrics</h4>
                          {metrics.slice(0, 5).map((metric, i) => (
                            <div key={i} className="flex justify-between text-sm">
                              <span>{new Date(metric.date).toLocaleDateString()}</span>
                              <span>{metric.pageviews} views</span>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-medium">Summary</h4>
                          <div className="text-sm text-muted-foreground">
                            <p>Total Pageviews: {metrics.reduce((sum, m) => sum + m.pageviews, 0)}</p>
                            <p>Avg. Bounce Rate: {(metrics.reduce((sum, m) => sum + m.bounce_rate, 0) / metrics.length).toFixed(1)}%</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No traffic data available for chart</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Pages</CardTitle>
                <CardDescription>Most visited pages on your website</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.length > 0 ? (
                    // Show real top pages based on pageviews data
                    metrics
                      .sort((a, b) => b.pageviews - a.pageviews)
                      .slice(0, 5)
                      .map((metric, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="font-medium">{metric.website_id}</span>
                          <Badge variant="secondary">{metric.pageviews.toLocaleString()} views</Badge>
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground">No page data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="websites">
          <Card>
            <CardHeader>
              <CardTitle>Websites</CardTitle>
              <CardDescription>Manage and monitor your websites</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {websites.map((website) => (
                  <div key={website.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{website.name}</h3>
                      <p className="text-sm text-muted-foreground">{website.domain}</p>
                    </div>
                    <Badge variant="outline">Active</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="competitor-analytics">
          <CompetitorAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="system-testing">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">System Testing</h3>
              <p className="text-muted-foreground">
                Test and debug competitor analysis functionality to ensure all backend services are properly connected.
              </p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h4 className="text-md font-medium mb-4">System Debugger</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Debug system components and check for configuration issues.
                </p>
                <CompetitorAnalysisDebugger />
              </div>
              
              <div>
                <h4 className="text-md font-medium mb-4">End-to-End Test Runner</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Run comprehensive tests to verify that all competitor analysis functionality is working correctly.
                </p>
                <SystemTestPanel />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Reports</CardTitle>
              <CardDescription>Generate and download detailed reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Report generation functionality will be available here.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsPage;
