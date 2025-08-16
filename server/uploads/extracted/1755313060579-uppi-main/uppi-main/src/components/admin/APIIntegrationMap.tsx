/**
 * API Integration Map Component
 * Shows where each API is integrated throughout the platform
 * and provides monitoring for all sitewide API implementations
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { 
  Network, 
  Database, 
  Zap, 
  Globe, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  ExternalLink,
  Server,
  Key,
  Cloud,
  RefreshCw,
  Activity,
  Clipboard,
  Bug
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useEdgeFunctionsList } from '@/hooks/useEdgeFunctionsList';
import { useApiServicesDiscovery } from '@/hooks/useApiServicesDiscovery';
import { useAuth } from '@/hooks/useAuth';

interface APIIntegration {
  name: string;
  type: 'edge_function' | 'external_api' | 'database' | 'service';
  status: 'operational' | 'degraded' | 'down' | 'unknown';
  integrations: {
    component: string;
    path: string;
    function: string;
    critical: boolean;
    lastTested?: string;
  }[];
  provider?: string;
  dependencies: string[];
  healthCheck?: () => Promise<{ status: string; responseTime: number; error?: string }>;
  lastTested?: string;
  responseTime?: number;
  error?: string;
}

const API_INTEGRATIONS: APIIntegration[] = [
  {
    name: 'Admin API Keys',
    type: 'edge_function',
    status: 'unknown',
    integrations: [
      { component: 'AdminSystemDiagnostics', path: 'src/components/admin/AdminSystemDiagnostics.tsx', function: 'testAdminApiKeys', critical: true },
      { component: 'APIManagementPage', path: 'src/pages/admin/APIManagementPage.tsx', function: 'fetchAdminApiKeys', critical: true }
    ],
    dependencies: ['admin_api_keys', 'admin_api_usage_tracking'],
    healthCheck: async () => {
      const start = Date.now();
      try {
        const { data, error } = await supabase.functions.invoke('admin-api-keys');
        return {
          status: error ? 'degraded' : 'operational',
          responseTime: Date.now() - start,
          error: error?.message
        };
      } catch (err) {
        return {
          status: 'down',
          responseTime: Date.now() - start,
          error: err instanceof Error ? err.message : 'Unknown error'
        };
      }
    }
  },
  {
    name: 'User API Keys',
    type: 'edge_function',
    status: 'unknown',
    integrations: [
      { component: 'ApiKeyDiagnostics', path: 'src/components/api-keys/ApiKeyDiagnostics.tsx', function: 'check-api-keys', critical: true },
      { component: 'APIManagementPage', path: 'src/pages/APIManagementPage.tsx', function: 'fetchApiKeys', critical: true }
    ],
    dependencies: ['api_keys', 'api_usage_costs'],
    healthCheck: async () => {
      const start = Date.now();
      try {
        const { data, error } = await supabase.functions.invoke('check-api-keys');
        return {
          status: error ? 'degraded' : 'operational',
          responseTime: Date.now() - start,
          error: error?.message
        };
      } catch (err) {
        return {
          status: 'down',
          responseTime: Date.now() - start,
          error: err instanceof Error ? err.message : 'Unknown error'
        };
      }
    }
  },
  {
    name: 'Competitor Analysis',
    type: 'edge_function',
    status: 'unknown',
    integrations: [
      { component: 'ComprehensiveAnalysisButton', path: 'src/components/competitor-analysis/ComprehensiveAnalysisButton.tsx', function: 'comprehensive-competitor-analysis', critical: true },
      { component: 'CompetitorAnalysisPage', path: 'src/pages/CompetitorAnalysisPage.tsx', function: 'competitor-analysis', critical: true },
      { component: 'CompetitorAnalysisDebugger', path: 'src/components/testing/CompetitorAnalysisDebugger.tsx', function: 'competitor-analysis', critical: false }
    ],
    dependencies: ['competitor_analyses', 'company_profiles', 'admin_api_keys'],
    healthCheck: async () => {
      const start = Date.now();
      try {
        const { data, error } = await supabase.functions.invoke('competitor-analysis', {
          body: { healthCheck: true }
        });
        return {
          status: error ? 'degraded' : 'operational',
          responseTime: Date.now() - start,
          error: error?.message
        };
      } catch (err) {
        return {
          status: 'down',
          responseTime: Date.now() - start,
          error: err instanceof Error ? err.message : 'Unknown error'
        };
      }
    }
  },
  {
    name: 'AI Market Analyst',
    type: 'edge_function',
    status: 'unknown',
    integrations: [
      { component: 'AIMarketAnalysisApp', path: 'src/components/market-analysis/AIMarketAnalysisApp.tsx', function: 'ai-market-analyst', critical: true },
      { component: 'MarketResearchPage', path: 'src/pages/MarketResearchPage.tsx', function: 'market-data-fetcher', critical: true }
    ],
    dependencies: ['admin_api_keys'],
    provider: 'OpenAI/Anthropic',
    healthCheck: async () => {
      const start = Date.now();
      try {
        const { data, error } = await supabase.functions.invoke('ai-market-analyst', {
          headers: { Authorization: `Bearer ${(await supabase.auth.getSession()).data?.session?.access_token}` },
          body: { 
            userId: 'health-check',
            query: 'health check',
            queryType: 'natural_language'
          }
        });
        return {
          status: error ? 'degraded' : 'operational',
          responseTime: Date.now() - start,
          error: error?.message
        };
      } catch (err) {
        return {
          status: 'down',
          responseTime: Date.now() - start,
          error: err instanceof Error ? err.message : 'Unknown error'
        };
      }
    }
  },
  {
    name: 'AI Validation Engine',
    type: 'edge_function',
    status: 'unknown',
    integrations: [
      { component: 'useAIValidation', path: 'src/hooks/useAIValidation.ts', function: 'ai-validation-engine', critical: true }
    ],
    dependencies: ['ai_validation_logs', 'admin_api_keys'],
    provider: 'OpenAI',
    healthCheck: async () => {
      const start = Date.now();
      try {
        const { data, error } = await supabase.functions.invoke('ai-validation-engine', {
          body: { content: 'test', contentType: 'text' }
        });
        return {
          status: error ? 'degraded' : 'operational',
          responseTime: Date.now() - start,
          error: error?.message
        };
      } catch (err) {
        return {
          status: 'down',
          responseTime: Date.now() - start,
          error: err instanceof Error ? err.message : 'Unknown error'
        };
      }
    }
  },
  {
    name: 'System Health',
    type: 'edge_function',
    status: 'unknown',
    integrations: [
      { component: 'AdminSystemDiagnostics', path: 'src/components/admin/AdminSystemDiagnostics.tsx', function: 'system-health', critical: true },
      { component: 'SystemHealthTabs', path: 'src/components/admin/system/SystemHealthTabs.tsx', function: 'admin-api', critical: true }
    ],
    dependencies: ['edge_function_metrics'],
    healthCheck: async () => {
      const start = Date.now();
      try {
        const { data, error } = await supabase.functions.invoke('system-health', { body: { action: 'getComponents' } });
        return {
          status: error ? 'degraded' : 'operational',
          responseTime: Date.now() - start,
          error: error?.message
        };
      } catch (err) {
        return {
          status: 'down',
          responseTime: Date.now() - start,
          error: err instanceof Error ? err.message : 'Unknown error'
        };
      }
    }
  },
  {
    name: 'AI Chat',
    type: 'edge_function',
    status: 'unknown',
    integrations: [
      { component: 'useAIChat', path: 'src/hooks/useAIChat.ts', function: 'ai-chat', critical: true }
    ],
    dependencies: ['chat_sessions', 'chat_messages', 'admin_api_keys'],
    provider: 'OpenAI',
    healthCheck: async () => {
      const start = Date.now();
      try {
        const { data, error } = await supabase.functions.invoke('ai-chat', {
          body: { healthCheck: true }
        });
        return {
          status: error ? 'degraded' : 'operational',
          responseTime: Date.now() - start,
          error: error?.message
        };
      } catch (err) {
        return {
          status: 'down',
          responseTime: Date.now() - start,
          error: err instanceof Error ? err.message : 'Unknown error'
        };
      }
    }
  },
  {
    name: 'Database Core',
    type: 'database',
    status: 'unknown',
    integrations: [
      { component: 'Supabase Client', path: 'src/integrations/supabase/client.ts', function: 'database operations', critical: true },
      { component: 'All Components', path: 'Global', function: 'CRUD operations', critical: true }
    ],
    dependencies: ['postgresql', 'rls_policies'],
    healthCheck: async () => {
      const start = Date.now();
      try {
        const { data, error } = await supabase.from('admin_api_keys').select('id').limit(1);
        return {
          status: error ? 'down' : 'operational',
          responseTime: Date.now() - start,
          error: error?.message
        };
      } catch (err) {
        return {
          status: 'down',
          responseTime: Date.now() - start,
          error: err instanceof Error ? err.message : 'Unknown error'
        };
      }
    }
  }
];

export const APIIntegrationMap: React.FC = () => {
  const { user } = useAuth();
  // Base integrations (kept for backward compatibility). We'll augment dynamically below.
  const [integrations, setIntegrations] = useState<APIIntegration[]>(API_INTEGRATIONS);
  const [isRunningHealthChecks, setIsRunningHealthChecks] = useState(false);
  const [lastHealthCheck, setLastHealthCheck] = useState<string | null>(null);

  // Dynamic discovery of Edge Functions and internal API services
  const { functions: discoveredEdgeFunctions } = useEdgeFunctionsList();
  const { services: discoveredServices } = useApiServicesDiscovery();

  // Lightweight DB metadata pulled via secure RPC to reflect current schema & policies
  interface DbMeta {
    tables: any[];
    policies: any[];
    functions: any[];
    lastRefreshed?: string;
  }
  const [dbMeta, setDbMeta] = useState<DbMeta>({ tables: [], policies: [], functions: [] });
  const [isDbLoading, setIsDbLoading] = useState(false);

  // Debug report modal state (persist last run until a new one is generated)
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const [debugReport, setDebugReport] = useState<string>('');

  // Per-integration issue modal
  const [isIssueOpen, setIsIssueOpen] = useState(false);
  const [issueReport, setIssueReport] = useState<string>('');

  // Merge static integrations with discovered ones without removing existing functionality
  const computeDynamicIntegrations = useCallback((): APIIntegration[] => {
    const dynamicEdges: APIIntegration[] = discoveredEdgeFunctions.map((fn) => ({
      name: fn,
      type: 'edge_function',
      status: 'unknown',
      integrations: [],
      dependencies: [],
    }));

    const serviceEntries: APIIntegration[] = discoveredServices.map((s) => ({
      name: s.name,
      type: 'service',
      status: 'unknown',
      integrations: [
        { component: s.name, path: s.filePath, function: 'service', critical: false }
      ],
      dependencies: [],
    }));

    const existing = new Set(API_INTEGRATIONS.map((i) => i.name));
    const merged = [
      ...API_INTEGRATIONS,
      ...dynamicEdges.filter((i) => !existing.has(i.name)),
      ...serviceEntries.filter((i) => !existing.has(i.name)),
    ];

    // Keep a stable, readable order
    return merged.sort((a, b) => a.name.localeCompare(b.name));
  }, [discoveredEdgeFunctions, discoveredServices]);

  useEffect(() => {
    setIntegrations(computeDynamicIntegrations());
  }, [computeDynamicIntegrations]);

  // DB metadata refresh using secure RPC helper (returns curated JSON)
  const refreshDbMeta = useCallback(async () => {
    setIsDbLoading(true);
    try {
      const [tablesRes, policiesRes, funcsRes] = await Promise.all([
        supabase.rpc('exec_sql', { sql: 'select * from information_schema.tables' }),
        supabase.rpc('exec_sql', { sql: 'select * from pg_policies' }),
        supabase.rpc('exec_sql', { sql: 'select * from information_schema.routines' }),
      ]);

      const tablesResult = (tablesRes.data as any)?.[0]?.result as any;
      const policiesResult = (policiesRes.data as any)?.[0]?.result as any;
      const functionsResult = (funcsRes.data as any)?.[0]?.result as any;

      const tables = tablesResult?.tables ?? [];
      const policies = policiesResult?.policies ?? [];
      const functions = functionsResult?.functions ?? [];

      setDbMeta({ tables, policies, functions, lastRefreshed: new Date().toISOString() });
    } catch (e) {
      toast({ title: 'DB metadata error', description: e instanceof Error ? e.message : 'Failed to load DB metadata', variant: 'destructive' });
    } finally {
      setIsDbLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial load of DB metadata
    refreshDbMeta();
    // Load cached debug report if present
    const cached = localStorage.getItem('admin:apiIntegrationDebugReport');
    if (cached) setDebugReport(cached);
  }, [refreshDbMeta]);

  // Run health checks for all current integrations
  const runHealthChecks = async () => {
    setIsRunningHealthChecks(true);
    try {
      const updatedIntegrations = await Promise.all(
        integrations.map(async (integration) => {
          if (integration.healthCheck) {
            try {
              const health = await integration.healthCheck();
              return {
                ...integration,
                status: health.status as typeof integration.status,
                lastTested: new Date().toISOString(),
                responseTime: health.responseTime,
                error: health.error,
              };
            } catch (err) {
              return {
                ...integration,
                status: 'down' as const,
                lastTested: new Date().toISOString(),
                error: err instanceof Error ? err.message : 'Health check failed',
              };
            }
          }
          return integration;
        })
      );

      setIntegrations(updatedIntegrations);
      setLastHealthCheck(new Date().toISOString());
      toast({ title: 'Health Checks Complete', description: `Tested ${updatedIntegrations.length} API integrations` });
    } catch (err) {
      toast({ title: 'Health Check Failed', description: 'Error running API health checks', variant: 'destructive' });
    } finally {
      setIsRunningHealthChecks(false);
    }
  };

  useEffect(() => {
    runHealthChecks();
  }, []);

  // Generate a comprehensive admin debug report and persist it until the next run
  const generateDebugReport = useCallback(async () => {
    try {
      const [systemHealth, authCtx, metrics] = await Promise.all([
        supabase.rpc('get_system_health_overview'),
        supabase.rpc('debug_auth_context'),
        supabase
          .from('api_metrics')
          .select('endpoint,method,status_code,response_time_ms,created_at,user_id')
          .order('created_at', { ascending: false })
          .limit(20),
      ]);

      const payload = {
        meta: {
          generated_at: new Date().toISOString(),
          url: window.location.href,
          user_agent: navigator.userAgent,
        },
        discovered: {
          edge_functions: discoveredEdgeFunctions,
          services: discoveredServices.map((s) => ({ name: s.name, filePath: s.filePath, directory: s.directory })),
        },
        database: {
          table_count: dbMeta.tables.length,
          policy_count: dbMeta.policies.length,
          function_count: dbMeta.functions.length,
          last_refreshed: dbMeta.lastRefreshed,
        },
        // Consolidated issues across all tabs (critical and degraded included)
        issues_summary: integrations
          .filter((i) => i.status === 'down' || i.status === 'degraded' || i.error)
          .map((i) => ({ name: i.name, type: i.type, status: i.status, error: i.error, responseTime: i.responseTime, dependencies: i.dependencies })),
        // Tab-scoped error details to ensure the report reflects every tab on this page
        tab_error_details: {
          overview: {
            issues: integrations
              .filter((i) => i.status === 'down' || i.status === 'degraded' || i.error)
              .map((i) => ({ name: i.name, type: i.type, status: i.status, error: i.error })),
          },
          edge_functions: {
            issues: integrations
              .filter((i) => i.type === 'edge_function' && (i.status === 'down' || i.status === 'degraded' || i.error))
              .map((i) => ({
                name: i.name,
                status: i.status,
                error: i.error,
                responseTime: i.responseTime,
                integration_points: i.integrations,
              })),
          },
          database: {
            // If there are DB-related errors surfaced on the tab, list them here. Currently derived heuristically.
            issues: [
              ...(dbMeta.tables.length === 0 ? [{ message: 'No tables returned from information_schema.tables' }] : []),
              ...(dbMeta.policies.length === 0 ? [{ message: 'No policies returned from pg_policies' }] : []),
            ],
            meta: {
              table_count: dbMeta.tables.length,
              policy_count: dbMeta.policies.length,
              function_count: dbMeta.functions.length,
            },
          },
          integrations: {
            issues_by_integration: integrations
              .filter((i) => i.status === 'down' || i.status === 'degraded' || i.error)
              .map((i) => ({
                name: i.name,
                type: i.type,
                status: i.status,
                error: i.error,
                integration_points: i.integrations,
              })),
          },
        },
        health_checks: integrations.map((i) => ({
          name: i.name,
          type: i.type,
          status: i.status,
          lastTested: i.lastTested,
          responseTime: i.responseTime,
          error: i.error,
        })),
        system_health_overview: systemHealth.data ?? systemHealth.error ?? null,
        auth_context: authCtx.data ?? authCtx.error ?? null,
        recent_api_metrics: metrics.data ?? [],
      };

      const text = `# Admin Debug Report\n\n` +
        `This report aggregates system health, discovery, and recent metrics for rapid debugging.\n\n` +
        '```json\n' + JSON.stringify(payload, null, 2) + '\n```\n';

      setDebugReport(text);
      localStorage.setItem('admin:apiIntegrationDebugReport', text);
      setIsDebugOpen(true);
      toast({ title: 'Debug report ready', description: 'A comprehensive report has been generated.' });
    } catch (e) {
      toast({ title: 'Debug report failed', description: e instanceof Error ? e.message : 'Unknown error', variant: 'destructive' });
    }
  }, [discoveredEdgeFunctions, discoveredServices, dbMeta, integrations]);

  // Open per-integration issue modal with copy-for-AI
  const openIssueReport = useCallback((api: APIIntegration, integration?: APIIntegration['integrations'][number]) => {
    const issue = {
      name: api.name,
      type: api.type,
      provider: api.provider ?? null,
      status: api.status,
      lastTested: api.lastTested ?? null,
      responseTime: api.responseTime ?? null,
      error: api.error ?? null,
      dependencies: api.dependencies,
      integration: integration ? {
        component: integration.component,
        path: integration.path,
        function: integration.function,
        critical: integration.critical,
      } : null,
      suggested_actions: [
        'Review Edge Function logs in Supabase dashboard if applicable',
        'Verify API keys and permissions',
        'Re-run health checks after any fixes',
      ],
    };
    const text = `# Integration Issue Report - ${api.name}\n\n` + '```json\n' + JSON.stringify(issue, null, 2) + '\n```\n';
    setIssueReport(text);
    setIsIssueOpen(true);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'down': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      operational: 'default',
      degraded: 'secondary',
      down: 'destructive',
      unknown: 'outline'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'edge_function': return <Zap className="h-4 w-4" />;
      case 'external_api': return <Globe className="h-4 w-4" />;
      case 'database': return <Database className="h-4 w-4" />;
      case 'service': return <Server className="h-4 w-4" />;
      default: return <Network className="h-4 w-4" />;
    }
  };

  const operationalApis = integrations.filter(i => i.status === 'operational').length;
  const totalApis = integrations.length;
  const healthScore = Math.round((operationalApis / totalApis) * 100);

  return (
    <div className="space-y-6">
      {/* Header with Health Check */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">API Integration Map</h2>
          <p className="text-muted-foreground">Monitor all sitewide API implementations and their health status</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={generateDebugReport} title="Generate Debug Report">
            <Bug className="h-4 w-4 mr-2" /> Debug Report
          </Button>
          <Button onClick={runHealthChecks} disabled={isRunningHealthChecks} title="Run Health Checks">
            <RefreshCw className={`h-4 w-4 mr-2 ${isRunningHealthChecks ? 'animate-spin' : ''}`} />
            Run Health Checks
          </Button>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Network className="h-4 w-4" />
              API Health Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthScore}%</div>
            <Progress value={healthScore} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {operationalApis}/{totalApis} APIs operational
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Edge Functions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {integrations.filter(i => i.type === 'edge_function').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Active edge functions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Critical APIs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {integrations.filter(i => i.integrations.some(int => int.critical)).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Mission-critical integrations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Last Check</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {lastHealthCheck ? new Date(lastHealthCheck).toLocaleTimeString() : 'Never'}
            </div>
            <p className="text-xs text-muted-foreground">
              Health check timestamp
            </p>
          </CardContent>
        </Card>
      </div>

      {/* API Integration Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="edge-functions">Edge Functions</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="integrations">Integration Details</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {integrations.map((api) => (
            <Card key={api.name}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getTypeIcon(api.type)}
                    <div>
                      <CardTitle className="text-lg">{api.name}</CardTitle>
                      <CardDescription>
                        {api.provider && `Provider: ${api.provider} • `}
                        {api.integrations.length} integration{api.integrations.length !== 1 ? 's' : ''}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(api.status)}
                    {getStatusBadge(api.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Dependencies</h4>
                    <div className="flex flex-wrap gap-1">
                      {api.dependencies.map((dep) => (
                        <Badge key={dep} variant="outline" className="text-xs">
                          {dep}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">Integration Points</h4>
                    <div className="space-y-1">
                      {api.integrations.map((integration, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="font-mono text-xs">{integration.component}</span>
                          <div className="flex items-center gap-2">
                            {integration.critical && (
                              <Badge variant="destructive" className="text-xs">Critical</Badge>
                            )}
                            <code className="text-xs bg-muted px-1 rounded">{integration.function}</code>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="edge-functions" className="space-y-4">
          {integrations.filter(i => i.type === 'edge_function').map((api) => (
            <Card key={api.name}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Zap className="h-5 w-5" />
                    <div>
                      <CardTitle>{api.name}</CardTitle>
                      <CardDescription>Edge Function</CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(api.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Function Details</h4>
                    <div className="space-y-1 text-sm">
                      <div>Status: <span className="font-mono">{api.status}</span></div>
                      {api.lastTested && (
                        <div>Last Tested: <span className="font-mono">{new Date(api.lastTested).toLocaleString()}</span></div>
                      )}
                      {api.responseTime && (
                        <div>Response Time: <span className="font-mono">{api.responseTime}ms</span></div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">Usage Locations</h4>
                    <div className="space-y-1">
                      {api.integrations.map((integration, idx) => (
                        <div key={idx} className="text-sm flex items-center gap-2">
                          <ExternalLink className="h-3 w-3" />
                          <span className="font-mono text-xs">{integration.component}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          {integrations.filter(i => i.type === 'database').map((api) => (
            <Card key={api.name}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Database className="h-5 w-5" />
                    <div>
                      <CardTitle>{api.name}</CardTitle>
                      <CardDescription>Database Service</CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(api.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Static Dependencies</h4>
                    <div className="flex flex-wrap gap-1">
                      {api.dependencies.map((table) => (
                        <Badge key={table} variant="outline" className="text-xs">
                          {table}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Live schema & policies (dynamic via RPC) */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Schema & Policies (Live)</CardTitle>
                  <CardDescription>Auto-updates to reflect current database architecture</CardDescription>
                </div>
                <Button variant="outline" onClick={refreshDbMeta} disabled={isDbLoading} title="Refresh DB metadata">
                  <RefreshCw className={`h-4 w-4 mr-2 ${isDbLoading ? 'animate-spin' : ''}`} /> Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Tables ({dbMeta.tables.length})</h4>
                  <div className="flex flex-wrap gap-1 max-h-40 overflow-auto pr-1">
                    {dbMeta.tables.slice(0, 50).map((t: any, idx: number) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {t.table_schema}.{t.table_name}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Policies ({dbMeta.policies.length})</h4>
                  <div className="space-y-1 max-h-40 overflow-auto pr-1 text-xs">
                    {dbMeta.policies.slice(0, 10).map((p: any, idx: number) => (
                      <div key={idx} className="font-mono truncate">{p.policyname} on {p.tablename}</div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Functions ({dbMeta.functions.length})</h4>
                  <div className="space-y-1 max-h-40 overflow-auto pr-1 text-xs">
                    {dbMeta.functions.slice(0, 10).map((f: any, idx: number) => (
                      <div key={idx} className="font-mono truncate">{f.routine_schema}.{f.routine_name}</div>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Last refreshed: {dbMeta.lastRefreshed ? new Date(dbMeta.lastRefreshed).toLocaleString() : '—'}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Integration Details</CardTitle>
              <CardDescription>Detailed view of all API integration points</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {integrations.map((api) => (
                  <div key={api.name}>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      {getTypeIcon(api.type)}
                      {api.name}
                      {getStatusIcon(api.status)}
                    </h3>
                    
                    <div className="ml-6 space-y-2">
                      {api.integrations.map((integration, idx) => (
                        <div key={idx} className="border-l-2 border-muted pl-4 py-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-sm">{integration.component}</div>
                              <div className="text-xs text-muted-foreground font-mono">{integration.path}</div>
                              <div className="text-xs text-muted-foreground">Function: {integration.function}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              {integration.critical && (
                                <Badge variant="destructive" className="text-xs">Critical</Badge>
                              )}
                              {(api.status === 'down' || api.status === 'degraded' || api.error) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  title="View error and copy for AI"
                                  onClick={() => openIssueReport(api, integration)}
                                >
                                  <Clipboard className="h-3.5 w-3.5 mr-1" /> View Error
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>

        {/* Debug Report Modal */}
        <Dialog open={isDebugOpen} onOpenChange={setIsDebugOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Admin Debug Report</DialogTitle>
              <DialogDescription>
                Share this with AI coding agents. It includes system health, discovery data, DB metadata counts, and recent API metrics.
              </DialogDescription>
            </DialogHeader>
            <div className="border rounded-md bg-muted/40 p-3 max-h-[60vh] overflow-auto">
              <pre className="whitespace-pre-wrap text-xs font-mono">{debugReport || 'No report generated yet.'}</pre>
            </div>
            <DialogFooter>
              <Button
                variant="secondary"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(debugReport);
                    toast({ title: 'Copied', description: 'Debug report copied for AI.' });
                  } catch (e) {
                    toast({ title: 'Copy failed', description: e instanceof Error ? e.message : 'Unknown error', variant: 'destructive' });
                  }
                }}
                title="Copy report for AI"
              >
                <Clipboard className="h-4 w-4 mr-2" /> Copy for AI
              </Button>
              <Button variant="outline" onClick={() => setIsDebugOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Issue Report Modal */}
        <Dialog open={isIssueOpen} onOpenChange={setIsIssueOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Integration Issue</DialogTitle>
              <DialogDescription>
                Critical/Degraded details for this integration. Use Copy for AI to share.
              </DialogDescription>
            </DialogHeader>
            <div className="border rounded-md bg-muted/40 p-3 max-h-[60vh] overflow-auto">
              <pre className="whitespace-pre-wrap text-xs font-mono">{issueReport || 'No issue selected.'}</pre>
            </div>
            <DialogFooter>
              <Button
                variant="secondary"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(issueReport);
                    toast({ title: 'Copied', description: 'Issue report copied for AI.' });
                  } catch (e) {
                    toast({ title: 'Copy failed', description: e instanceof Error ? e.message : 'Unknown error', variant: 'destructive' });
                  }
                }}
                title="Copy error for AI"
              >
                <Clipboard className="h-4 w-4 mr-2" /> Copy for AI
              </Button>
              <Button variant="outline" onClick={() => setIsIssueOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  };