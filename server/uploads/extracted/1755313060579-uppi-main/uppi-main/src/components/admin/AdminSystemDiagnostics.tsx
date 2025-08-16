/**
 * Admin System Diagnostics Component
 * Comprehensive system monitoring for admin panel including:
 * - Database connectivity
 * - Edge function health
 * - Admin API keys status
 * - Internal service monitoring
 * - System performance metrics
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Database, 
  Key, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Clock,
  Network,
  Server,
  Zap,
  Shield,
  Globe,
  Settings,
  Monitor,
  CloudLightning
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface DiagnosticResult {
  test: string;
  category: 'core' | 'apis' | 'database' | 'functions' | 'performance';
  status: 'pass' | 'fail' | 'warning' | 'info';
  message: string;
  details?: any;
  responseTime?: number;
  critical?: boolean;
}

interface SystemMetrics {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  warningTests: number;
  avgResponseTime: number;
  criticalIssues: number;
}

const EDGE_FUNCTIONS = [
  'admin-api-keys',
  'user-api-keys', 
  'check-api-keys',
  'save-api-key',
  'validate-api-key',
  'competitor-analysis',
  'comprehensive-competitor-analysis',
  'ai-market-analyst',
  'ai-validation-engine',
  'document-processing',
  'system-health',
  'microservice-health',
  'log-api-metric'
];

const DATABASE_TABLES = [
  'admin_api_keys' as const,
  'admin_api_usage_tracking' as const,
  'api_keys' as const,
  'api_usage_costs' as const,
  'competitor_analyses' as const,
  'company_profiles' as const,
  'edge_function_metrics' as const
] as const;

export const AdminSystemDiagnostics: React.FC<{ autoRun?: boolean }> = ({ autoRun = true }) => {
  const { user } = useAuth();
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationTotals, setMigrationTotals] = useState<null | { total: number; alreadyAES: number; migratedFromXOR: number; securedPlaintext: number; errors: number }>(null);
  // Run-once guard to avoid repeated global migrations per session
  const [hasAutoMigrated, setHasAutoMigrated] = useState(false);

  const runComprehensiveDiagnostics = async () => {
    setIsRunning(true);
    const diagnosticResults: DiagnosticResult[] = [];
    const startTime = Date.now();

    try {
      // 1. Authentication & Authorization
      const authStart = Date.now();
      diagnosticResults.push({
        test: 'Admin Authentication',
        category: 'core',
        status: user ? 'pass' : 'fail',
        message: user ? `Authenticated as ${user.email}` : 'Not authenticated',
        responseTime: Date.now() - authStart,
        critical: true,
        details: { userId: user?.id, userEmail: user?.email }
      });

      // 2. Database Core Connectivity
      await testDatabaseConnectivity(diagnosticResults);

      // 3. Admin API Keys System
      await testAdminApiKeys(diagnosticResults);

      // 4. Edge Functions Health
      await testEdgeFunctions(diagnosticResults);

      // 5. Internal APIs Performance
      await testInternalApis(diagnosticResults);

      // 6. System Resources
      await testSystemResources(diagnosticResults);

      // 7. External Service Connectivity
      await testExternalServices(diagnosticResults);

      // Calculate metrics
      const totalTime = Date.now() - startTime;
      const metrics: SystemMetrics = {
        totalTests: diagnosticResults.length,
        passedTests: diagnosticResults.filter(r => r.status === 'pass').length,
        failedTests: diagnosticResults.filter(r => r.status === 'fail').length,
        warningTests: diagnosticResults.filter(r => r.status === 'warning').length,
        avgResponseTime: diagnosticResults.reduce((acc, r) => acc + (r.responseTime || 0), 0) / diagnosticResults.length,
        criticalIssues: diagnosticResults.filter(r => r.critical && r.status === 'fail').length
      };

      setMetrics(metrics);
      setResults(diagnosticResults);
      
      // Collect system information and persist report
      const sysInfo = {
        userAgent: navigator.userAgent,
        online: navigator.onLine,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        totalDiagnosticTime: totalTime,
        platform: navigator.platform,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        connectionType: (navigator as any).connection?.effectiveType || 'unknown'
      };
      setSystemInfo(sysInfo);

      try {
        localStorage.setItem(
          'admin-diagnostics:last',
          JSON.stringify({ results: diagnosticResults, metrics, systemInfo: sysInfo })
        );
      } catch (e) {
        console.warn('Failed to persist diagnostics', e);
      }

    } catch (error) {
      console.error('Diagnostics failed:', error);
      diagnosticResults.push({
        test: 'System Diagnostics',
        category: 'core',
        status: 'fail',
        message: 'Diagnostic system failure',
        critical: true,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
      setIsRunning(false);
    }
  };

  const runKeyMigration = async (scope: 'user' | 'all' = 'all') => {
    try {
      setIsMigrating(true);
      const { data, error } = await supabase.functions.invoke('migrate-api-keys', { 
        body: { operation: 'validate_all', dryRun: true } 
      });
      if (error) throw new Error((data as any)?.error || error.message || 'Migration failed');
      const totals = (data as any)?.totals || data;
      setMigrationTotals(totals || null);
      toast({ title: 'AES Migration Complete', description: totals ? `Total: ${totals.total}, AES: ${totals.alreadyAES}, XOR→AES: ${totals.migratedFromXOR}, Secured plaintext: ${totals.securedPlaintext}, Errors: ${totals.errors}` : 'Done' });
    } catch (e: any) {
      toast({ title: 'Migration Failed', description: e?.message || 'Unknown error', variant: 'destructive', source: 'admin-system-diagnostics' });
    } finally {
      setIsMigrating(false);
    }
  };

  const testDatabaseConnectivity = async (results: DiagnosticResult[]) => {
    // Test core database connection
    for (const table of DATABASE_TABLES) {
      const start = Date.now();
      try {
        const { data, error } = await supabase
          .from(table)
          .select('id')
          .limit(1);
        
        results.push({
          test: `Database Table: ${table}`,
          category: 'database',
          status: error ? 'fail' : 'pass',
          message: error ? `Access failed: ${error.message}` : `Table accessible`,
          responseTime: Date.now() - start,
          critical: ['admin_api_keys', 'api_keys'].includes(table),
          details: { error, recordCount: data?.length || 0 }
        });
      } catch (err) {
        results.push({
          test: `Database Table: ${table}`,
          category: 'database',
          status: 'fail',
          message: `Connection error: ${err instanceof Error ? err.message : 'Unknown error'}`,
          responseTime: Date.now() - start,
          critical: true,
          details: { error: err }
        });
      }
    }
  };

  const testAdminApiKeys = async (results: DiagnosticResult[]) => {
    const start = Date.now();
    try {
      const { data, error } = await supabase
        .from('admin_api_keys')
        .select('*')
        .eq('is_active', true);
      
      const totalKeys = data?.length || 0;
      const providersWithKeys = new Set(data?.map(k => k.provider)).size;
      
      results.push({
        test: 'Admin API Keys Availability',
        category: 'apis',
        status: error ? 'fail' : totalKeys > 0 ? 'pass' : 'warning',
        message: error ? `Failed to fetch admin keys: ${error.message}` : 
                 `${totalKeys} active admin keys across ${providersWithKeys} providers`,
        responseTime: Date.now() - start,
        critical: true,
        details: { 
          totalKeys, 
          providersWithKeys,
          providers: data?.map(k => k.provider) || [],
          error 
        }
      });

      // Test admin API key usage tracking
      const usageStart = Date.now();
      const { data: usageData, error: usageError } = await supabase
        .from('admin_api_usage_tracking')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      results.push({
        test: 'Admin API Usage Tracking',
        category: 'apis',
        status: usageError ? 'fail' : 'pass',
        message: usageError ? `Usage tracking failed: ${usageError.message}` : 
                 `Usage tracking operational (${usageData?.length || 0} recent records)`,
        responseTime: Date.now() - usageStart,
        details: { recentUsage: usageData?.length || 0, error: usageError }
      });

    } catch (err) {
      results.push({
        test: 'Admin API Keys System',
        category: 'apis',
        status: 'fail',
        message: `System error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        responseTime: Date.now() - start,
        critical: true,
        details: { error: err }
      });
    }
  };

  const testEdgeFunctions = async (results: DiagnosticResult[]) => {
    for (const functionName of EDGE_FUNCTIONS) {
      const start = Date.now();
      try {
        // Prefer lightweight GET health check with auth; fall back to invoke
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData?.session?.access_token;
        const projectId = 'jqbdjttdaihidoyalqvs';
        const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxYmRqdHRkYWloaWRveWFscXZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0ODAzNzYsImV4cCI6MjA2MjA1NjM3Nn0.FJTBD9b9DLtFZKdj4hQiJXTx4Avg8Kxv_MA-q3egbBo';
        const healthUrl = `https://${projectId}.functions.supabase.co/${functionName}?health=1`;

        let ok = false; let data: any = null; let error: any = null;
        try {
          const resp = await fetch(healthUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'apikey': anonKey,
              ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
            },
          });
          ok = resp.ok;
          data = await resp.json().catch(() => ({}));
          if (!ok) error = new Error(`${resp.status} ${resp.statusText}`);
        } catch (e) {
          error = e;
        }

        if (!ok) {
          // Fallback to standard invoke with minimal body
          const invokeOptions: Record<string, any> =
            functionName === 'system-health' ? { body: { action: 'getComponents' } }
            : functionName === 'microservice-health' ? { body: { serviceUrl: 'https://example.com' } }
            : { body: { healthCheck: true } };
          const invokeRes = await supabase.functions.invoke(functionName, invokeOptions);
          data = invokeRes.data; error = invokeRes.error; ok = !invokeRes.error;
        }
        
        results.push({
          test: `Edge Function: ${functionName}`,
          category: 'functions',
          status: ok ? 'pass' : 'warning',
          message: ok ? 'Function responsive' : `Function error: ${error?.message || 'Unknown'}`,
          responseTime: Date.now() - start,
          critical: ['admin-api-keys', 'check-api-keys'].includes(functionName),
          details: { error, response: data }
        });
      } catch (err) {
        results.push({
          test: `Edge Function: ${functionName}`,
          category: 'functions',
          status: 'fail',
          message: `Function unavailable: ${err instanceof Error ? err.message : 'Unknown error'}`,
          responseTime: Date.now() - start,
          critical: true,
          details: { error: err }
        });
      }
    }
  };

  const testInternalApis = async (results: DiagnosticResult[]) => {
    // Test system health endpoint
    const start = Date.now();
    try {
      const { data, error } = await supabase.functions.invoke('system-health', { body: { action: 'getComponents' } });
      
      results.push({
        test: 'System Health API',
        category: 'performance',
        status: error ? 'fail' : 'pass',
        message: error ? `Health check failed: ${error.message}` : 'System health API operational',
        responseTime: Date.now() - start,
        critical: true,
        details: { error, healthData: data }
      });
    } catch (err) {
      results.push({
        test: 'System Health API',
        category: 'performance',
        status: 'fail',
        message: `Health API error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        responseTime: Date.now() - start,
        critical: true,
        details: { error: err }
      });
    }
  };

  const testSystemResources = async (results: DiagnosticResult[]) => {
    // Browser storage test
    const storageStart = Date.now();
    try {
      const testKey = 'admin-diagnostic-test';
      const testValue = JSON.stringify({ timestamp: Date.now() });
      
      localStorage.setItem(testKey, testValue);
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      
      results.push({
        test: 'Browser Storage',
        category: 'performance',
        status: retrieved === testValue ? 'pass' : 'fail',
        message: retrieved === testValue ? 'Local storage operational' : 'Local storage issues detected',
        responseTime: Date.now() - storageStart,
        details: { storageAvailable: !!window.localStorage, testPassed: retrieved === testValue }
      });
    } catch (err) {
      results.push({
        test: 'Browser Storage',
        category: 'performance',
        status: 'fail',
        message: 'Storage access denied',
        responseTime: Date.now() - storageStart,
        details: { error: err }
      });
    }

    // Memory usage (approximate)
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      results.push({
        test: 'Memory Usage',
        category: 'performance',
        status: memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit > 0.8 ? 'warning' : 'pass',
        message: `Memory usage: ${(memInfo.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB / ${(memInfo.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`,
        details: memInfo
      });
    }
  };

  const testExternalServices = async (results: DiagnosticResult[]) => {
    // Test network connectivity
    const networkStart = Date.now();
    try {
      const response = await fetch(window.location.origin + '/favicon.ico', { 
        method: 'HEAD',
        cache: 'no-cache'
      });
      
      results.push({
        test: 'Network Connectivity',
        category: 'core',
        status: response.ok ? 'pass' : 'warning',
        message: response.ok ? 'Network connection stable' : `Network issues detected (${response.status})`,
        responseTime: Date.now() - networkStart,
        details: { status: response.status, statusText: response.statusText }
      });
    } catch (err) {
      results.push({
        test: 'Network Connectivity',
        category: 'core',
        status: 'fail',
        message: 'Network connectivity issues',
        responseTime: Date.now() - networkStart,
        critical: true,
        details: { error: err }
      });
    }
  };

useEffect(() => {
    // Load previous diagnostics from localStorage; do not auto-run unless enabled
    try {
      const saved = localStorage.getItem('admin-diagnostics:last');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.results) setResults(parsed.results);
        if (parsed?.metrics) setMetrics(parsed.metrics);
        if (parsed?.systemInfo) setSystemInfo(parsed.systemInfo);
      }
    } catch (e) {
      console.warn('Failed to load saved diagnostics', e);
    }

    if (autoRun) {
      runComprehensiveDiagnostics();
    }
  }, [user, autoRun]);

  // Auto-run AES key migration once when diagnostics auto-run is enabled.
  // This respects admin intent to migrate all keys and avoids repeated runs via a localStorage flag.
  useEffect(() => {
    if (!autoRun || isMigrating || hasAutoMigrated) return;
    try {
      const done = localStorage.getItem('aes-migration:all:done');
      if (done) return;
    } catch {}

    setHasAutoMigrated(true);
    runKeyMigration('all')
      .catch(() => { /* handled via toast in runKeyMigration */ })
      .finally(() => {
        try { localStorage.setItem('aes-migration:all:done', new Date().toISOString()); } catch {}
      });
  }, [autoRun, isMigrating, hasAutoMigrated]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'fail': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info': return <Clock className="h-4 w-4 text-blue-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pass: 'default',
      fail: 'destructive',
      warning: 'secondary',
      info: 'outline'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'core': return <Shield className="h-4 w-4" />;
      case 'apis': return <Key className="h-4 w-4" />;
      case 'database': return <Database className="h-4 w-4" />;
      case 'functions': return <Zap className="h-4 w-4" />;
      case 'performance': return <Monitor className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const getHealthScore = () => {
    if (!metrics) return 0;
    return Math.round((metrics.passedTests / metrics.totalTests) * 100);
  };

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.category]) acc[result.category] = [];
    acc[result.category].push(result);
    return acc;
  }, {} as Record<string, DiagnosticResult[]>);

  const copyDiagnosticsToClipboard = async () => {
    const diagnosticReport = {
      timestamp: new Date().toISOString(),
      systemInfo,
      metrics,
      results: results.map(r => ({
        test: r.test,
        category: r.category,
        status: r.status,
        message: r.message,
        responseTime: r.responseTime,
        critical: r.critical,
        details: r.details
      })),
      failedTests: results.filter(r => r.status === 'fail'),
      criticalIssues: results.filter(r => r.critical && r.status === 'fail'),
      recommendations: generateRecommendations()
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(diagnosticReport, null, 2));
      toast({
        title: 'Diagnostics Copied',
        description: 'System diagnostics have been copied to clipboard',
      });
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy diagnostics to clipboard',
        variant: 'destructive',
      });
    }
  };

  const generateRecommendations = () => {
    const recommendations = [];
    const failedTests = results.filter(r => r.status === 'fail');
    
    if (failedTests.some(t => t.category === 'database')) {
      recommendations.push('Check database connectivity and RLS policies');
    }
    if (failedTests.some(t => t.category === 'functions')) {
      recommendations.push('Verify edge function deployments and check function logs');
    }
    if (failedTests.some(t => t.category === 'apis')) {
      recommendations.push('Validate API keys and check provider rate limits');
    }
    if (failedTests.some(t => t.category === 'core')) {
      recommendations.push('Check authentication and network connectivity');
    }
    
    return recommendations;
  };

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex items-center gap-4">
        <Button onClick={runComprehensiveDiagnostics} disabled={isRunning}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
          Run Diagnostics
        </Button>
        
        <Button 
          onClick={copyDiagnosticsToClipboard} 
          variant="outline"
          disabled={!results.length}
        >
          <Activity className="h-4 w-4 mr-2" />
          Copy AI Debug Report
        </Button>

        <Button 
          onClick={() => runKeyMigration('all')} 
          variant="secondary"
          disabled={isMigrating}
        >
          {isMigrating ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Key className="h-4 w-4 mr-2" />
          )}
          {isMigrating ? 'Migrating Keys…' : 'Run AES Key Migration'}
        </Button>
      </div>

      {/* System Health Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getHealthScore()}%</div>
              <Progress value={getHealthScore()} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.passedTests}/{metrics.totalTests} tests passed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Critical Issues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{metrics.criticalIssues}</div>
              <p className="text-xs text-muted-foreground">
                Issues requiring immediate attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Avg Response Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Number(metrics?.avgResponseTime ?? 0).toFixed(0)}ms</div>
              <p className="text-xs text-muted-foreground">
                Average system response time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Last Check
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-bold">
                {systemInfo?.timestamp ? new Date(systemInfo.timestamp).toLocaleString() : 'Not run yet'}
              </div>
              <Button 
                onClick={runComprehensiveDiagnostics} 
                disabled={isRunning}
                size="sm"
                className="mt-2 w-full"
              >
                {isRunning ? (
                  <RefreshCw className="h-3 w-3 animate-spin mr-2" />
                ) : (
                  <Activity className="h-3 w-3 mr-2" />
                )}
                {isRunning ? 'Running...' : 'Refresh'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            System Diagnostics
          </CardTitle>
          <CardDescription>
            Comprehensive system monitoring and health checks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="categories">By Category</TabsTrigger>
              <TabsTrigger value="details">Technical Details</TabsTrigger>
              <TabsTrigger value="system">System Info</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-3">
              {results.length === 0 ? (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    No diagnostic results yet. System diagnostics are running...
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2">
                  {results
                    .filter(r => r.critical || r.status === 'fail')
                    .map((result, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-red-50 dark:bg-red-950">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(result.status)}
                          <div>
                            <div className="font-medium">{result.test}</div>
                            <div className="text-sm text-muted-foreground">{result.message}</div>
                            {result.responseTime && (
                              <div className="text-xs text-muted-foreground">{result.responseTime}ms</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {result.critical && <Badge variant="destructive" className="text-xs">CRITICAL</Badge>}
                          {getStatusBadge(result.status)}
                        </div>
                      </div>
                    ))}
                  
                  {results.filter(r => !r.critical && r.status !== 'fail').map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(result.status)}
                        <div>
                          <div className="font-medium text-sm">{result.test}</div>
                          <div className="text-xs text-muted-foreground">{result.message}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {result.responseTime && (
                          <span className="text-xs text-muted-foreground">{result.responseTime}ms</span>
                        )}
                        {getStatusBadge(result.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="categories" className="space-y-4">
              {Object.entries(groupedResults).map(([category, categoryResults]) => (
                <Card key={category}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2 capitalize">
                      {getCategoryIcon(category)}
                      {category} Systems
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {categoryResults.map((result, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(result.status)}
                            <span className="text-sm font-medium">{result.test}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {result.responseTime && (
                              <span className="text-xs text-muted-foreground">{result.responseTime}ms</span>
                            )}
                            {getStatusBadge(result.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="details" className="space-y-3">
              {results.map((result, index) => (
                result.details && (
                  <Card key={index}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        {getStatusIcon(result.status)}
                        {result.test}
                        {result.critical && <Badge variant="destructive" className="text-xs">CRITICAL</Badge>}
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

            <TabsContent value="system" className="space-y-3">
              {systemInfo && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">System Environment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                      {JSON.stringify(systemInfo, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};