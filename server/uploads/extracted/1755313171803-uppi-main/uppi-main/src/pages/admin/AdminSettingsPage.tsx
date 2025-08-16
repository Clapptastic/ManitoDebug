import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Save, Settings as SettingsIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const AdminSettingsPage: React.FC = () => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    siteName: 'Platform Name',
    siteDescription: 'Platform description and tagline',
    maintenanceMode: false,
    signupsEnabled: true,
    maxFileUploadSize: 10,
    defaultUserRole: 'user',
    sessionTimeout: 24,
    requireEmailVerification: true,
    enableApiRateLimiting: true,
    maxApiRequestsPerMinute: 60,
    enableAuditLogging: true,
    retentionPeriodDays: 90
  });

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Simulate API call to save settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real implementation, you would save to the database:
      // const { error } = await supabase
      //   .from('admin_settings')
      //   .upsert({
      //     settings: settings,
      //     updated_at: new Date().toISOString(),
      //     updated_by: (await supabase.auth.getSession()).data.session?.user.id
      //   });
      
      // if (error) throw error;
      
      toast({
        title: "Settings Saved",
        description: "Your settings have been saved successfully."
      });
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error Saving Settings",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Settings</h1>
          <p className="text-muted-foreground">
            Configure global platform settings
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>Saving...</>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure basic platform settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={settings.siteName}
                    onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="siteDescription">Site Description</Label>
                  <Input
                    id="siteDescription"
                    value={settings.siteDescription}
                    onChange={(e) => setSettings({...settings, siteDescription: e.target.value})}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable maintenance mode to prevent user access
                    </p>
                  </div>
                  <Switch
                    checked={settings.maintenanceMode}
                    onCheckedChange={(checked) => setSettings({...settings, maintenanceMode: checked})}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Signups</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow new users to register
                    </p>
                  </div>
                  <Switch
                    checked={settings.signupsEnabled}
                    onCheckedChange={(checked) => setSettings({...settings, signupsEnabled: checked})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>File Upload Settings</CardTitle>
              <CardDescription>
                Configure file upload limitations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="maxFileUploadSize">Max File Upload Size (MB)</Label>
                  <Input
                    id="maxFileUploadSize"
                    type="number"
                    value={settings.maxFileUploadSize}
                    onChange={(e) => setSettings({...settings, maxFileUploadSize: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Configure security and authentication settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="defaultUserRole">Default User Role</Label>
                  <Input
                    id="defaultUserRole"
                    value={settings.defaultUserRole}
                    onChange={(e) => setSettings({...settings, defaultUserRole: e.target.value})}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (hours)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => setSettings({...settings, sessionTimeout: parseInt(e.target.value) || 0})}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require Email Verification</Label>
                    <p className="text-sm text-muted-foreground">
                      Require users to verify their email before accessing the platform
                    </p>
                  </div>
                  <Switch
                    checked={settings.requireEmailVerification}
                    onCheckedChange={(checked) => setSettings({...settings, requireEmailVerification: checked})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Settings</CardTitle>
              <CardDescription>
                Configure API rate limiting and access
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable API Rate Limiting</Label>
                    <p className="text-sm text-muted-foreground">
                      Limit the number of API requests per user
                    </p>
                  </div>
                  <Switch
                    checked={settings.enableApiRateLimiting}
                    onCheckedChange={(checked) => setSettings({...settings, enableApiRateLimiting: checked})}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="maxApiRequestsPerMinute">Max API Requests Per Minute</Label>
                  <Input
                    id="maxApiRequestsPerMinute"
                    type="number"
                    value={settings.maxApiRequestsPerMinute}
                    onChange={(e) => setSettings({...settings, maxApiRequestsPerMinute: parseInt(e.target.value) || 0})}
                    disabled={!settings.enableApiRateLimiting}
                  />
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>API Documentation</AlertTitle>
                <AlertDescription>
                  API documentation is available at <code>/api/docs</code>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>
                Configure advanced platform settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="warning" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  These settings can significantly impact platform performance and stability.
                  Only make changes if you understand the implications.
                </AlertDescription>
              </Alert>
              
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Audit Logging</Label>
                    <p className="text-sm text-muted-foreground">
                      Log all admin actions for audit purposes
                    </p>
                  </div>
                  <Switch
                    checked={settings.enableAuditLogging}
                    onCheckedChange={(checked) => setSettings({...settings, enableAuditLogging: checked})}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="retentionPeriodDays">Log Retention Period (days)</Label>
                  <Input
                    id="retentionPeriodDays"
                    type="number"
                    value={settings.retentionPeriodDays}
                    onChange={(e) => setSettings({...settings, retentionPeriodDays: parseInt(e.target.value) || 0})}
                    disabled={!settings.enableAuditLogging}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettingsPage;
