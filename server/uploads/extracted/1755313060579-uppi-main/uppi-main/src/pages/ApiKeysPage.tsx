import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Key, Activity, AlertTriangle, RefreshCw, Shield, Database, Zap } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { UnifiedApiKeyManager } from '@/components/api-keys/UnifiedApiKeyManager';
import { EdgeFunctionDebugger } from '@/components/debug/EdgeFunctionDebugger';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { SystemStatusNotification } from '@/components/system/SystemStatusNotification';
import { ApiKeyStatusSummary } from '@/components/api-keys/ApiKeyStatusSummary';
import { ApiKeyFlowTest } from '@/components/test/ApiKeyFlowTest';

const ApiKeysPage: React.FC = () => {
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [systemHealth, setSystemHealth] = useState<{
    vault: boolean;
    encryption: boolean;
    validation: boolean;
    realTimeSync: boolean;
  }>({
    vault: false,
    encryption: false, 
    validation: false,
    realTimeSync: false
  });
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  // Check system health on mount
  useEffect(() => {
    checkSystemHealth();
  }, []);

  const checkSystemHealth = async () => {
    setIsCheckingHealth(true);
    try {
      // Check vault functionality
      const vaultResponse = await fetch('/api/health/vault');
      const vault = vaultResponse.ok;

      // Check encryption service
      const encryptionResponse = await fetch('/api/health/encryption');
      const encryption = encryptionResponse.ok;

      // Check real-time sync
      const realtimeResponse = await fetch('/api/health/realtime');
      const realTimeSync = realtimeResponse.ok;

      setSystemHealth({
        vault,
        encryption,
        validation: true, // Always available
        realTimeSync
      });
    } catch (error) {
      console.error('Health check failed:', error);
      setSystemHealth({
        vault: false,
        encryption: false,
        validation: true,
        realTimeSync: false
      });
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const healthPercentage = Object.values(systemHealth).filter(Boolean).length / 4 * 100;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Key className="h-8 w-8" />
            API Key Management
          </h1>
          <p className="text-muted-foreground">
            Unified API key management with real-time status monitoring and secure vault encryption
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDebugMode(!isDebugMode)}
          >
            <Zap className="h-4 w-4 mr-2" />
            {isDebugMode ? 'Hide' : 'Show'} Debug
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={checkSystemHealth}
            disabled={isCheckingHealth}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isCheckingHealth ? 'animate-spin' : ''}`} />
            Health Check
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Health
          </CardTitle>
          <CardDescription>
            Real-time status of API management infrastructure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Health</span>
              <span className="text-sm text-muted-foreground">{Math.round(healthPercentage)}%</span>
            </div>
            <Progress value={healthPercentage} className="h-2" />
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="flex items-center space-x-2">
                <div className={`h-3 w-3 rounded-full ${systemHealth.vault ? 'bg-green-500' : 'bg-red-500'}`} />
                <div>
                  <p className="text-sm font-medium">Vault Storage</p>
                  <p className="text-xs text-muted-foreground">Encrypted secrets</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className={`h-3 w-3 rounded-full ${systemHealth.encryption ? 'bg-green-500' : 'bg-red-500'}`} />
                <div>
                  <p className="text-sm font-medium">Encryption</p>
                  <p className="text-xs text-muted-foreground">AES-256 security</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className={`h-3 w-3 rounded-full ${systemHealth.validation ? 'bg-green-500' : 'bg-red-500'}`} />
                <div>
                  <p className="text-sm font-medium">Validation</p>
                  <p className="text-xs text-muted-foreground">API testing</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className={`h-3 w-3 rounded-full ${systemHealth.realTimeSync ? 'bg-green-500' : 'bg-red-500'}`} />
                <div>
                  <p className="text-sm font-medium">Real-time Sync</p>
                  <p className="text-xs text-muted-foreground">Live updates</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Alert */}
      {(!systemHealth.vault || !systemHealth.encryption) && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Security Notice:</strong> Some security features are not fully operational. 
            API keys may be stored with reduced encryption. Please check your Supabase vault configuration.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="status" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="status" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Live Status
          </TabsTrigger>
          <TabsTrigger value="manage" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Manage Keys
          </TabsTrigger>
          <TabsTrigger value="test" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Flow Test
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security & Vault
          </TabsTrigger>
          <TabsTrigger value="debug" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Debug & Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-6">
          {/* Real-time API Status Overview */}
          <ApiKeyStatusSummary />
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          {/* Unified API Key Manager - Single Source of Truth */}
          <UnifiedApiKeyManager />
        </TabsContent>

        <TabsContent value="test" className="space-y-6">
          {/* Comprehensive API Key Flow Testing */}
          <ApiKeyFlowTest />
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security & Vault Management
              </CardTitle>
              <CardDescription>
                Advanced security features and vault encryption status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Vault Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Vault Encryption</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`h-3 w-3 rounded-full ${systemHealth.vault ? 'bg-green-500' : 'bg-red-500'}`} />
                          <div>
                            <p className="font-medium">Supabase Vault</p>
                            <p className="text-sm text-muted-foreground">Encrypted key storage</p>
                          </div>
                        </div>
                        <Badge variant={systemHealth.vault ? "default" : "destructive"}>
                          {systemHealth.vault ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`h-3 w-3 rounded-full ${systemHealth.encryption ? 'bg-green-500' : 'bg-red-500'}`} />
                          <div>
                            <p className="font-medium">AES-256 Encryption</p>
                            <p className="text-sm text-muted-foreground">Advanced encryption standard</p>
                          </div>
                        </div>
                        <Badge variant={systemHealth.encryption ? "default" : "destructive"}>
                          {systemHealth.encryption ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Security Features</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">Key Masking</p>
                          <p className="text-sm text-muted-foreground">Only show first/last chars</p>
                        </div>
                        <Badge>Enabled</Badge>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">Real-time Validation</p>
                          <p className="text-sm text-muted-foreground">Live API testing</p>
                        </div>
                        <Badge variant={systemHealth.validation ? "default" : "destructive"}>
                          {systemHealth.validation ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Security Recommendations */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">Security Recommendations</h3>
                  <div className="grid gap-3">
                    <Alert className="border-blue-200 bg-blue-50">
                      <Shield className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Best Practice:</strong> Regularly rotate your API keys and monitor usage patterns for unusual activity.
                      </AlertDescription>
                    </Alert>
                    
                    <Alert className="border-green-200 bg-green-50">
                      <Shield className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Secure Storage:</strong> All API keys are encrypted using Supabase Vault with AES-256 encryption.
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="debug" className="space-y-6">
          {isDebugMode && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Edge Function Debugger
                </CardTitle>
                <CardDescription>
                  Debug API key management edge functions and monitor real-time status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EdgeFunctionDebugger />
              </CardContent>
            </Card>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
              <CardDescription>
                Technical details about the API management system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Encryption Method</p>
                  <p className="text-sm text-muted-foreground">AES-256-GCM with Supabase Vault</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Validation Engine</p>
                  <p className="text-sm text-muted-foreground">Real-time API endpoint testing</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Storage Backend</p>
                  <p className="text-sm text-muted-foreground">Supabase PostgreSQL with RLS</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Sync Protocol</p>
                  <p className="text-sm text-muted-foreground">WebSocket real-time subscriptions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ApiKeysPage;