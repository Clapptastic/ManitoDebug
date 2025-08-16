import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Server, 
  Database, 
  Cpu, 
  MemoryStick, 
  HardDrive,
  NetworkIcon,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  TrendingUp
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ServiceMetrics {
  service: string;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  responseTime: number;
}

interface MetricHistory {
  timestamp: string;
  cpu: number;
  memory: number;
  responseTime: number;
}

const ServiceHealthMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<ServiceMetrics[]>([
    {
      service: 'API Gateway',
      cpu: 35,
      memory: 67,
      disk: 45,
      network: 23,
      status: 'healthy',
      uptime: 99.9,
      responseTime: 120
    },
    {
      service: 'Competitor Analysis',
      cpu: 78,
      memory: 82,
      disk: 34,
      network: 45,
      status: 'warning',
      uptime: 98.5,
      responseTime: 340
    },
    {
      service: 'Code Embeddings',
      cpu: 22,
      memory: 41,
      disk: 28,
      network: 12,
      status: 'healthy',
      uptime: 99.8,
      responseTime: 89
    },
    {
      service: 'Database',
      cpu: 45,
      memory: 73,
      disk: 89,
      network: 34,
      status: 'warning',
      uptime: 99.2,
      responseTime: 156
    }
  ]);

  const [historicalData, setHistoricalData] = useState<MetricHistory[]>([
    { timestamp: '12:00', cpu: 30, memory: 65, responseTime: 120 },
    { timestamp: '12:15', cpu: 35, memory: 68, responseTime: 115 },
    { timestamp: '12:30', cpu: 42, memory: 72, responseTime: 130 },
    { timestamp: '12:45', cpu: 38, memory: 70, responseTime: 125 },
    { timestamp: '13:00', cpu: 41, memory: 75, responseTime: 140 },
    { timestamp: '13:15', cpu: 45, memory: 78, responseTime: 135 },
  ]);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshMetrics = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate metric updates
    setMetrics(prev => prev.map(metric => ({
      ...metric,
      cpu: Math.max(10, Math.min(90, metric.cpu + (Math.random() - 0.5) * 20)),
      memory: Math.max(20, Math.min(95, metric.memory + (Math.random() - 0.5) * 15)),
      responseTime: Math.max(50, Math.min(500, metric.responseTime + (Math.random() - 0.5) * 100))
    })));

    setIsRefreshing(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Healthy</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><AlertTriangle className="h-3 w-3 mr-1" />Warning</Badge>;
      case 'critical':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Critical</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getProgressColor = (value: number) => {
    if (value < 50) return 'bg-green-500';
    if (value < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const timestamp = now.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      });

      setHistoricalData(prev => {
        const newData = [...prev.slice(-5), {
          timestamp,
          cpu: metrics[0]?.cpu || 30,
          memory: metrics[0]?.memory || 60,
          responseTime: metrics[0]?.responseTime || 120
        }];
        return newData;
      });
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [metrics]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Service Health Monitor</h2>
        </div>
        <Button onClick={refreshMetrics} disabled={isRefreshing} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* System Overview */}
      <Card>
        <CardHeader>
          <CardTitle>System Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="cpu" 
                stroke="#8884d8" 
                strokeWidth={2}
                name="CPU %" 
              />
              <Line 
                type="monotone" 
                dataKey="memory" 
                stroke="#82ca9d" 
                strokeWidth={2}
                name="Memory %" 
              />
              <Line 
                type="monotone" 
                dataKey="responseTime" 
                stroke="#ffc658" 
                strokeWidth={2}
                name="Response Time (ms)" 
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Service Metrics */}
      <div className="grid gap-6">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  <CardTitle className="text-lg">{metric.service}</CardTitle>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Uptime</p>
                    <p className="font-medium">{metric.uptime}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Response</p>
                    <p className="font-medium">{metric.responseTime}ms</p>
                  </div>
                  {getStatusBadge(metric.status)}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">CPU</span>
                    <span className="text-sm text-muted-foreground ml-auto">{metric.cpu}%</span>
                  </div>
                  <Progress value={metric.cpu} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MemoryStick className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Memory</span>
                    <span className="text-sm text-muted-foreground ml-auto">{metric.memory}%</span>
                  </div>
                  <Progress value={metric.memory} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Disk</span>
                    <span className="text-sm text-muted-foreground ml-auto">{metric.disk}%</span>
                  </div>
                  <Progress value={metric.disk} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <NetworkIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Network</span>
                    <span className="text-sm text-muted-foreground ml-auto">{metric.network}%</span>
                  </div>
                  <Progress value={metric.network} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alerts & Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 border rounded-lg bg-yellow-50">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div className="flex-1">
                <p className="font-medium">High Memory Usage</p>
                <p className="text-sm text-muted-foreground">
                  Competitor Analysis service memory usage above 80%
                </p>
              </div>
              <span className="text-sm text-muted-foreground">2 min ago</span>
            </div>

            <div className="flex items-center gap-3 p-3 border rounded-lg bg-green-50">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div className="flex-1">
                <p className="font-medium">Service Recovered</p>
                <p className="text-sm text-muted-foreground">
                  Database connection restored successfully
                </p>
              </div>
              <span className="text-sm text-muted-foreground">5 min ago</span>
            </div>

            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <p className="font-medium">Performance Improvement</p>
                <p className="text-sm text-muted-foreground">
                  API response times improved by 15%
                </p>
              </div>
              <span className="text-sm text-muted-foreground">10 min ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceHealthMonitor;