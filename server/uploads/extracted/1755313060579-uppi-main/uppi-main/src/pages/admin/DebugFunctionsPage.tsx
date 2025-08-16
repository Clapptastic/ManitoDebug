import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  RefreshCw, 
  Terminal,
  Database,
  Key,
  Activity,
  Server,
  Shield,
  Zap,
  TrendingUp,
  FileText,
  Users,
  Settings,
  BarChart3,
  Search
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EdgeFunction {
  name: string;
  category: 'core' | 'ai' | 'analysis' | 'admin' | 'utility' | 'integration' | 'security';
  description: string;
  status: 'active' | 'error' | 'unknown';
  lastInvoked?: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface DebugResult {
  timestamp: string;
  action: string;
  environment?: Record<string, string>;
  secrets?: any;
  apiKeys?: any;
  competitorAnalysis?: any;
  externalAPIs?: any;
  error?: string;
  stack?: string;
}

interface TestResult {
  name: string;
  success: boolean;
  status?: number;
  data?: any;
  error?: string;
  provider?: string;
  sessionId?: string;
}

interface FunctionInvocation {
  functionName: string;
  payload: any;
  timestamp: string;
  success: boolean;
  response?: any;
  error?: string;
}

const EDGE_FUNCTIONS: EdgeFunction[] = [
  // Core Functions
  { name: 'competitor-analysis', category: 'core', description: 'Main competitor analysis engine with AI providers', status: 'active', icon: TrendingUp },
  { name: 'competitor-analysis-gate', category: 'core', description: 'Analysis gate control and permissions', status: 'active', icon: Shield },
  { name: 'check-api-keys', category: 'core', description: 'API key validation and status checking', status: 'active', icon: Key },
  { name: 'debug-all-functions', category: 'core', description: 'Comprehensive function testing and diagnostics', status: 'active', icon: Terminal },
  
  // AI Functions
  { name: 'ai-chat', category: 'ai', description: 'AI chat interface with multiple providers', status: 'active', icon: Zap },
  { name: 'ai-cofounder-chat', category: 'ai', description: 'Specialized AI cofounder guidance chat', status: 'active', icon: Users },
  { name: 'ai-drill-down', category: 'ai', description: 'Deep AI analysis and drill-down capabilities', status: 'active', icon: Search },
  { name: 'ai-market-analyst', category: 'ai', description: 'AI-powered market analysis and insights', status: 'active', icon: BarChart3 },
  { name: 'ai-powered-analytics', category: 'ai', description: 'Advanced AI analytics engine', status: 'active', icon: TrendingUp },
  { name: 'ai-profile-setup', category: 'ai', description: 'AI-assisted profile configuration', status: 'active', icon: Settings },
  { name: 'ai-validation-engine', category: 'ai', description: 'AI-based validation and verification', status: 'active', icon: CheckCircle },
  
  // Analysis Functions
  { name: 'aggregate-analysis', category: 'analysis', description: 'Data aggregation and analysis processing', status: 'active', icon: BarChart3 },
  { name: 'analyze-company-profile', category: 'analysis', description: 'Company profile analysis and scoring', status: 'active', icon: TrendingUp },
  { name: 'analyze-docker', category: 'analysis', description: 'Docker configuration analysis', status: 'active', icon: Server },
  { name: 'analyze-geographic', category: 'analysis', description: 'Geographic market analysis', status: 'active', icon: TrendingUp },
  { name: 'analyze-market-sentiment', category: 'analysis', description: 'Market sentiment analysis', status: 'error', icon: TrendingUp },
  { name: 'analyze-pricing', category: 'analysis', description: 'Pricing strategy analysis', status: 'active', icon: BarChart3 },
  { name: 'analyze-trends', category: 'analysis', description: 'Market trend analysis', status: 'active', icon: TrendingUp },
  { name: 'calculate-market-size', category: 'analysis', description: 'Market size calculation and estimation', status: 'active', icon: BarChart3 },
  { name: 'calculate-threat-level', category: 'analysis', description: 'Competitive threat assessment', status: 'active', icon: AlertTriangle },
  
  // Admin Functions
  { name: 'admin-api', category: 'admin', description: 'Administrative API operations', status: 'active', icon: Shield },
  { name: 'api-cost-tracker', category: 'admin', description: 'API usage cost tracking and monitoring', status: 'active', icon: BarChart3 },
  { name: 'audit-vault-system', category: 'admin', description: 'Vault system security audit', status: 'active', icon: Shield },
  { name: 'debug-api-key', category: 'admin', description: 'API key debugging and diagnostics', status: 'active', icon: Key },
  { name: 'debug-competitor-flow', category: 'admin', description: 'Competitor analysis flow debugging', status: 'active', icon: Terminal },
  { name: 'set-super-admin', category: 'admin', description: 'Super admin user management', status: 'active', icon: Users },
  { name: 'system-health', category: 'admin', description: 'System health monitoring and status', status: 'active', icon: Activity },
  { name: 'user-management', category: 'admin', description: 'User account management operations', status: 'active', icon: Users },
  
  // Utility Functions
  { name: 'business-plan-generator', category: 'utility', description: 'AI-powered business plan generation', status: 'active', icon: FileText },
  { name: 'code-embeddings', category: 'utility', description: 'Code embedding and similarity analysis', status: 'active', icon: Terminal },
  { name: 'consolidate-company-data', category: 'utility', description: 'Company data consolidation and cleanup', status: 'active', icon: Database },
  { name: 'database-optimizer', category: 'utility', description: 'Database performance optimization', status: 'active', icon: Database },
  { name: 'generate-analysis-pdf', category: 'utility', description: 'PDF report generation for analysis', status: 'active', icon: FileText },
  { name: 'generate-forecast', category: 'utility', description: 'Market forecast generation', status: 'active', icon: TrendingUp },
  { name: 'package-manager', category: 'utility', description: 'Package management and updates', status: 'active', icon: Server },
  { name: 'process-document', category: 'utility', description: 'Document processing and analysis', status: 'active', icon: FileText },
  
  // Integration Functions
  { name: 'financial-data', category: 'integration', description: 'Financial data fetching and processing', status: 'active', icon: BarChart3 },
  { name: 'github-integration', category: 'integration', description: 'GitHub repository integration', status: 'active', icon: Terminal },
  { name: 'market-data-fetcher', category: 'integration', description: 'External market data integration', status: 'active', icon: Database },
  { name: 'web-analytics', category: 'integration', description: 'Web analytics data collection', status: 'active', icon: BarChart3 },
  
  // Security Functions
  { name: 'docker-security-scan', category: 'security', description: 'Docker security vulnerability scanning', status: 'active', icon: Shield },
  { name: 'security-audit', category: 'security', description: 'Comprehensive security audit', status: 'active', icon: Shield }
];

export default function DebugFunctionsPage() {
  const { toast } = useToast();
  const [results, setResults] = useState<DebugResult | null>(null);
  const [validationResults, setValidationResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTest, setActiveTest] = useState<string>('');
  const [selectedFunction, setSelectedFunction] = useState<string>('');
  const [customPayload, setCustomPayload] = useState<string>('{}');
  const [invocationHistory, setInvocationHistory] = useState<FunctionInvocation[]>([]);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filteredFunctions = EDGE_FUNCTIONS.filter(func => {
    const matchesSearch = func.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
                         func.description.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || func.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const runDebugTest = async (action: string = 'test_all') => {
    setLoading(true);
    setActiveTest(action);
    
    try {
      const { data, error } = await supabase.functions.invoke('debug-all-functions', {
        body: { action }
      });

      if (error) {
        throw error;
      }

      setResults(data);
      
      // Count successes and failures
      let totalTests = 0;
      let successfulTests = 0;
      
      ['secrets', 'apiKeys', 'competitorAnalysis', 'externalAPIs'].forEach(category => {
        if (data[category]?.tests) {
          totalTests += data[category].tests.length;
          successfulTests += data[category].tests.filter((t: TestResult) => t.success).length;
        }
      });

      const invocation: FunctionInvocation = {
        functionName: 'debug-all-functions',
        payload: { action },
        timestamp: new Date().toISOString(),
        success: true,
        response: data
      };
      setInvocationHistory(prev => [invocation, ...prev.slice(0, 9)]);

      toast({
        title: "Debug Test Complete",
        description: `${successfulTests}/${totalTests} tests passed`,
        variant: successfulTests === totalTests ? "default" : "destructive"
      });

    } catch (error: any) {
      console.error('Debug test failed:', error);
      
      const invocation: FunctionInvocation = {
        functionName: 'debug-all-functions',
        payload: { action },
        timestamp: new Date().toISOString(),
        success: false,
        error: error.message
      };
      setInvocationHistory(prev => [invocation, ...prev.slice(0, 9)]);
      
      toast({
        title: "Debug Test Failed",
        description: "Failed to run debug test. Check console for details.",
        variant: "destructive"
      });
      setResults({
        timestamp: new Date().toISOString(),
        action,
        error: error.message
      });
    } finally {
      setLoading(false);
      setActiveTest('');
    }
  };

  const invokeCustomFunction = async () => {
    if (!selectedFunction) {
      toast({
        title: "No Function Selected",
        description: "Please select a function to invoke",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      let payload;
      try {
        payload = JSON.parse(customPayload);
      } catch {
        payload = {};
      }

      const { data, error } = await supabase.functions.invoke(selectedFunction, {
        body: payload
      });

      const invocation: FunctionInvocation = {
        functionName: selectedFunction,
        payload,
        timestamp: new Date().toISOString(),
        success: !error,
        response: data,
        error: error?.message
      };
      setInvocationHistory(prev => [invocation, ...prev.slice(0, 9)]);

      if (error) {
        throw error;
      }

      toast({
        title: "Function Invoked Successfully",
        description: `${selectedFunction} completed successfully`,
        variant: "default"
      });

    } catch (error: any) {
      console.error('Function invocation failed:', error);
      toast({
        title: "Function Invocation Failed",
        description: error.message || "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    );
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default' as const,
      error: 'destructive' as const,
      unknown: 'secondary' as const
    };
    return <Badge variant={variants[status as keyof typeof variants]}>{status}</Badge>;
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      core: Terminal,
      ai: Zap,
      analysis: TrendingUp,
      admin: Shield,
      utility: Settings,
      integration: Database,
      security: Shield
    };
    const IconComponent = icons[category as keyof typeof icons] || Terminal;
    return <IconComponent className="h-4 w-4" />;
  };

  const renderTestResults = (tests: TestResult[], title: string) => {
    if (!tests || tests.length === 0) return null;

    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            {title}
            <Badge variant="outline">
              {tests.filter(t => t.success).length}/{tests.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tests.map((test, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  {getStatusIcon(test.success)}
                  <span className="font-medium">{test.name}</span>
                  {test.provider && (
                    <Badge variant="secondary">{test.provider}</Badge>
                  )}
                  {test.sessionId && (
                    <Badge variant="outline" className="text-xs">{test.sessionId}</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={test.success ? "default" : "destructive"}>
                    {test.success ? '✓ Pass' : '✗ Fail'} {test.status ? `(${test.status})` : ''}
                  </Badge>
                  {test.error && (
                    <Badge variant="outline" className="text-xs max-w-[200px] truncate">
                      {test.error}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Edge Functions Debug Center</h1>
        <p className="text-muted-foreground mb-6">
          Comprehensive testing, monitoring, and debugging of all edge functions and API integrations.
          Current architecture includes {EDGE_FUNCTIONS.length} functions across {[...new Set(EDGE_FUNCTIONS.map(f => f.category))].length} categories.
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="functions">Functions</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
          <TabsTrigger value="custom">Custom Invoke</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Total Functions</span>
                    <Badge>{EDGE_FUNCTIONS.length}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Functions</span>
                    <Badge variant="default">{EDGE_FUNCTIONS.filter(f => f.status === 'active').length}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Error Functions</span>
                    <Badge variant="destructive">{EDGE_FUNCTIONS.filter(f => f.status === 'error').length}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Test</span>
                    <span className="text-sm text-muted-foreground">
                      {results ? new Date(results.timestamp).toLocaleString() : 'Never'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[...new Set(EDGE_FUNCTIONS.map(f => f.category))].map(category => {
                    const count = EDGE_FUNCTIONS.filter(f => f.category === category).length;
                    return (
                      <div key={category} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(category)}
                          <span className="capitalize">{category}</span>
                        </div>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => runDebugTest('test_all')} 
                  disabled={loading}
                  className="w-full"
                  size="sm"
                >
                  {loading && activeTest === 'test_all' ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Run All Tests
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => runDebugTest('test_competitor_analysis')} 
                  disabled={loading}
                  className="w-full"
                  size="sm"
                >
                  Test Analysis Engine
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => runDebugTest('test_api_keys')} 
                  disabled={loading}
                  className="w-full"
                  size="sm"
                >
                  Test API Keys
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="functions" className="space-y-4">
          <div className="flex gap-4 items-center mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search functions..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">All Categories</option>
              {[...new Set(EDGE_FUNCTIONS.map(f => f.category))].map(category => (
                <option key={category} value={category} className="capitalize">
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFunctions.map((func) => (
              <Card key={func.name} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <func.icon className="h-5 w-5" />
                      <CardTitle className="text-sm font-medium">{func.name}</CardTitle>
                    </div>
                    {getStatusBadge(func.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-3">{func.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(func.category)}
                      <Badge variant="secondary" className="text-xs capitalize">
                        {func.category}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedFunction(func.name)}
                      className="h-6 text-xs"
                    >
                      Select
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="testing" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button 
              onClick={() => runDebugTest('test_all')} 
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading && activeTest === 'test_all' ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              All Tests
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => runDebugTest('test_secrets')} 
              disabled={loading}
            >
              {loading && activeTest === 'test_secrets' && <Clock className="h-4 w-4 mr-2" />}
              Secrets
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => runDebugTest('test_api_keys')} 
              disabled={loading}
            >
              {loading && activeTest === 'test_api_keys' && <Clock className="h-4 w-4 mr-2" />}
              API Keys
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => runDebugTest('test_competitor_analysis')} 
              disabled={loading}
            >
              {loading && activeTest === 'test_competitor_analysis' && <Clock className="h-4 w-4 mr-2" />}
              Analysis
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => runDebugTest('test_external_apis')} 
              disabled={loading}
            >
              {loading && activeTest === 'test_external_apis' && <Clock className="h-4 w-4 mr-2" />}
              External APIs
            </Button>
            
            <Button 
              variant="outline"
              onClick={async () => {
                setLoading(true);
                try {
                  const { data, error } = await supabase.functions.invoke('validate-and-fix-api-keys', {
                    body: { action: 'validate_all' }
                  });
                  if (error) throw error;
                  setValidationResults(data);
                  toast({ title: "Validation Complete", description: "API key validation finished" });
                } catch (error: any) {
                  toast({ title: "Validation Failed", description: error.message, variant: "destructive" });
                } finally {
                  setLoading(false);
                }
              }} 
              disabled={loading}
              className="bg-blue-50 hover:bg-blue-100"
            >
              Validate Keys
            </Button>
          </div>

          {validationResults && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  API Key Validation Results
                  <Badge variant="outline">
                    {validationResults.validations?.filter((v: any) => v.status === 'valid').length || 0}/
                    {validationResults.validations?.length || 0} Valid
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {validationResults.validations?.map((validation: any, index: number) => (
                      <div key={index} className="flex items-start justify-between p-3 border rounded-lg">
                        <div className="flex items-start gap-3">
                          {getStatusIcon(validation.status === 'valid')}
                          <div>
                            <div className="font-medium capitalize">{validation.provider}</div>
                            <div className="text-sm text-muted-foreground">{validation.details || validation.error}</div>
                          </div>
                        </div>
                        <Badge variant={
                          validation.status === 'valid' ? 'default' : 
                          validation.status === 'missing' ? 'secondary' : 'destructive'
                        }>
                          {validation.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Custom Function Invocation</CardTitle>
              <p className="text-sm text-muted-foreground">
                Select any edge function and provide custom payload for testing
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="function-select">Function</Label>
                <select
                  id="function-select"
                  value={selectedFunction}
                  onChange={(e) => setSelectedFunction(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                >
                  <option value="">Select a function...</option>
                  {EDGE_FUNCTIONS.map((func) => (
                    <option key={func.name} value={func.name}>
                      {func.name} ({func.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="payload">Payload (JSON)</Label>
                <Textarea
                  id="payload"
                  value={customPayload}
                  onChange={(e) => setCustomPayload(e.target.value)}
                  placeholder='{"key": "value"}'
                  rows={4}
                  className="mt-1 font-mono text-sm"
                />
              </div>

              <Button 
                onClick={invokeCustomFunction}
                disabled={loading || !selectedFunction}
                className="w-full"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Terminal className="h-4 w-4 mr-2" />
                )}
                Invoke Function
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Invocation History</CardTitle>
              <p className="text-sm text-muted-foreground">
                Recent function invocations and their results
              </p>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {invocationHistory.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No invocations yet. Run some tests or invoke functions to see history.
                    </p>
                  ) : (
                    invocationHistory.map((invocation, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(invocation.success)}
                            <span className="font-medium">{invocation.functionName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={invocation.success ? "default" : "destructive"}>
                              {invocation.success ? 'Success' : 'Error'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(invocation.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                        
                        {invocation.error && (
                          <Alert variant="destructive" className="mt-2">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>{invocation.error}</AlertDescription>
                          </Alert>
                        )}
                        
                        <details className="mt-2">
                          <summary className="text-sm cursor-pointer text-muted-foreground">
                            View payload and response
                          </summary>
                          <div className="mt-2 space-y-2">
                            <div>
                              <span className="text-xs font-medium">Payload:</span>
                              <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                                {JSON.stringify(invocation.payload, null, 2)}
                              </pre>
                            </div>
                            {invocation.response && (
                              <div>
                                <span className="text-xs font-medium">Response:</span>
                                <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto max-h-32">
                                  {JSON.stringify(invocation.response, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </details>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          {results?.error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Error:</strong> {results.error}
                {results.stack && (
                  <details className="mt-2">
                    <summary className="cursor-pointer">Stack Trace</summary>
                    <pre className="text-xs mt-2 overflow-auto">{results.stack}</pre>
                  </details>
                )}
              </AlertDescription>
            </Alert>
          )}

          {results && !results.error && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Test Results Summary</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Last run: {new Date(results.timestamp).toLocaleString()}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {['secrets', 'apiKeys', 'competitorAnalysis', 'externalAPIs'].map(category => {
                      const tests = results[category]?.tests;
                      if (!tests) return null;
                      
                      return (
                        <div key={category} className="text-center">
                          <div className="text-2xl font-bold">
                            {tests.filter((t: TestResult) => t.success).length}/{tests.length}
                          </div>
                          <div className="text-sm text-muted-foreground capitalize">
                            {category.replace(/([A-Z])/g, ' $1').toLowerCase()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <ScrollArea className="h-[600px]">
                {results.secrets?.tests && renderTestResults(results.secrets.tests, "Secret Management Tests")}
                {results.apiKeys?.tests && renderTestResults(results.apiKeys.tests, "API Key Management Tests")}
                {results.competitorAnalysis?.tests && renderTestResults(results.competitorAnalysis.tests, "Competitor Analysis Tests")}
                {results.externalAPIs?.tests && renderTestResults(results.externalAPIs.tests, "External API Tests")}
              </ScrollArea>
            </div>
          )}

          {!results && (
            <Card>
              <CardContent className="text-center py-12">
                <Terminal className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Test Results</h3>
                <p className="text-muted-foreground mb-4">
                  Run a debug test to see comprehensive results and analysis
                </p>
                <Button onClick={() => runDebugTest('test_all')}>
                  Run All Tests
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}