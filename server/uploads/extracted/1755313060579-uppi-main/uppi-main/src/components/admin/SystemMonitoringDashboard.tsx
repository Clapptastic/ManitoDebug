import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, AlertTriangle, CheckCircle, Clock, Database, Server, Wifi } from 'lucide-react';

interface SystemMetric {
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  value: string;
  description: string;
  lastUpdated: string;
}

const SystemMonitoringDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetric[]>([
    {
      name: 'Database Connection',
      status: 'healthy',
      value: '99.9%',
      description: 'Supabase PostgreSQL database',
      lastUpdated: '2 minutes ago'
    },
    {
      name: 'API Response Time',
      status: 'healthy',
      value: '120ms',
      description: 'Average response time',
      lastUpdated: '1 minute ago'
    },
    {
      name: 'Memory Usage',
      status: 'warning',
      value: '78%',
      description: 'Application memory consumption',
      lastUpdated: '30 seconds ago'
    },
    {
      name: 'Storage Usage',
      status: 'healthy',
      value: '45%',
      description: 'Document storage utilization',
      lastUpdated: '5 minutes ago'
    },
    {
      name: 'Edge Functions',
      status: 'healthy',
      value: 'Online',
      description: 'All edge functions operational',
      lastUpdated: '1 minute ago'
    },
    {
      name: 'Authentication',
      status: 'healthy',
      value: 'Active',
      description: 'User authentication service',
      lastUpdated: '30 seconds ago'
    }
  ]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'critical':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const healthyCount = metrics.filter(m => m.status === 'healthy').length;
  const warningCount = metrics.filter(m => m.status === 'warning').length;
  const criticalCount = metrics.filter(m => m.status === 'critical').length;

  const overallHealth = (healthyCount / metrics.length) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Monitoring</h2>
          <p className="text-muted-foreground">
            Real-time system health and performance metrics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${overallHealth > 90 ? 'bg-green-500' : overallHealth > 70 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
          <span className="text-sm font-medium">
            System Status: {overallHealth > 90 ? 'Healthy' : overallHealth > 70 ? 'Warning' : 'Critical'}
          </span>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(overallHealth)}%</div>
            <p className="text-xs text-muted-foreground">System operational</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Healthy Services</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthyCount}</div>
            <p className="text-xs text-muted-foreground">Services running well</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warnings</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{warningCount}</div>
            <p className="text-xs text-muted-foreground">Services need attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{criticalCount}</div>
            <p className="text-xs text-muted-foreground">Services down</p>
          </CardContent>
        </Card>
      </div>

      {/* System Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>System Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.map((metric, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  {getStatusIcon(metric.status)}
                  <div>
                    <h4 className="font-medium">{metric.name}</h4>
                    <p className="text-sm text-muted-foreground">{metric.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-lg">{metric.value}</span>
                    <Badge
                      variant="secondary"
                      className={`text-primary-foreground ${getStatusColor(metric.status)}`}
                    >
                      {metric.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Updated {metric.lastUpdated}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Infrastructure Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="w-5 h-5" />
              <span>Database</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Connection Pool:</span>
                <span className="text-sm font-medium">8/10 Active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Query Performance:</span>
                <span className="text-sm font-medium">Optimal</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Storage Used:</span>
                <span className="text-sm font-medium">2.3 GB</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Server className="w-5 h-5" />
              <span>Edge Functions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">competitor-analysis:</span>
                <Badge variant="secondary" className="bg-green-500 text-primary-foreground">Active</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">ai-chat:</span>
                <Badge variant="secondary" className="bg-green-500 text-primary-foreground">Active</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">admin-api:</span>
                <Badge variant="secondary" className="bg-green-500 text-primary-foreground">Active</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wifi className="w-5 h-5" />
              <span>Network</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Latency:</span>
                <span className="text-sm font-medium">12ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Bandwidth:</span>
                <span className="text-sm font-medium">1.2 GB/s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Uptime:</span>
                <span className="text-sm font-medium">99.98%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SystemMonitoringDashboard;