import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TestTube,
  Play,
  Pause,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Zap,
  RefreshCw
} from 'lucide-react';
import { flowManagementService, type FlowDefinition } from '@/services/flowManagementService';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { PromptTemplate } from '@/types/prompts';

interface FlowTestingPanelProps {
  flows: FlowDefinition[];
  templates: PromptTemplate[];
  selectedFlow: FlowDefinition | null;
  onSelectFlow: (flow: FlowDefinition | null) => void;
}

interface TestResult {
  id: string;
  flowName: string;
  promptKey: string;
  success: boolean;
  source: 'flow-assigned' | 'fallback' | 'not-found';
  executionTime: number;
  timestamp: string;
  error?: string;
}

export const FlowTestingPanel: React.FC<FlowTestingPanelProps> = ({
  flows,
  templates,
  selectedFlow,
  onSelectFlow
}) => {
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [selectedPromptKey, setSelectedPromptKey] = useState<string>('');

  const competitorPrompts = templates.filter(t => t.category === 'competitor_analysis');

  const runSingleTest = async (flowName: string, promptKey: string) => {
    const startTime = Date.now();
    
    try {
      const result = await flowManagementService.getPromptByKeyForFlow(promptKey, flowName);
      const executionTime = Date.now() - startTime;
      
      const testResult: TestResult = {
        id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        flowName,
        promptKey,
        success: result.source !== 'not-found',
        source: result.source,
        executionTime,
        timestamp: new Date().toISOString()
      };
      
      return testResult;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      return {
        id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        flowName,
        promptKey,
        success: false,
        source: 'not-found' as const,
        executionTime,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  const runFlowTest = async (flow: FlowDefinition) => {
    if (competitorPrompts.length === 0) {
      toast({
        title: 'No Test Prompts',
        description: 'No competitor analysis prompts found for testing',
        variant: 'destructive'
      });
      return;
    }

    setTesting(true);
    const newResults: TestResult[] = [];

    try {
      for (const template of competitorPrompts.slice(0, 5)) { // Test first 5 prompts
        const result = await runSingleTest(flow.name, template.name);
        newResults.push(result);
      }

      setTestResults(prev => [...newResults, ...prev]);
      
      const successCount = newResults.filter(r => r.success).length;
      toast({
        title: 'Flow Test Complete',
        description: `${successCount}/${newResults.length} tests passed for "${flow.name}"`
      });
    } catch (error) {
      console.error('Error running flow test:', error);
      toast({
        title: 'Test Failed',
        description: 'An error occurred while testing the flow',
        variant: 'destructive'
      });
    } finally {
      setTesting(false);
    }
  };

  const runSinglePromptTest = async () => {
    if (!selectedFlow || !selectedPromptKey) {
      toast({
        title: 'Invalid Selection',
        description: 'Please select both a flow and a prompt to test',
        variant: 'destructive'
      });
      return;
    }

    setTesting(true);
    try {
      const result = await runSingleTest(selectedFlow.name, selectedPromptKey);
      setTestResults(prev => [result, ...prev]);
      
      toast({
        title: result.success ? 'Test Passed' : 'Test Failed',
        description: `Prompt "${selectedPromptKey}" ${result.success ? 'found' : 'not found'} in flow "${selectedFlow.name}"`,
        variant: result.success ? 'default' : 'destructive'
      });
    } catch (error) {
      console.error('Error running single test:', error);
      toast({
        title: 'Test Error',
        description: 'An error occurred while testing the prompt',
        variant: 'destructive'
      });
    } finally {
      setTesting(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'flow-assigned':
        return <Badge variant="default" className="gap-1"><CheckCircle2 className="h-3 w-3" />Flow Assigned</Badge>;
      case 'fallback':
        return <Badge variant="secondary" className="gap-1"><AlertCircle className="h-3 w-3" />Fallback</Badge>;
      case 'not-found':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Not Found</Badge>;
      default:
        return <Badge variant="outline">{source}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Flow Testing</h2>
          <p className="text-muted-foreground">
            Test flow assignments and validate prompt retrieval
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={clearResults}
            disabled={testResults.length === 0}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Clear Results
          </Button>
        </div>
      </div>

      <Tabs defaultValue="flow-tests" className="space-y-6">
        <TabsList>
          <TabsTrigger value="flow-tests">Flow Tests</TabsTrigger>
          <TabsTrigger value="single-test">Single Prompt Test</TabsTrigger>
          <TabsTrigger value="results">Test Results</TabsTrigger>
        </TabsList>

        <TabsContent value="flow-tests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Flow Validation Tests
              </CardTitle>
              <CardDescription>
                Test multiple prompts against each flow to validate assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {flows.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No flows available for testing. Create flows first in the Flow Definitions tab.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  <Alert>
                    <TestTube className="h-4 w-4" />
                    <AlertDescription>
                      Flow tests will check if competitor analysis prompts can be retrieved through each flow.
                      This validates that prompt assignments are working correctly.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="grid gap-3">
                    {flows.map((flow) => (
                      <div
                        key={flow.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <div className="font-medium">{flow.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {flow.description || 'No description'}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant={flow.is_active ? "default" : "secondary"}>
                            {flow.is_active ? "Active" : "Inactive"}
                          </Badge>
                          <Button
                            onClick={() => runFlowTest(flow)}
                            disabled={testing || !flow.is_active}
                            className="gap-2"
                          >
                            {testing ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                            Test Flow
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="single-test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Single Prompt Test
              </CardTitle>
              <CardDescription>
                Test a specific prompt against a selected flow
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Flow</label>
                  <Select
                    value={selectedFlow?.id || ''}
                    onValueChange={(value) => {
                      const flow = flows.find(f => f.id === value);
                      onSelectFlow(flow || null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a flow" />
                    </SelectTrigger>
                    <SelectContent>
                      {flows.filter(f => f.is_active).map((flow) => (
                        <SelectItem key={flow.id} value={flow.id}>
                          {flow.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Prompt</label>
                  <Select
                    value={selectedPromptKey}
                    onValueChange={setSelectedPromptKey}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a prompt" />
                    </SelectTrigger>
                    <SelectContent>
                      {competitorPrompts.map((template) => (
                        <SelectItem key={template.id} value={template.name}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={runSinglePromptTest}
                disabled={testing || !selectedFlow || !selectedPromptKey}
                className="w-full gap-2"
              >
                {testing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                Run Test
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Test Results
                {testResults.length > 0 && (
                  <Badge variant="outline">{testResults.length} results</Badge>
                )}
              </CardTitle>
              <CardDescription>
                Historical test results and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {testResults.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <TestTube className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <div>No test results yet</div>
                  <div className="text-sm">Run some tests to see results here</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {testResults.map((result) => (
                    <div
                      key={result.id}
                      className={cn(
                        "p-4 border rounded-lg",
                        result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{result.promptKey}</span>
                            <span className="text-sm text-muted-foreground">→</span>
                            <span className="text-sm text-muted-foreground">{result.flowName}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {getSourceBadge(result.source)}
                            <span className="text-sm text-muted-foreground">
                              {result.executionTime}ms
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {new Date(result.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          
                          {result.error && (
                            <div className="text-sm text-red-600 mt-1">
                              Error: {result.error}
                            </div>
                          )}
                        </div>
                        
                        {result.success ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};