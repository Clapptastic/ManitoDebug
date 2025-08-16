/**
 * Business Intelligence & Reporting Dashboard
 * Phase 12 main dashboard component
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Download,
  Plus,
  Filter,
  Calendar,
  Eye,
  Share2,
  Target,
  Activity,
  DollarSign,
  Users,
  AlertTriangle,
  Lightbulb,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { reportingService } from '@/services/reportingService';
import type { 
  CustomReport, 
  KPIMetric, 
  BusinessInsight, 
  BusinessDashboard,
  ReportFilters 
} from '@/types/reporting';

export const ReportingDashboard: React.FC = () => {
  const [reports, setReports] = useState<CustomReport[]>([]);
  const [kpiMetrics, setKpiMetrics] = useState<KPIMetric[]>([]);
  const [insights, setInsights] = useState<BusinessInsight[]>([]);
  const [dashboards, setDashboards] = useState<BusinessDashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState<ReportFilters>({});
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [reportsData, kpiData, insightsData, dashboardsData] = await Promise.all([
        reportingService.getReports(filters),
        reportingService.getKPIMetrics(),
        reportingService.getBusinessInsights(),
        reportingService.getDashboards()
      ]);

      setReports(reportsData);
      setKpiMetrics(kpiData);
      setInsights(insightsData);
      setDashboards(dashboardsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadDashboardData();
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-success" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-destructive" />;
      default:
        return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'trend':
        return <TrendingUp className="w-5 h-5 text-blue-500" />;
      case 'anomaly':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'recommendation':
        return <Lightbulb className="w-5 h-5 text-yellow-500" />;
      case 'alert':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return <Activity className="w-5 h-5 text-gray-500" />;
    }
  };

  const getImpactColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Business Intelligence</h1>
          <p className="text-muted-foreground">
            Analytics, reports, and insights for data-driven decisions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Report
          </Button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiMetrics.map((kpi) => (
          <Card key={kpi.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {kpi.name}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold">
                      {kpi.unit === 'USD' ? formatCurrency(kpi.value) : formatNumber(kpi.value)}
                    </p>
                    {kpi.unit !== 'USD' && (
                      <span className="text-sm text-muted-foreground">{kpi.unit}</span>
                    )}
                  </div>
                  {kpi.change_percentage && (
                    <div className="flex items-center gap-1">
                      {getTrendIcon(kpi.trend)}
                      <span className={`text-xs font-medium ${
                        kpi.trend === 'up' ? 'text-success' : 
                        kpi.trend === 'down' ? 'text-destructive' : 'text-muted-foreground'
                      }`}>
                        {Math.abs(kpi.change_percentage)}%
                      </span>
                      <span className="text-xs text-muted-foreground">vs last period</span>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  {kpi.target && (
                    <>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Target className="w-3 h-3" />
                        Target: {kpi.unit === 'USD' ? formatCurrency(kpi.target) : formatNumber(kpi.target)}
                      </div>
                      <div className="w-12 h-2 bg-secondary rounded-full mt-2">
                        <div 
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${Math.min((kpi.value / kpi.target) * 100, 100)}%` }}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="dashboards">Dashboards</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Recent Reports */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Reports</CardTitle>
              <CardDescription>
                Your most recently created and executed reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reports.slice(0, 5).map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <BarChart3 className="w-5 h-5 text-primary" />
                      <div>
                        <h4 className="font-medium">{report.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {report.description || 'No description'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {report.is_shared && (
                        <Badge variant="outline">
                          <Share2 className="w-3 h-3 mr-1" />
                          Shared
                        </Badge>
                      )}
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Business Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Business Insights</CardTitle>
              <CardDescription>
                AI-powered insights and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights.slice(0, 3).map((insight) => (
                  <div key={insight.id} className="border rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      {getInsightIcon(insight.type)}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{insight.title}</h4>
                          <Badge variant={getImpactColor(insight.impact_level)}>
                            {insight.impact_level}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {insight.description}
                        </p>
                        {insight.action_items && insight.action_items.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">Recommended Actions:</p>
                            <ul className="text-xs text-muted-foreground space-y-1">
                              {insight.action_items.slice(0, 2).map((action, index) => (
                                <li key={index} className="flex items-center gap-1">
                                  <span className="w-1 h-1 bg-muted-foreground rounded-full" />
                                  {action}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Custom Reports</h2>
            <div className="flex items-center gap-2">
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Report
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
              <Card key={report.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{report.name}</CardTitle>
                    {report.is_shared && (
                      <Badge variant="outline">
                        <Share2 className="w-3 h-3 mr-1" />
                        Shared
                      </Badge>
                    )}
                  </div>
                  <CardDescription>
                    {report.description || 'No description provided'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Data Source:</span>
                      <Badge variant="secondary">
                        {report.query_config.data_source}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Chart Type:</span>
                      <span className="capitalize">{report.chart_config.type}</span>
                    </div>
                    {report.last_run_at && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Last Run:</span>
                        <span>{new Date(report.last_run_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button size="sm" className="flex-1">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Run
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="dashboards" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Analytics Dashboards</h2>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Dashboard
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboards.map((dashboard) => (
              <Card key={dashboard.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">{dashboard.name}</CardTitle>
                  <CardDescription>
                    {dashboard.description || 'No description provided'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Widgets:</span>
                      <span>{dashboard.widgets?.length || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Created:</span>
                      <span>{new Date(dashboard.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Button className="w-full mt-4">
                    <Eye className="w-4 h-4 mr-2" />
                    Open Dashboard
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Business Insights</h2>
            <Button variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Generate New Insights
            </Button>
          </div>

          <div className="space-y-4">
            {insights.map((insight) => (
              <Card key={insight.id}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {getInsightIcon(insight.type)}
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">{insight.title}</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant={getImpactColor(insight.impact_level)}>
                            {insight.impact_level} impact
                          </Badge>
                          <Badge variant="outline">
                            {Math.round(insight.confidence_score * 100)}% confidence
                          </Badge>
                        </div>
                      </div>
                      <p className="text-muted-foreground">{insight.description}</p>
                      {insight.action_items && insight.action_items.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium">Recommended Actions:</h4>
                          <ul className="space-y-1">
                            {insight.action_items.map((action, index) => (
                              <li key={index} className="flex items-center gap-2 text-sm">
                                <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                                {action}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportingDashboard;