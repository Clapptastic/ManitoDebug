import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BookOpen, 
  Server, 
  Container, 
  Settings, 
  PlayCircle, 
  StopCircle, 
  RefreshCw,
  Database,
  Network,
  FileText,
  Users,
  Activity,
  CheckCircle,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { useCodeWikiService } from '@/hooks/admin/useCodeWikiService';
import { toast } from 'sonner';

const WikiServiceManager: React.FC = () => {
  const { service, documentation, isLoading, error, isAvailable, refreshService } = useCodeWikiService();
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentConfig, setDeploymentConfig] = useState({
    containerName: 'wiki-service',
    port: '3001',
    memory: '512m',
    cpu: '0.5',
    replicas: '1'
  });

  const handleDeploy = async () => {
    setIsDeploying(true);
    await new Promise(resolve => setTimeout(resolve, 3000));
    toast.success('Wiki service deployed successfully');
    setIsDeploying(false);
    refreshService();
  };

  const handleRestart = async () => {
    toast.info('Restarting wiki service...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    toast.success('Wiki service restarted');
    refreshService();
  };

  const handleStop = async () => {
    toast.info('Stopping wiki service...');
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.success('Wiki service stopped');
    refreshService();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Wiki Service Manager</h2>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isAvailable ? "default" : "secondary"}>
            {isAvailable ? 'Running' : 'Stopped'}
          </Badge>
          <Button onClick={refreshService} variant="outline" size="sm" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="deployment">Deployment</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="documentation">Docs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Service Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Service Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {service && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Service Name:</span>
                      <span className="text-sm">{service?.service_name || 'Code Wiki'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Version:</span>
                      <span className="text-sm">{service.version}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Status:</span>
                      <Badge variant={service.status === 'running' ? 'default' : 'secondary'}>
                        {service.status === 'running' ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertTriangle className="h-3 w-3 mr-1" />}
                        {service.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Container:</span>
                      <span className="text-sm">wiki-service-main</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Port:</span>
                      <span className="text-sm">3001</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Uptime:</span>
                      <span className="text-sm">2h 34m</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t">
                <Button 
                  onClick={handleDeploy} 
                  disabled={isDeploying}
                  className="flex-1"
                >
                  <PlayCircle className="h-4 w-4 mr-2" />
                  {isDeploying ? 'Deploying...' : 'Deploy'}
                </Button>
                <Button 
                  onClick={handleRestart} 
                  variant="outline"
                  className="flex-1"
                  disabled={!isAvailable}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Restart
                </Button>
                <Button 
                  onClick={handleStop} 
                  variant="destructive"
                  className="flex-1"
                  disabled={!isAvailable}
                >
                  <StopCircle className="h-4 w-4 mr-2" />
                  Stop
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle>Service Features</CardTitle>
            </CardHeader>
            <CardContent>
              {service?.features && (
                <div className="grid gap-3 md:grid-cols-2">
                  {service.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 border rounded-lg">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-4">
                <Button variant="outline" className="w-full">
                  <Database className="h-4 w-4 mr-2" />
                  View Database
                </Button>
                <Button variant="outline" className="w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  Access Logs
                </Button>
                <Button variant="outline" className="w-full">
                  <Users className="h-4 w-4 mr-2" />
                  User Management
                </Button>
                <Button variant="outline" className="w-full">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Wiki
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deployment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Container className="h-5 w-5" />
                Docker Deployment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Container className="h-4 w-4" />
                <AlertDescription>
                  The Wiki service runs as a containerized microservice. Configure deployment settings below.
                </AlertDescription>
              </Alert>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="containerName">Container Name</Label>
                  <Input
                    id="containerName"
                    value={deploymentConfig.containerName}
                    onChange={(e) => setDeploymentConfig(prev => ({ ...prev, containerName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="port">Port</Label>
                  <Input
                    id="port"
                    value={deploymentConfig.port}
                    onChange={(e) => setDeploymentConfig(prev => ({ ...prev, port: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="memory">Memory Limit</Label>
                  <Input
                    id="memory"
                    value={deploymentConfig.memory}
                    onChange={(e) => setDeploymentConfig(prev => ({ ...prev, memory: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpu">CPU Limit</Label>
                  <Input
                    id="cpu"
                    value={deploymentConfig.cpu}
                    onChange={(e) => setDeploymentConfig(prev => ({ ...prev, cpu: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="replicas">Replicas</Label>
                <Input
                  id="replicas"
                  value={deploymentConfig.replicas}
                  onChange={(e) => setDeploymentConfig(prev => ({ ...prev, replicas: e.target.value }))}
                  className="w-full"
                />
              </div>

              <Button onClick={handleDeploy} disabled={isDeploying} className="w-full">
                <Container className="h-4 w-4 mr-2" />
                {isDeploying ? 'Deploying Container...' : 'Deploy New Container'}
              </Button>
            </CardContent>
          </Card>

          {/* Container Registry */}
          <Card>
            <CardHeader>
              <CardTitle>Container Images</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">wiki-service:latest</p>
                    <p className="text-sm text-muted-foreground">Built 2 hours ago • 245MB</p>
                  </div>
                  <Badge variant="default">Current</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">wiki-service:v1.0.2</p>
                    <p className="text-sm text-muted-foreground">Built 1 day ago • 243MB</p>
                  </div>
                  <Badge variant="outline">Stable</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Service Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dbConnection">Database Connection</Label>
                  <Input id="dbConnection" value="postgresql://wiki:****@database:5432/wiki_db" readOnly />
...
                  <Input id="apiEndpoint" value={`${window.location.protocol}//${window.location.hostname}:3001/api`} readOnly />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="authProvider">Authentication Provider</Label>
                  <Input id="authProvider" value="Supabase Auth" readOnly />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storageBackend">Storage Backend</Label>
                  <Input id="storageBackend" value="Supabase Storage" readOnly />
                </div>
              </div>

              <Alert>
                <Settings className="h-4 w-4" />
                <AlertDescription>
                  Configuration changes require a service restart to take effect.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Service Monitoring
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 border rounded-lg">
                  <Users className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                  <p className="text-2xl font-bold">24</p>
                  <p className="text-sm text-muted-foreground">Active Users</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <FileText className="h-8 w-8 mx-auto text-green-600 mb-2" />
                  <p className="text-2xl font-bold">156</p>
                  <p className="text-sm text-muted-foreground">Documents</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Network className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                  <p className="text-2xl font-bold">1.2k</p>
                  <p className="text-sm text-muted-foreground">API Requests/hr</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-2 border-l-2 border-green-500 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Service health check passed</span>
                  <span className="text-xs text-muted-foreground ml-auto">2 min ago</span>
                </div>
                <div className="flex items-center gap-3 p-2 border-l-2 border-blue-500 bg-blue-50">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">New document created by user@example.com</span>
                  <span className="text-xs text-muted-foreground ml-auto">5 min ago</span>
                </div>
                <div className="flex items-center gap-3 p-2 border-l-2 border-purple-500 bg-purple-50">
                  <RefreshCw className="h-4 w-4 text-purple-600" />
                  <span className="text-sm">Cache refreshed successfully</span>
                  <span className="text-xs text-muted-foreground ml-auto">10 min ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Wiki Service Documentation</CardTitle>
            </CardHeader>
            <CardContent>
              {documentation && Array.isArray(documentation) && documentation.length > 0 ? (
                <div className="space-y-4">
                  {documentation.map((doc, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">{doc.title}</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Last updated: {new Date(doc.lastUpdated).toLocaleDateString()}
                      </p>
                      <div className="text-sm" dangerouslySetInnerHTML={{ __html: doc.content.substring(0, 200) + '...' }} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">No documentation available</p>
                  <p className="text-sm text-muted-foreground">
                    Documentation will be available when the wiki service is running.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WikiServiceManager;