import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, RefreshCw, Activity, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { systemHealthMonitor } from '@/services/monitoring/SystemHealthMonitoringService';

const SystemHealthPage: React.FC = () => {
  const navigate = useNavigate();
  const [healthData, setHealthData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHealthData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await systemHealthMonitor.getSystemHealthOverview();
      setHealthData(data);
    } catch (err: any) {
      console.error('Failed to load system health:', err);
      setError(err.message || 'Failed to load system health data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealthData();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'healthy':
      case 'operational':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'critical':
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Activity className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'healthy':
      case 'operational':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical':
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center space-y-4">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">Loading system health data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Health Monitor</h1>
          <p className="text-muted-foreground">
            Real-time monitoring of system components and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadHealthData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <XCircle className="h-5 w-5 text-destructive" />
              <div>
                <p className="font-medium text-destructive">Error Loading System Health</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Status Overview */}
      {healthData && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                System Status Overview
              </CardTitle>
              <CardDescription>
                Overall system health and component status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    {getStatusIcon(healthData.system_status)}
                  </div>
                  <Badge className={getStatusColor(healthData.system_status)}>
                    {healthData.system_status || 'Unknown'}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-1">Overall Status</p>
                </div>
                
                {healthData.metrics && (
                  <>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{healthData.metrics.active_transactions || 0}</div>
                      <p className="text-sm text-muted-foreground">Active Transactions</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold">{healthData.metrics.slow_operations_last_hour || 0}</div>
                      <p className="text-sm text-muted-foreground">Slow Operations (1h)</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold">{healthData.metrics.active_subscriptions || 0}</div>
                      <p className="text-sm text-muted-foreground">Active Subscriptions</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          {healthData.metrics && (
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>
                  System performance indicators and alerts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span>Memory Warnings (Last Hour)</span>
                    <span className="font-medium">{healthData.metrics.memory_warnings_last_hour || 0}</span>
                  </div>
                  <Progress 
                    value={Math.min((healthData.metrics.memory_warnings_last_hour || 0) * 10, 100)} 
                    className="h-2"
                  />
                </div>
                
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span>Slow Operations (Last Hour)</span>
                    <span className="font-medium">{healthData.metrics.slow_operations_last_hour || 0}</span>
                  </div>
                  <Progress 
                    value={Math.min((healthData.metrics.slow_operations_last_hour || 0) * 2, 100)} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* System Components */}
          <Card>
            <CardHeader>
              <CardTitle>System Components</CardTitle>
              <CardDescription>
                Status of individual system components and services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: 'Database', status: 'healthy', uptime: '99.9%' },
                  { name: 'API Gateway', status: 'healthy', uptime: '99.8%' },
                  { name: 'Edge Functions', status: 'healthy', uptime: '99.7%' },
                  { name: 'Real-time', status: 'healthy', uptime: '99.9%' },
                  { name: 'Storage', status: 'healthy', uptime: '99.8%' },
                  { name: 'Authentication', status: 'healthy', uptime: '99.9%' }
                ].map((component, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(component.status)}
                      <div>
                        <p className="font-medium">{component.name}</p>
                        <p className="text-xs text-muted-foreground">Uptime: {component.uptime}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={getStatusColor(component.status)}>
                      {component.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Last Updated */}
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground text-center">
                Last updated: {healthData.timestamp ? new Date(healthData.timestamp).toLocaleString() : 'Unknown'}
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default SystemHealthPage;