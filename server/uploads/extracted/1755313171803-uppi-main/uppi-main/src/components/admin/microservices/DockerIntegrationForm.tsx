import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Container, Loader2, Play, Download, Upload } from 'lucide-react';

const DockerIntegrationForm: React.FC = () => {
  const [isDeploying, setIsDeploying] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [formData, setFormData] = useState({
    image: '',
    tag: 'latest',
    containerName: '',
    port: '',
    environment: '',
    volumes: '',
    command: ''
  });

  const [containers, setContainers] = useState([
    {
      id: 'container-1',
      name: 'web-api',
      image: 'node:18-alpine',
      status: 'running',
      port: '3000:3000',
      created: '2 hours ago'
    },
    {
      id: 'container-2', 
      name: 'redis-cache',
      image: 'redis:7-alpine',
      status: 'running',
      port: '6379:6379',
      created: '1 day ago'
    }
  ]);

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.image || !formData.containerName) {
      toast({
        title: "Validation Error",
        description: "Please fill in the required fields",
        variant: "destructive",
      });
      return;
    }

    setIsDeploying(true);

    try {
      // Simulate container deployment
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const newContainer = {
        id: `container-${Date.now()}`,
        name: formData.containerName,
        image: `${formData.image}:${formData.tag}`,
        status: 'running' as const,
        port: formData.port || 'none',
        created: 'just now'
      };

      setContainers(prev => [newContainer, ...prev]);
      
      toast({
        title: "Success",
        description: `Container ${formData.containerName} deployed successfully`,
      });
      
      // Reset form
      setFormData({
        image: '',
        tag: 'latest',
        containerName: '',
        port: '',
        environment: '',
        volumes: '',
        command: ''
      });
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to deploy container",
        variant: "destructive",
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const handlePullImage = async () => {
    if (!formData.image) {
      toast({
        title: "Validation Error",
        description: "Please enter an image name",
        variant: "destructive",
      });
      return;
    }

    setIsPulling(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({
        title: "Success",
        description: `Image ${formData.image}:${formData.tag} pulled successfully`,
      });
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to pull image",
        variant: "destructive",
      });
    } finally {
      setIsPulling(false);
    }
  };

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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Container className="h-5 w-5" />
            Docker Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleDeploy} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="image">Docker Image *</Label>
                <Input 
                  id="image" 
                  placeholder="nginx, node, redis, etc."
                  value={formData.image}
                  onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                  disabled={isDeploying}
                  required
                />
              </div>
              <div>
                <Label htmlFor="tag">Tag</Label>
                <Input 
                  id="tag" 
                  placeholder="latest, v1.0, alpine"
                  value={formData.tag}
                  onChange={(e) => setFormData(prev => ({ ...prev, tag: e.target.value }))}
                  disabled={isDeploying}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="containerName">Container Name *</Label>
                <Input 
                  id="containerName" 
                  placeholder="my-app-container"
                  value={formData.containerName}
                  onChange={(e) => setFormData(prev => ({ ...prev, containerName: e.target.value }))}
                  disabled={isDeploying}
                  required
                />
              </div>
              <div>
                <Label htmlFor="port">Port Mapping</Label>
                <Input 
                  id="port" 
                  placeholder="8080:80"
                  value={formData.port}
                  onChange={(e) => setFormData(prev => ({ ...prev, port: e.target.value }))}
                  disabled={isDeploying}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="environment">Environment Variables</Label>
              <Textarea 
                id="environment" 
                placeholder="NODE_ENV=production&#10;API_KEY=your-key"
                value={formData.environment}
                onChange={(e) => setFormData(prev => ({ ...prev, environment: e.target.value }))}
                disabled={isDeploying}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="volumes">Volume Mounts</Label>
              <Textarea 
                id="volumes" 
                placeholder="/host/path:/container/path&#10;data-volume:/app/data"
                value={formData.volumes}
                onChange={(e) => setFormData(prev => ({ ...prev, volumes: e.target.value }))}
                disabled={isDeploying}
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="command">Custom Command</Label>
              <Input 
                id="command" 
                placeholder="npm start, python app.py, etc."
                value={formData.command}
                onChange={(e) => setFormData(prev => ({ ...prev, command: e.target.value }))}
                disabled={isDeploying}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handlePullImage}
                disabled={isPulling || isDeploying}
                className="flex-1"
              >
                {isPulling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Pulling...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Pull Image
                  </>
                )}
              </Button>
              
              <Button 
                type="submit" 
                disabled={isDeploying || isPulling}
                className="flex-1"
              >
                {isDeploying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deploying...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Deploy Container
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Running Containers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {containers.map((container) => (
              <div key={container.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{container.name}</span>
                    <Badge variant={getStatusColor(container.status)}>
                      {container.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {container.image} • Port: {container.port} • Created: {container.created}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">Stop</Button>
                  <Button size="sm" variant="outline">Logs</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DockerIntegrationForm;