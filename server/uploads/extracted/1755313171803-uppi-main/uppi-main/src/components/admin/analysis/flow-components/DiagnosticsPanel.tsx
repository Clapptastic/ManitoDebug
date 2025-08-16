import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  RefreshCw, 
  Database, 
  Shield, 
  Key, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  Activity
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { User } from '@supabase/supabase-js';

interface DiagnosticResult {
  category: string;
  name: string;
  status: 'success' | 'warning' | 'error' | 'info';
  message: string;
  details?: string;
  timestamp: string;
}

interface DiagnosticsPanelProps {
  user: User | null;
}

export const DiagnosticsPanel: React.FC<DiagnosticsPanelProps> = ({ user }) => {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [loading, setLoading] = useState(false);

  const runDiagnostics = async () => {
    if (!user) return;
    
    setLoading(true);
    const results: DiagnosticResult[] = [];
    const timestamp = new Date().toISOString();

    try {
      // Test 1: Database Connection
      try {
        const { error: dbError } = await supabase.from('profiles').select('id').limit(1);
        results.push({
          category: 'Database',
          name: 'Connection Test',
          status: dbError ? 'error' : 'success',
          message: dbError ? 'Database connection failed' : 'Database connection successful',
          details: dbError?.message,
          timestamp
        });
      } catch (error) {
        results.push({
          category: 'Database',
          name: 'Connection Test',
          status: 'error',
          message: 'Database connection failed',
          details: error instanceof Error ? error.message : 'Unknown error',
          timestamp
        });
      }

      // Test 2: Authentication Status
      try {
        const { data: session } = await supabase.auth.getSession();
        results.push({
          category: 'Authentication',
          name: 'Session Check',
          status: session?.session ? 'success' : 'warning',
          message: session?.session ? 'Valid session found' : 'No active session',
          details: session?.session?.user?.email,
          timestamp
        });
      } catch (error) {
        results.push({
          category: 'Authentication',
          name: 'Session Check',
          status: 'error',
          message: 'Session check failed',
          details: error instanceof Error ? error.message : 'Unknown error',
          timestamp
        });
      }

      // Test 3: RLS Policy Check
      try {
        const { data: policies, error: rlsError } = await supabase
          .rpc('audit_rls_policies');
        
        results.push({
          category: 'Security',
          name: 'RLS Policies',
          status: rlsError ? 'error' : 'success',
          message: rlsError ? 'RLS audit failed' : `Found ${policies?.length || 0} policy groups`,
          details: rlsError?.message,
          timestamp
        });
      } catch (error) {
        results.push({
          category: 'Security',
          name: 'RLS Policies',
          status: 'warning',
          message: 'RLS audit function not available',
          details: 'Function may not be deployed',
          timestamp
        });
      }

      // Test 4: API Keys Check
      try {
        const { data: apiKeys, error: keyError } = await supabase
          .from('api_keys')
          .select('id, provider, status, is_active')
          .eq('user_id', user.id);

        const activeKeys = apiKeys?.filter(k => k.is_active) || [];
        results.push({
          category: 'API Keys',
          name: 'Key Status',
          status: keyError ? 'error' : activeKeys.length > 0 ? 'success' : 'warning',
          message: keyError ? 'API key check failed' : 
                  activeKeys.length > 0 ? `${activeKeys.length} active API keys found` : 'No active API keys',
          details: keyError?.message || activeKeys.map(k => k.provider).join(', '),
          timestamp
        });
      } catch (error) {
        results.push({
          category: 'API Keys',
          name: 'Key Status',
          status: 'error',
          message: 'API key check failed',
          details: error instanceof Error ? error.message : 'Unknown error',
          timestamp
        });
      }

      // Test 5: Edge Function Health
      try {
        const { data, error } = await supabase.functions.invoke('system-health', {
          body: { check: 'basic' }
        });

        results.push({
          category: 'Edge Functions',
          name: 'System Health',
          status: error ? 'error' : 'success',
          message: error ? 'Edge function health check failed' : 'Edge functions responding',
          details: error?.message || JSON.stringify(data),
          timestamp
        });
      } catch (error) {
        results.push({
          category: 'Edge Functions',
          name: 'System Health',
          status: 'warning',
          message: 'Edge function not available',
          details: 'system-health function may not be deployed',
          timestamp
        });
      }

      setDiagnostics(results);
      
      const errorCount = results.filter(r => r.status === 'error').length;
      const warningCount = results.filter(r => r.status === 'warning').length;
      
      if (errorCount > 0) {
        toast({
          title: 'Diagnostics Complete',
          description: `Found ${errorCount} errors and ${warningCount} warnings`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Diagnostics Complete',
          description: warningCount > 0 ? `${warningCount} warnings found` : 'All systems operational',
        });
      }

    } catch (error) {
      console.error('Diagnostics error:', error);
      toast({
        title: 'Diagnostic Error',
        description: 'Failed to run system diagnostics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      default:
        return <Activity className="h-4 w-4 text-info" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'database':
        return <Database className="h-4 w-4" />;
      case 'authentication':
        return <Shield className="h-4 w-4" />;
      case 'api keys':
        return <Key className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const groupedDiagnostics = diagnostics.reduce((groups, diagnostic) => {
    const category = diagnostic.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(diagnostic);
    return groups;
  }, {} as Record<string, DiagnosticResult[]>);

  // Run initial diagnostics
  useEffect(() => {
    if (user) {
      runDiagnostics();
    }
  }, [user]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">System Diagnostics</h3>
          <p className="text-sm text-muted-foreground">
            Comprehensive health check of all system components
          </p>
        </div>
        <Button 
          onClick={runDiagnostics} 
          disabled={loading}
          className="gap-2"
        >
          {loading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>

      {/* Results */}
      {diagnostics.length > 0 && (
        <div className="space-y-4">
          {Object.entries(groupedDiagnostics).map(([category, results]) => (
            <Card key={category}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  {getCategoryIcon(category)}
                  {category}
                  <Badge variant="outline" className="ml-auto">
                    {results.length} checks
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ScrollArea className="max-h-60">
                  <div className="space-y-3">
                    {results.map((result, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {getStatusIcon(result.status)}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-foreground">
                                {result.name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {result.message}
                              </p>
                              {result.details && (
                                <p className="text-xs text-muted-foreground mt-1 font-mono bg-muted/50 px-2 py-1 rounded">
                                  {result.details}
                                </p>
                              )}
                            </div>
                          </div>
                          <Badge 
                            variant={
                              result.status === 'success' ? 'success' :
                              result.status === 'error' ? 'destructive' :
                              result.status === 'warning' ? 'warning' :
                              'secondary'
                            }
                            className="text-xs shrink-0"
                          >
                            {result.status.toUpperCase()}
                          </Badge>
                        </div>
                        {index < results.length - 1 && <Separator />}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {diagnostics.length === 0 && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <Activity className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No diagnostics data available</p>
            <Button onClick={runDiagnostics} className="mt-4 gap-2">
              <RefreshCw className="h-4 w-4" />
              Run Diagnostics
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};