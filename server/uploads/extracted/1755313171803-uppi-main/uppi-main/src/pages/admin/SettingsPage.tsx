
import React, { useState, useCallback } from 'react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { Settings } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { devTools } from '@/utils/devTools';
import { toast } from '@/hooks/use-toast';
import { FeatureFlagManager } from '@/components/admin/FeatureFlagManager';
const SettingsAdminPage: React.FC = () => {
  /** Sync debug mode with global devTools state */
  const [debugEnabled, setDebugEnabled] = useState<boolean>(devTools.isEnabled());

  /** Toggle dev tools and dev error notifications */
  const handleDebugToggle = useCallback((enabled: boolean) => {
    devTools.updateState({ isEnabled: enabled });
    setDebugEnabled(enabled);
    toast({
      title: enabled ? 'Debug mode enabled' : 'Debug mode disabled',
      description: enabled
        ? 'Dev tools and error notifications are now active.'
        : 'Dev tools and error notifications are now silenced.',
    });
  }, []);

  /** Clear application caches: localStorage, sessionStorage, and Cache Storage */
  const handleClearCache = useCallback(async () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      toast({ title: 'Cache cleared', description: 'Local and browser caches have been cleared.' });
    } catch (error) {
      toast({
        title: 'Cache clear failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  }, []);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Admin Settings"
        description="Configure platform settings and defaults"
        icon={<Settings className="h-6 w-6" />}
      />
      
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
          <TabsTrigger value="features">Feature Flags</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Manage platform-wide settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="platform-name">Platform Name</Label>
                <Input id="platform-name" defaultValue="uppi.ai" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="admin-email">Admin Email</Label>
                <Input id="admin-email" defaultValue="admin@uppi.ai" />
              </div>
              
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
                <Switch id="maintenance-mode" />
              </div>
            </CardContent>
            <CardFooter>
              <Button>Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Configure security options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="two-factor">Require Two-Factor Authentication for Admins</Label>
                <Switch id="two-factor" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="session-timeout">Session Timeout (30 minutes)</Label>
                <Switch id="session-timeout" />
              </div>
              
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="audit-logging">Enable Audit Logging</Label>
                <Switch id="audit-logging" defaultChecked />
              </div>
            </CardContent>
            <CardFooter>
              <Button>Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>API Settings</CardTitle>
              <CardDescription>Configure API endpoints and access</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="api-rate-limiting">Enable Rate Limiting</Label>
                <Switch id="api-rate-limiting" defaultChecked />
              </div>
            </CardContent>
            <CardFooter>
              <Button>Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle>Feature Flags</CardTitle>
              <CardDescription>Toggle features globally or by organization/user scope</CardDescription>
            </CardHeader>
            <CardContent>
              <FeatureFlagManager />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="advanced">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>Advanced configuration options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
<Label htmlFor="debug-mode">Enable Debug Mode</Label>
                <Switch id="debug-mode" checked={debugEnabled} onCheckedChange={handleDebugToggle} />
              </div>
              
              <div className="flex items-center justify-between space-x-2">
<Label htmlFor="cache-clear">Clear Application Cache</Label>
                <Button variant="outline" size="sm" onClick={handleClearCache}>Clear Cache</Button>
              </div>
            </CardContent>
            <CardFooter>
              <Button>Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsAdminPage;
