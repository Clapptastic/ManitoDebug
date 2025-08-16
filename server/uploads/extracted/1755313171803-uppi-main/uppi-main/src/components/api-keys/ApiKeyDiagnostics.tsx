/**
 * API Key Diagnostics Component
 * Provides detailed debugging information for API key data flow issues
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Database, 
  Key, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Clock,
  Network
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface DiagnosticResult {
  test: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

export const ApiKeyDiagnostics: React.FC = () => {
  const { user } = useAuth();
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [connectionInfo, setConnectionInfo] = useState<any>(null);

  const runDiagnostics = async () => {
    setIsRunning(true);
    const diagnosticResults: DiagnosticResult[] = [];

    try {
      // Test 1: Authentication Check
      diagnosticResults.push({
        test: 'Authentication',
        status: user ? 'pass' : 'fail',
        message: user ? `Authenticated as ${user.email}` : 'Not authenticated',
        details: { userId: user?.id, userEmail: user?.email }
      });

      // Test 2: Database Connection
      try {
        const { data: permData, error: permError } = await supabase
          .rpc('test_auth_and_permissions');
        
        diagnosticResults.push({
          test: 'Database Connection & Permissions',
          status: permError ? 'fail' : 'pass',
          message: permError ? `Connection failed: ${permError.message}` : `Connected. Can read own API keys: ${permData?.[0]?.can_read_api_keys ? 'yes' : 'no'}`,
          details: { error: permError, info: permData }
        });
      } catch (err) {
        diagnosticResults.push({
          test: 'Database Connection',
          status: 'fail',
          message: `Connection error: ${err instanceof Error ? err.message : 'Unknown error'}`,
          details: { error: err }
        });
      }

      // Test 3: API Keys Table Access
      if (user) {
        try {
          const { data, error } = await supabase
            .rpc('manage_api_key', { operation: 'select', user_id_param: user.id });
          
          const keyCount = Array.isArray(data) ? data.length : 0;
          diagnosticResults.push({
            test: 'API Keys Access via RPC',
            status: error ? 'fail' : 'pass',
            message: error ? `Access denied: ${error.message}` : `Found ${keyCount} API keys`,
            details: { 
              error, 
              keyCount,
              keys: Array.isArray(data) ? data.map((k: any) => ({ provider: k.provider, status: k.status, created: k.created_at })) : []
            }
          });
        } catch (err) {
          diagnosticResults.push({
            test: 'API Keys Table Access',
            status: 'fail',
            message: `Table access error: ${err instanceof Error ? err.message : 'Unknown error'}`,
            details: { error: err }
          });
        }
      }

      // Test 4: Edge Functions Access
      try {
        const { data, error } = await supabase.functions.invoke('check-api-keys');
        
        diagnosticResults.push({
          test: 'Edge Functions',
          status: error ? 'fail' : 'pass',
          message: error ? `Function call failed: ${error.message}` : 'Edge function accessible',
          details: { error, response: data }
        });
      } catch (err) {
        diagnosticResults.push({
          test: 'Edge Functions',
          status: 'fail',
          message: `Function error: ${err instanceof Error ? err.message : 'Unknown error'}`,
          details: { error: err }
        });
      }

      // Test 5: Network Connectivity
      try {
        const response = await fetch(window.location.origin + '/health', { method: 'HEAD' });
        diagnosticResults.push({
          test: 'Network Connectivity',
          status: response.ok ? 'pass' : 'warning',
          message: response.ok ? 'Network connection stable' : 'Network issues detected',
          details: { status: response.status, statusText: response.statusText }
        });
      } catch (err) {
        diagnosticResults.push({
          test: 'Network Connectivity',
          status: 'fail',
          message: 'Network connectivity issues',
          details: { error: err }
        });
      }

      // Test 6: Browser Storage
      try {
        localStorage.setItem('diagnostic-test', 'test');
        const retrieved = localStorage.getItem('diagnostic-test');
        localStorage.removeItem('diagnostic-test');
        
        diagnosticResults.push({
          test: 'Browser Storage',
          status: retrieved === 'test' ? 'pass' : 'fail',
          message: retrieved === 'test' ? 'Local storage working' : 'Local storage issues',
          details: { storageAvailable: !!window.localStorage }
        });
      } catch (err) {
        diagnosticResults.push({
          test: 'Browser Storage',
          status: 'fail',
          message: 'Storage access denied',
          details: { error: err }
        });
      }

      setResults(diagnosticResults);
      
      // Collect connection info
      setConnectionInfo({
        userAgent: navigator.userAgent,
        online: navigator.onLine,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL || 'Not set'
      });

    } catch (error) {
      console.error('Diagnostics failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, [user]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'fail': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default: return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pass: 'default',
      fail: 'destructive',
      warning: 'secondary'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          API Key Diagnostics
        </CardTitle>
        <CardDescription>
          Comprehensive debugging information for API key data flow
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Button 
            onClick={runDiagnostics} 
            disabled={isRunning}
            size="sm"
          >
            {isRunning ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Activity className="h-4 w-4 mr-2" />
            )}
            {isRunning ? 'Running...' : 'Run Diagnostics'}
          </Button>
        </div>

        <Tabs defaultValue="results" className="w-full">
          <TabsList>
            <TabsTrigger value="results">Test Results</TabsTrigger>
            <TabsTrigger value="details">Technical Details</TabsTrigger>
            <TabsTrigger value="environment">Environment</TabsTrigger>
          </TabsList>

          <TabsContent value="results" className="space-y-3">
            {results.length === 0 ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  No diagnostic results yet. Click "Run Diagnostics" to start.
                </AlertDescription>
              </Alert>
            ) : (
              results.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(result.status)}
                    <div>
                      <div className="font-medium">{result.test}</div>
                      <div className="text-sm text-muted-foreground">{result.message}</div>
                    </div>
                  </div>
                  {getStatusBadge(result.status)}
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="details" className="space-y-3">
            {results.map((result, index) => (
              result.details && (
                <Card key={index}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      {getStatusIcon(result.status)}
                      {result.test}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )
            ))}
          </TabsContent>

          <TabsContent value="environment" className="space-y-3">
            {connectionInfo && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Environment Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                    {JSON.stringify(connectionInfo, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};