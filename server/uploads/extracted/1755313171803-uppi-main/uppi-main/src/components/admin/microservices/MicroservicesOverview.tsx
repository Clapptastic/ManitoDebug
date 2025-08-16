import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useMicroservices } from '@/hooks/admin/useMicroservices';
import { useRealtimeMicroservices } from '@/hooks/useRealtimeMicroservices';
import { Activity, Server, Zap, AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';

const MicroservicesOverview: React.FC = () => {
  const { microservices, isLoading, refetch } = useMicroservices();
  const { isConnected } = useRealtimeMicroservices();

  const runningServices = microservices.filter(service => service.status === 'running').length;
  const totalServices = microservices.length;
  const healthyServices = microservices.filter(service => service.status === 'running').length;
  const errorServices = microservices.filter(service => service.status === 'error').length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Services</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalServices}</div>
            <p className="text-xs text-muted-foreground">
              {runningServices} running
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Services</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{runningServices}</div>
            <p className="text-xs text-muted-foreground">
              {totalServices > 0 ? Math.round((runningServices / totalServices) * 100) : 0}% uptime
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Status</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthyServices}</div>
            <p className="text-xs text-muted-foreground">
              healthy services
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{errorServices}</div>
            <p className="text-xs text-muted-foreground">
              services with errors
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>System Health</CardTitle>
            <div className="flex items-center gap-1">
              {isConnected ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-xs text-muted-foreground">
                {isConnected ? 'Live' : 'Offline'}
              </span>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refetch}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Overall Health</span>
                <span className="text-sm text-muted-foreground">
                  {totalServices > 0 ? Math.round((healthyServices / totalServices) * 100) : 100}%
                </span>
              </div>
              <Progress 
                value={totalServices > 0 ? (healthyServices / totalServices) * 100 : 100} 
                className="w-full" 
              />
            </div>

            <div className="flex gap-2">
              <Badge variant={healthyServices > 0 ? "default" : "secondary"}>
                {healthyServices} Healthy
              </Badge>
              <Badge variant={errorServices > 0 ? "destructive" : "secondary"}>
                {errorServices} Errors
              </Badge>
              <Badge variant="secondary">
                {totalServices - runningServices} Stopped
              </Badge>
            </div>

            {totalServices === 0 && (
              <div className="text-center py-8">
                <Server className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No microservices configured yet. Get started by adding your first service.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MicroservicesOverview;