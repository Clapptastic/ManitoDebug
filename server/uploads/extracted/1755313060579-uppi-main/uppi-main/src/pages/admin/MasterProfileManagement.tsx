/**
 * Master Profile Management Page
 * Comprehensive admin interface for master profiles with feature flags
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Database, 
  Settings, 
  BarChart3, 
  Users, 
  Flag,
  Shield,
  Zap,
  TrendingUp,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import MasterProfileDashboard from '@/components/admin/MasterProfileDashboard';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { FEATURE_FLAGS } from '@/services/featureFlagService';
import { useMasterProfileStats } from '@/hooks/admin/useMasterProfileStats';
import { Link } from 'react-router-dom';

export const MasterProfileManagement = () => {
  const { isEnabled: masterProfilesEnabled, loading } = useFeatureFlag(FEATURE_FLAGS.MASTER_PROFILES_ENABLED);
  const { isEnabled: adminDashboardEnabled } = useFeatureFlag(FEATURE_FLAGS.MASTER_PROFILES_ADMIN_DASHBOARD);
  const { stats, isLoading: statsLoading, error, refreshStats } = useMasterProfileStats();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Master Profile Management</h1>
          <p className="text-muted-foreground">
            Advanced admin controls for master company profiles and feature management
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={masterProfilesEnabled ? "default" : "secondary"}>
            <Flag className="h-3 w-3 mr-1" />
            {masterProfilesEnabled ? 'Active' : 'Disabled'}
          </Badge>
          {(loading || statsLoading) && (
            <Badge variant="outline">
              <Settings className="h-3 w-3 mr-1 animate-spin" />
              Loading
            </Badge>
          )}
          {error && (
            <Badge variant="destructive">
              Error Loading Data
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={refreshStats} disabled={statsLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${statsLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button asChild>
            <Link to="/admin/master-profiles/list" aria-label="Go to Master Profiles List">
              View Profiles <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Feature Status</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {masterProfilesEnabled ? 'Enabled' : 'Disabled'}
            </div>
            <p className="text-xs text-muted-foreground">
              Master profiles system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.systemHealth.database === 'healthy' ? 'Optimal' : 
               stats.systemHealth.database === 'degraded' ? 'Degraded' : 'Down'}
            </div>
            <p className="text-xs text-muted-foreground">
              Database and API services
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Quality</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '—' : `${Math.round(stats.qualityScore)}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              Average confidence score
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Features</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '—' : `${stats.activeFeatures}/${stats.totalFeatures}`}
            </div>
            <p className="text-xs text-muted-foreground">
              Feature flags enabled
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {masterProfilesEnabled && adminDashboardEnabled ? (
            <MasterProfileDashboard />
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Database className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Master Profile Dashboard Disabled</h3>
                <p className="text-muted-foreground mb-4">
                  Enable master profiles and admin dashboard features to view analytics.
                </p>
                <Button variant="outline" onClick={() => window.location.href = '#features'}>
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Features
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

      

        <TabsContent value="settings" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Master Profile Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Master Profile Configuration</CardTitle>
                <CardDescription>
                  Advanced settings for master profile functionality
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Auto-Contribution</label>
                    <p className="text-xs text-muted-foreground">
                      Automatically contribute analysis data to master profiles
                    </p>
                  </div>
                  <Badge variant={masterProfilesEnabled ? "default" : "secondary"}>
                    {masterProfilesEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">AI Validation</label>
                    <p className="text-xs text-muted-foreground">
                      Use AI to validate profile data quality
                    </p>
                  </div>
                  <Badge variant="outline">Disabled</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Confidence Scoring</label>
                    <p className="text-xs text-muted-foreground">
                      Calculate confidence scores for profile data
                    </p>
                  </div>
                  <Badge variant="default">Enabled</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Data Quality Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Data Quality Settings</CardTitle>
                <CardDescription>
                  Configure data validation and quality thresholds
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Minimum Confidence Threshold</label>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">
                      {statsLoading ? '—' : `${stats.minConfidenceThreshold}%`}
                    </span>
                    <Badge variant="secondary">Default</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Minimum confidence score required for auto-contributions
                  </p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data Freshness Requirement</label>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">
                      {statsLoading ? '—' : stats.dataFreshnessRequirement}
                    </span>
                    <span className="text-sm text-muted-foreground">days</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Maximum age for profile data before flagging for review
                  </p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Validation Sources</label>
                  <div className="flex gap-2">
                    <Badge>AI Analysis</Badge>
                    <Badge>Manual Review</Badge>
                    <Badge variant="outline">External APIs</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Integration */}
            <Card>
              <CardHeader>
                <CardTitle>System Integration</CardTitle>
                <CardDescription>
                  Integration settings with other platform features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Competitive Analysis Integration</label>
                    <p className="text-xs text-muted-foreground">
                      Sync with competitive analysis workflows
                    </p>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Real-time Updates</label>
                    <p className="text-xs text-muted-foreground">
                      Live updates via WebSocket connections
                    </p>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Batch Processing</label>
                    <p className="text-xs text-muted-foreground">
                      Schedule bulk profile updates
                    </p>
                  </div>
                  <Badge variant="secondary">Scheduled</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Performance Monitoring */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Monitoring</CardTitle>
                <CardDescription>
                  System performance and optimization settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Cache Hit Rate</label>
                    <div className="text-2xl font-bold text-green-600">
                      {statsLoading ? '—' : `${stats.cacheHitRate.toFixed(1)}%`}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Avg Response Time</label>
                    <div className="text-2xl font-bold">
                      {statsLoading ? '—' : `${stats.avgResponseTime}ms`}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Active Connections</label>
                    <div className="text-2xl font-bold">
                      {statsLoading ? '—' : stats.activeConnections}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Queue Length</label>
                    <div className={`text-2xl font-bold ${stats.queueLength > 10 ? 'text-red-600' : stats.queueLength > 5 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {statsLoading ? '—' : stats.queueLength}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};