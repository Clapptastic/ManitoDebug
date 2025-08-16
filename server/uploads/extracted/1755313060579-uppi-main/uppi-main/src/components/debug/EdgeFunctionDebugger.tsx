import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
}

export const EdgeFunctionDebugger: React.FC = () => {
  const { toast } = useToast();
  const [results, setResults] = useState<DebugResult | null>(null);
  const [validationResults, setValidationResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTest, setActiveTest] = useState<string>('');

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
      
      if (data.secrets?.tests) {
        totalTests += data.secrets.tests.length;
        successfulTests += data.secrets.tests.filter((t: TestResult) => t.success).length;
      }
      
      if (data.apiKeys?.tests) {
        totalTests += data.apiKeys.tests.length;
        successfulTests += data.apiKeys.tests.filter((t: TestResult) => t.success).length;
      }
      
      if (data.competitorAnalysis?.tests) {
        totalTests += data.competitorAnalysis.tests.length;
        successfulTests += data.competitorAnalysis.tests.filter((t: TestResult) => t.success).length;
      }
      
      if (data.externalAPIs?.tests) {
        totalTests += data.externalAPIs.tests.length;
        successfulTests += data.externalAPIs.tests.filter((t: TestResult) => t.success).length;
      }

      toast({
        title: "Debug Test Complete",
        description: `${successfulTests}/${totalTests} tests passed`,
        variant: successfulTests === totalTests ? "default" : "destructive"
      });

    } catch (error) {
      console.error('Debug test failed:', error);
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

  const runApiKeyValidation = async () => {
    setLoading(true);
    setActiveTest('validate_keys');
    
    try {
      const { data, error } = await supabase.functions.invoke('validate-and-fix-api-keys', {
        body: { action: 'validate_all' }
      });

      if (error) {
        throw error;
      }

      setValidationResults(data);
      
      const validCount = data.validations?.filter((v: any) => v.status === 'valid').length || 0;
      const totalCount = data.validations?.length || 0;

      toast({
        title: "API Key Validation Complete",
        description: `${validCount}/${totalCount} API keys are valid`,
        variant: validCount === totalCount ? "default" : "destructive"
      });

    } catch (error) {
      console.error('Validation failed:', error);
      toast({
        title: "Validation Failed",
        description: "Failed to validate API keys. Check console for details.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setActiveTest('');
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    );
  };

  const getStatusBadge = (success: boolean, status?: number) => {
    if (success) {
      return <Badge variant="default">✓ Pass</Badge>;
    } else {
      return <Badge variant="destructive">✗ Fail {status ? `(${status})` : ''}</Badge>;
    }
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
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(test.success, test.status)}
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

  const renderEnvironment = (env: Record<string, string>) => {
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-lg">Environment Variables</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(env).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-2 border rounded">
                <span className="font-medium text-sm">{key}</span>
                <Badge variant={value === 'SET' ? 'default' : 'destructive'}>
                  {value}
                </Badge>
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
        <h1 className="text-3xl font-bold mb-4">Edge Function Debugger</h1>
        <p className="text-muted-foreground mb-6">
          Comprehensive testing and debugging of all edge functions and API integrations.
        </p>

        <div className="flex flex-wrap gap-3 mb-6">
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
            Run All Tests
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => runDebugTest('test_secrets')} 
            disabled={loading}
          >
            {loading && activeTest === 'test_secrets' && <Clock className="h-4 w-4 mr-2" />}
            Test Secrets
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => runDebugTest('test_api_keys')} 
            disabled={loading}
          >
            {loading && activeTest === 'test_api_keys' && <Clock className="h-4 w-4 mr-2" />}
            Test API Keys
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => runDebugTest('test_competitor_analysis')} 
            disabled={loading}
          >
            {loading && activeTest === 'test_competitor_analysis' && <Clock className="h-4 w-4 mr-2" />}
            Test Analysis
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => runDebugTest('test_external_apis')} 
            disabled={loading}
          >
            {loading && activeTest === 'test_external_apis' && <Clock className="h-4 w-4 mr-2" />}
            Test External APIs
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => runApiKeyValidation()} 
            disabled={loading}
            className="bg-blue-50 hover:bg-blue-100"
          >
            {loading && activeTest === 'validate_keys' && <Clock className="h-4 w-4 mr-2" />}
            Validate & Fix API Keys
          </Button>
        </div>
      </div>

      {results?.error && (
        <Alert variant="destructive" className="mb-6">
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

      {validationResults && (
        <Card className="mb-6">
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
            <div className="space-y-3">
              {validationResults.validations?.map((validation: any, index: number) => (
                <div key={index} className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(validation.status === 'valid')}
                    <div>
                      <div className="font-medium capitalize">{validation.provider}</div>
                      <div className="text-sm text-muted-foreground">{validation.details || validation.error}</div>
                      {validation.recommendation && (
                        <div className="text-xs text-blue-600 mt-1">{validation.recommendation}</div>
                      )}
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
            
            {validationResults.recommendations?.length > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">Recommendations:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {validationResults.recommendations.map((rec: any, index: number) => (
                    <li key={index}>• {rec.message}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {results && (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="environment">Environment</TabsTrigger>
            <TabsTrigger value="secrets">Secrets</TabsTrigger>
            <TabsTrigger value="apikeys">API Keys</TabsTrigger>
            <TabsTrigger value="external">External APIs</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Test Results Summary</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Last run: {new Date(results.timestamp).toLocaleString()}
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {results.secrets?.tests && (
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {results.secrets.tests.filter((t: TestResult) => t.success).length}/
                        {results.secrets.tests.length}
                      </div>
                      <div className="text-sm text-muted-foreground">Secrets</div>
                    </div>
                  )}
                  
                  {results.apiKeys?.tests && (
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {results.apiKeys.tests.filter((t: TestResult) => t.success).length}/
                        {results.apiKeys.tests.length}
                      </div>
                      <div className="text-sm text-muted-foreground">API Keys</div>
                    </div>
                  )}
                  
                  {results.competitorAnalysis?.tests && (
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {results.competitorAnalysis.tests.filter((t: TestResult) => t.success).length}/
                        {results.competitorAnalysis.tests.length}
                      </div>
                      <div className="text-sm text-muted-foreground">Analysis</div>
                    </div>
                  )}
                  
                  {results.externalAPIs?.tests && (
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {results.externalAPIs.tests.filter((t: TestResult) => t.success).length}/
                        {results.externalAPIs.tests.length}
                      </div>
                      <div className="text-sm text-muted-foreground">External APIs</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="environment">
            {results.environment && renderEnvironment(results.environment)}
          </TabsContent>

          <TabsContent value="secrets">
            <ScrollArea className="h-[600px]">
              {results.secrets?.tests && renderTestResults(results.secrets.tests, "Secret Management Tests")}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="apikeys">
            <ScrollArea className="h-[600px]">
              {results.apiKeys?.tests && renderTestResults(results.apiKeys.tests, "API Key Management Tests")}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="external">
            <ScrollArea className="h-[600px]">
              {results.externalAPIs?.tests && renderTestResults(results.externalAPIs.tests, "External API Tests")}
              {results.competitorAnalysis?.tests && renderTestResults(results.competitorAnalysis.tests, "Competitor Analysis Tests")}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};