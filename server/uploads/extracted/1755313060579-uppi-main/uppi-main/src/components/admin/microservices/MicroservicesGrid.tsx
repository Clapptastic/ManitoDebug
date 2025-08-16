import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMicroservices } from '@/hooks/admin/useMicroservices';
import { Play, Square, MoreVertical, Activity, Clock, Cpu } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const MicroservicesGrid: React.FC = () => {
  const { microservices, isLoading, removeMicroservice, updateMicroservice } = useMicroservices();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'default';
      case 'stopped':
        return 'secondary';
      case 'error':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Activity className="h-3 w-3" />;
      case 'stopped':
        return <Square className="h-3 w-3" />;
      case 'error':
        return <Clock className="h-3 w-3" />;
      default:
        return <Square className="h-3 w-3" />;
    }
  };

  const handleStart = async (id: string) => {
    await updateMicroservice(id, { status: 'running' });
  };

  const handleStop = async (id: string) => {
    await updateMicroservice(id, { status: 'stopped' });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this microservice?')) {
      await removeMicroservice(id);
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded w-1/2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (microservices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">No Services</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No microservices configured yet. Add your first service to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {microservices.map((service) => (
        <Card key={service.id}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{service.name}</CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {service.status === 'running' ? (
                  <DropdownMenuItem onClick={() => handleStop(service.id)}>
                    <Square className="mr-2 h-4 w-4" />
                    Stop
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => handleStart(service.id)}>
                    <Play className="mr-2 h-4 w-4" />
                    Start
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  onClick={() => handleDelete(service.id)}
                  className="text-destructive"
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant={getStatusColor(service.status)} className="flex items-center gap-1">
                  {getStatusIcon(service.status)}
                  {service.status}
                </Badge>
                <span className="text-sm text-muted-foreground">v{service.version}</span>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Port:</span>
                  <span>{service.port}</span>
                </div>
                {service.is_active !== undefined && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Active:</span>
                    <Badge variant={service.is_active ? "default" : "secondary"} className="text-xs">
                      {service.is_active ? "Yes" : "No"}
                    </Badge>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant={service.status === 'running' ? "destructive" : "default"}
                  onClick={() => service.status === 'running' ? handleStop(service.id) : handleStart(service.id)}
                  className="flex-1"
                >
                  {service.status === 'running' ? (
                    <>
                      <Square className="h-3 w-3 mr-1" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Play className="h-3 w-3 mr-1" />
                      Start
                    </>
                  )}
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  <Cpu className="h-3 w-3 mr-1" />
                  Monitor
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MicroservicesGrid;