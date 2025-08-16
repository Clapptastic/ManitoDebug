import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Zap, 
  CheckCircle, 
  AlertCircle, 
  Settings, 
  Plus,
  Github,
  Mail,
  Calendar,
  MessageSquare,
  Database,
  Globe
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Integration {
  id: string;
  name: string;
  description: string;
  category: 'productivity' | 'communication' | 'development' | 'analytics' | 'storage';
  icon: React.ElementType;
  status: 'connected' | 'disconnected' | 'error';
  isEnabled: boolean;
  config?: Record<string, any>;
  features: string[];
}

export const IntegrationHub: React.FC = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: 'github',
      name: 'GitHub',
      description: 'Sync repositories and track development progress',
      category: 'development',
      icon: Github,
      status: 'disconnected',
      isEnabled: false,
      features: ['Repository sync', 'Issue tracking', 'PR notifications']
    },
    {
      id: 'email',
      name: 'Email Service',
      description: 'Send automated emails and notifications',
      category: 'communication',
      icon: Mail,
      status: 'connected',
      isEnabled: true,
      features: ['Email campaigns', 'Automated notifications', 'Templates']
    },
    {
      id: 'calendar',
      name: 'Google Calendar',
      description: 'Schedule meetings and manage appointments',
      category: 'productivity',
      icon: Calendar,
      status: 'disconnected',
      isEnabled: false,
      features: ['Event scheduling', 'Meeting reminders', 'Availability sync']
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'Team communication and notifications',
      category: 'communication',
      icon: MessageSquare,
      status: 'error',
      isEnabled: false,
      features: ['Channel notifications', 'Bot commands', 'File sharing']
    },
    {
      id: 'analytics',
      name: 'Analytics Platform',
      description: 'Track user behavior and system metrics',
      category: 'analytics',
      icon: Database,
      status: 'connected',
      isEnabled: true,
      features: ['User tracking', 'Performance metrics', 'Custom events']
    },
    {
      id: 'webhook',
      name: 'Webhooks',
      description: 'Custom webhook integrations',
      category: 'development',
      icon: Globe,
      status: 'connected',
      isEnabled: true,
      features: ['Custom endpoints', 'Event triggers', 'Real-time updates']
    }
  ]);

  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [showConfig, setShowConfig] = useState(false);

  const toggleIntegration = (id: string) => {
    setIntegrations(prev =>
      prev.map(integration =>
        integration.id === id
          ? { ...integration, isEnabled: !integration.isEnabled }
          : integration
      )
    );

    const integration = integrations.find(i => i.id === id);
    toast({
      title: integration?.isEnabled ? 'Integration Disabled' : 'Integration Enabled',
      description: `${integration?.name} has been ${integration?.isEnabled ? 'disabled' : 'enabled'}`,
    });
  };

  const connectIntegration = (id: string) => {
    setIntegrations(prev =>
      prev.map(integration =>
        integration.id === id
          ? { ...integration, status: 'connected', isEnabled: true }
          : integration
      )
    );

    const integration = integrations.find(i => i.id === id);
    toast({
      title: 'Integration Connected',
      description: `${integration?.name} has been connected successfully`,
    });
  };

  const disconnectIntegration = (id: string) => {
    setIntegrations(prev =>
      prev.map(integration =>
        integration.id === id
          ? { ...integration, status: 'disconnected', isEnabled: false }
          : integration
      )
    );

    const integration = integrations.find(i => i.id === id);
    toast({
      title: 'Integration Disconnected',
      description: `${integration?.name} has been disconnected`,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected': return <Badge variant="default" className="bg-green-100 text-green-800">Connected</Badge>;
      case 'error': return <Badge variant="destructive">Error</Badge>;
      default: return <Badge variant="outline">Disconnected</Badge>;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'productivity': return 'bg-blue-100 text-blue-800';
      case 'communication': return 'bg-green-100 text-green-800';
      case 'development': return 'bg-purple-100 text-purple-800';
      case 'analytics': return 'bg-orange-100 text-orange-800';
      case 'storage': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const connectedCount = integrations.filter(i => i.status === 'connected').length;
  const activeCount = integrations.filter(i => i.isEnabled).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Integration Hub</h2>
          <p className="text-muted-foreground">Connect external services and automate workflows</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Custom Integration
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{integrations.length}</div>
                <div className="text-sm text-muted-foreground">Total Integrations</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{connectedCount}</div>
                <div className="text-sm text-muted-foreground">Connected</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">{activeCount}</div>
                <div className="text-sm text-muted-foreground">Active</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {integrations.map((integration) => {
          const Icon = integration.icon;
          return (
            <Card key={integration.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className="h-6 w-6" />
                    <div>
                      <CardTitle className="text-base">{integration.name}</CardTitle>
                      <Badge variant="outline" className={getCategoryColor(integration.category)}>
                        {integration.category}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(integration.status)}
                    <Switch
                      checked={integration.isEnabled}
                      onCheckedChange={() => toggleIntegration(integration.id)}
                      disabled={integration.status !== 'connected'}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {integration.description}
                </p>

                <div className="flex items-center justify-between">
                  {getStatusBadge(integration.status)}
                </div>

                <div>
                  <div className="text-sm font-medium mb-2">Features:</div>
                  <div className="space-y-1">
                    {integration.features.slice(0, 3).map((feature, index) => (
                      <div key={index} className="text-xs text-muted-foreground flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  {integration.status === 'connected' ? (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => {
                          setSelectedIntegration(integration);
                          setShowConfig(true);
                        }}
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Configure
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => disconnectIntegration(integration.id)}
                      >
                        Disconnect
                      </Button>
                    </>
                  ) : (
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => connectIntegration(integration.id)}
                    >
                      Connect
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {showConfig && selectedIntegration && (
        <Card>
          <CardHeader>
            <CardTitle>Configure {selectedIntegration.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="Enter API key"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhook">Webhook URL</Label>
                <Input
                  id="webhook"
                  placeholder="https://your-app.com/webhook"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button>Save Configuration</Button>
              <Button variant="outline" onClick={() => setShowConfig(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};