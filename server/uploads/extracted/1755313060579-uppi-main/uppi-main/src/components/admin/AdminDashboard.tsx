import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, BarChart3, TrendingUp, Database, Activity } from 'lucide-react';
import { useAdminStats } from '@/hooks/admin/useAdminStats';
import { useAuthContext } from '@/hooks/auth/useAuthContext';

const AdminDashboard: React.FC = () => {
  const { userStats, apiMetrics, competitorStats, systemHealth, loading, error } = useAdminStats();
  const { user, isSuperAdmin } = useAuthContext();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-muted animate-pulse rounded w-1/2"></div>
                <div className="h-4 w-4 bg-muted animate-pulse rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-6 bg-muted animate-pulse rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-muted animate-pulse rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="mb-6">
        <AlertDescription>
          Error loading dashboard data: {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
          <p className="text-muted-foreground">
            Welcome back, {user?.email}. Here's your platform overview.
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{userStats?.newUsers || 0} from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats?.activeUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {userStats?.conversionRate?.toFixed(1) || 0}% conversion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Requests</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{apiMetrics?.totalRequests || 0}</div>
            <p className="text-xs text-muted-foreground">
              ${apiMetrics?.totalCost?.toFixed(2) || '0.00'} total cost
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Competitor Analyses</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{competitorStats?.totalAnalyses || 0}</div>
            <p className="text-xs text-muted-foreground">
              {competitorStats?.uniqueUsers || 0} unique users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Status</span>
                <span className={`text-sm font-medium ${
                  systemHealth?.database.status === 'healthy' 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {systemHealth?.database.status || 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Response Time</span>
                <span className="text-sm font-medium">
                  {systemHealth?.database.responseTime || 0}ms
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Uptime</span>
                <span className="text-sm font-medium">
                  {systemHealth?.database.uptime || 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Status</span>
                <span className={`text-sm font-medium ${
                  systemHealth?.api.status === 'healthy' 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {systemHealth?.api.status || 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Avg Response</span>
                <span className="text-sm font-medium">
                  {systemHealth?.api.responseTime || 0}ms
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Error Rate</span>
                <span className="text-sm font-medium">
                  {systemHealth?.api.errorRate || 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Storage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Status</span>
                <span className={`text-sm font-medium ${
                  systemHealth?.storage.status === 'healthy' 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {systemHealth?.storage.status || 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Usage</span>
                <span className="text-sm font-medium">
                  {systemHealth?.storage.usage || 0}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Quota</span>
                <span className="text-sm font-medium">
                  {systemHealth?.storage.quota || 0}GB
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions for Super Admin */}
      {isSuperAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Super Admin Tools</CardTitle>
            <CardDescription>
              Additional tools available for super administrators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="font-medium">Database Management</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• View database schema</li>
                  <li>• Monitor RLS policies</li>
                  <li>• Database functions overview</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">System Administration</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• User role management</li>
                  <li>• System configuration</li>
                  <li>• Development tools access</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminDashboard;