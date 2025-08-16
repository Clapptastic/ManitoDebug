import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Activity,
  Clock,
  Target,
  AlertCircle
} from 'lucide-react';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { SystemHealthMetrics } from '@/components/analytics/SystemHealthMetrics';
import { UserEngagementChart } from '@/components/analytics/UserEngagementChart';
import { APIUsageChart } from '@/components/analytics/APIUsageChart';
import { CostAnalysisChart } from '@/components/analytics/CostAnalysisChart';

export const AnalyticsPage: React.FC = () => {
  const { 
    systemMetrics, 
    userMetrics, 
    apiMetrics, 
    costMetrics, 
    loading, 
    error 
  } = useAnalyticsData();

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Activity className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-muted-foreground">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>Failed to load analytics data: {error}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor system health, user engagement, and business metrics
        </p>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userMetrics?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{userMetrics?.newUsersThisMonth || 0} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Calls</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{apiMetrics?.totalCalls || 0}</div>
            <p className="text-xs text-muted-foreground">
              {apiMetrics?.successRate || 0}% success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Costs</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${costMetrics?.totalCost || 0}</div>
            <p className="text-xs text-muted-foreground">
              This month: ${costMetrics?.monthlyTotal || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics?.uptime || '99.9'}%</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="api">API Usage</TabsTrigger>
          <TabsTrigger value="costs">Costs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SystemHealthMetrics metrics={systemMetrics} />
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Recent Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">New competitor analyses</span>
                    <span className="font-medium">{userMetrics?.recentAnalyses || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">API calls today</span>
                    <span className="font-medium">{apiMetrics?.todayCalls || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active sessions</span>
                    <span className="font-medium">{userMetrics?.activeSessions || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <UserEngagementChart data={userMetrics?.chartData} />
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <APIUsageChart data={apiMetrics?.chartData} />
        </TabsContent>

        <TabsContent value="costs" className="space-y-6">
          <CostAnalysisChart data={costMetrics?.chartData} />
        </TabsContent>
      </Tabs>
    </div>
  );
};