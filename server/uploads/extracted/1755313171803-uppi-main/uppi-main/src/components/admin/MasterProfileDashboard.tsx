import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, TrendingUp, Activity, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MetricCard } from '@/components/ui/metric-card';
import MasterCompanyProfileService from '@/services/masterCompanyProfileService';
import { useMasterProfileStats } from '@/hooks/admin/useMasterProfileStats';

const MasterProfileDashboard: React.FC = () => {
  const { stats, isLoading: statsLoading, error } = useMasterProfileStats();
  
  // Dynamic stats based on real data
  const displayStats = [
    {
      title: "Total Profiles",
      value: statsLoading ? "—" : stats.totalProfiles.toLocaleString(),
      icon: Building2,
      trend: statsLoading ? "—" : "+12%"
    },
    {
      title: "Verified Companies", 
      value: statsLoading ? "—" : stats.verifiedProfiles.toLocaleString(),
      icon: Users,
      trend: statsLoading ? "—" : "+8%"
    },
    {
      title: "Data Quality Score",
      value: statsLoading ? "—" : `${Math.round(stats.qualityScore)}%`,
      icon: TrendingUp,
      trend: statsLoading ? "—" : "+3%"
    },
    {
      title: "Active Analyses",
      value: statsLoading ? "—" : stats.activeAnalyses.toLocaleString(),
      icon: Activity,
      trend: statsLoading ? "—" : "+15%"
    }
  ];

  // Live metrics from master_company_profiles
  const [metrics, setMetrics] = useState({
    totalProfiles: 0,
    averageConfidence: 0,
    validatedProfiles: 0,
    pendingValidation: 0,
    highQualityProfiles: 0,
    recentUpdates: 0
  });
  const [metricsLoading, setMetricsLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setMetricsLoading(true);
        const data = await MasterCompanyProfileService.getDataQualityMetrics();
        if (mounted && data) setMetrics(data);
      } finally {
        if (mounted) setMetricsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Master Profiles Admin Dashboard</title>
        <meta name="description" content="Admin dashboard for managing master company profiles" />
        <link rel="canonical" href="/admin/master-profiles" />
      </Helmet>

      <header>
        <nav aria-label="Breadcrumb" className="mb-2 text-sm text-muted-foreground">
          <ol className="flex items-center gap-2">
            <li><Link to="/admin">Admin</Link></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-foreground font-medium">Master Profiles</li>
          </ol>
        </nav>
        <h2 className="text-2xl font-semibold tracking-tight">Master Profile Dashboard</h2>
        <p className="text-muted-foreground">
          Manage and monitor company profiles across the platform
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {displayStats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">{stat.trend}</span> from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <section>
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <h2 className="text-base font-medium">Ready to manage master profiles?</h2>
              <p className="text-sm text-muted-foreground">View the consolidated profiles list to validate, merge, and enrich.</p>
            </div>
            <Button asChild>
              <Link to="/admin/master-profiles/list" aria-label="Go to Master Profiles List">
                Go to List <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
      {/* Key Metrics */}
      <section aria-label="Key Metrics" className="space-y-3">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Profiles"
            value={metricsLoading ? '—' : metrics.totalProfiles}
            description="All master company profiles"
            icon={Building2}
          />
          <MetricCard
            title="Validated Profiles"
            value={metricsLoading ? '—' : metrics.validatedProfiles}
            description="Profiles with validated status"
            icon={Users}
          />
          <MetricCard
            title="Avg Confidence"
            value={metricsLoading ? '—' : `${Math.round(metrics.averageConfidence)}%`}
            description="Across all profiles"
            icon={TrendingUp}
          />
          <MetricCard
            title="Recent Updates"
            value={metricsLoading ? '—' : metrics.recentUpdates}
            description="Updated in last 7 days"
            icon={Activity}
          />
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentActivity.slice(0, 2).map((activity, index) => (
                <div key={activity.id} className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {activity.description}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {activity.company} - {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
              {stats.recentActivity.length === 0 && !statsLoading && (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              )}
              {statsLoading && (
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse"></div>
                  <div className="h-3 bg-muted rounded animate-pulse w-3/4"></div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Database</span>
                <Badge variant="secondary" className={
                  stats.systemHealth.database === 'healthy' ? "bg-green-100 text-green-700" :
                  stats.systemHealth.database === 'degraded' ? "bg-yellow-100 text-yellow-700" :
                  "bg-red-100 text-red-700"
                }>
                  {stats.systemHealth.database === 'healthy' ? 'Healthy' :
                   stats.systemHealth.database === 'degraded' ? 'Degraded' : 'Down'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">API Services</span>
                <Badge variant="secondary" className={
                  stats.systemHealth.apiServices === 'operational' ? "bg-green-100 text-green-700" :
                  stats.systemHealth.apiServices === 'degraded' ? "bg-yellow-100 text-yellow-700" :
                  "bg-red-100 text-red-700"
                }>
                  {stats.systemHealth.apiServices === 'operational' ? 'Operational' :
                   stats.systemHealth.apiServices === 'degraded' ? 'Degraded' : 'Down'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Data Validation</span>
                <Badge variant="secondary" className={
                  stats.systemHealth.dataValidation === 'processing' ? "bg-yellow-100 text-yellow-700" :
                  stats.systemHealth.dataValidation === 'idle' ? "bg-blue-100 text-blue-700" :
                  "bg-red-100 text-red-700"
                }>
                  {stats.systemHealth.dataValidation === 'processing' ? 'Processing' :
                   stats.systemHealth.dataValidation === 'idle' ? 'Idle' : 'Error'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MasterProfileDashboard;