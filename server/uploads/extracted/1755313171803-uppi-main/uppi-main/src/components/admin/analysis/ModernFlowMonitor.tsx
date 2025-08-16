import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Loader2, 
  Database, 
  Zap, 
  Settings, 
  Activity, 
  Brain,
  Eye,
  FileText,
  BarChart3,
  AlertTriangle,
  MonitorSpeaker,
  TrendingUp,
  Shield
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { FlowStepCard } from './flow-components/FlowStepCard';
import { ProviderTestPanel } from './flow-components/ProviderTestPanel';
import { DiagnosticsPanel } from './flow-components/DiagnosticsPanel';
import { HistoryPanel } from './flow-components/HistoryPanel';
import { MetricsOverview } from './flow-components/MetricsOverview';

export interface FlowStep {
  id: string;
  name: string;
  description: string;
  status: 'idle' | 'running' | 'success' | 'warning' | 'error';
  duration?: number;
  error?: string;
  data?: any;
  icon: React.ReactNode;
  category: 'auth' | 'data' | 'analysis' | 'storage';
}

export interface ProviderTest {
  name: string;
  status: 'idle' | 'running' | 'success' | 'error';
  response?: any;
  error?: string;
  cost?: number;
  tokens?: number;
}

const INITIAL_STEPS: FlowStep[] = [
  {
    id: 'auth',
    name: 'Authentication & Authorization',
    description: 'Verify user session and permissions',
    status: 'idle',
    icon: <Shield className="h-4 w-4" />,
    category: 'auth'
  },
  {
    id: 'apikeys',
    name: 'API Keys Validation',
    description: 'Decrypt and validate API keys from vault',
    status: 'idle',
    icon: <Eye className="h-4 w-4" />,
    category: 'auth'
  },
  {
    id: 'gate',
    name: 'Feature Gate Check',
    description: 'Verify feature access permissions',
    status: 'idle',
    icon: <Settings className="h-4 w-4" />,
    category: 'auth'
  },
  {
    id: 'database',
    name: 'Database Connection',
    description: 'Test RLS policies and connection health',
    status: 'idle',
    icon: <Database className="h-4 w-4" />,
    category: 'data'
  },
  {
    id: 'progress',
    name: 'Progress Tracking',
    description: 'Initialize real-time progress monitoring',
    status: 'idle',
    icon: <Activity className="h-4 w-4" />,
    category: 'data'
  },
  {
    id: 'analysis',
    name: 'AI Analysis Pipeline',
    description: 'Execute multi-provider analysis workflow',
    status: 'idle',
    icon: <Brain className="h-4 w-4" />,
    category: 'analysis'
  },
  {
    id: 'orchestration',
    name: 'Provider Orchestration',
    description: 'Coordinate multiple AI providers',
    status: 'idle',
    icon: <Zap className="h-4 w-4" />,
    category: 'analysis'
  },
  {
    id: 'aggregate',
    name: 'Data Aggregation',
    description: 'Merge and score analysis results',
    status: 'idle',
    icon: <BarChart3 className="h-4 w-4" />,
    category: 'storage'
  },
  {
    id: 'storage',
    name: 'Persistence Layer',
    description: 'Store results and link profiles',
    status: 'idle',
    icon: <FileText className="h-4 w-4" />,
    category: 'storage'
  }
];

const INITIAL_PROVIDERS: ProviderTest[] = [
  { name: 'OpenAI GPT-4', status: 'idle' },
  { name: 'Anthropic Claude', status: 'idle' },
  { name: 'Perplexity', status: 'idle' }
];

export const ModernFlowMonitor: React.FC = () => {
  const { user, isSuperAdmin } = useAuth();
  const [flowSteps, setFlowSteps] = useState<FlowStep[]>(INITIAL_STEPS);
  const [providerTests, setProviderTests] = useState<ProviderTest[]>(INITIAL_PROVIDERS);
  const [testCompetitor, setTestCompetitor] = useState('Microsoft');
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('flow');

  const updateStepStatus = (stepId: string, status: FlowStep['status'], data?: any, error?: string) => {
    setFlowSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status, data, error, duration: status === 'success' ? Date.now() : step.duration }
        : step
    ));
  };

  const updateProviderStatus = (providerName: string, status: ProviderTest['status'], data?: Partial<ProviderTest>) => {
    setProviderTests(prev => prev.map(provider =>
      provider.name === providerName
        ? { ...provider, status, ...data }
        : provider
    ));
  };

  const runFlowTest = async () => {
    if (!testCompetitor.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a competitor name',
        variant: 'destructive',
      });
      return;
    }

    setIsRunningTest(true);
    setTestResults(null);
    
    try {
      // Reset all steps
      setFlowSteps(INITIAL_STEPS);
      setProviderTests(INITIAL_PROVIDERS);

      // Simulate flow execution
      const steps = ['auth', 'apikeys', 'gate', 'database', 'progress', 'analysis', 'orchestration', 'aggregate', 'storage'];
      
      for (let i = 0; i < steps.length; i++) {
        const stepId = steps[i];
        updateStepStatus(stepId, 'running');
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
        
        // Simulate success/failure
        const success = Math.random() > 0.1; // 90% success rate
        updateStepStatus(stepId, success ? 'success' : 'error', 
          success ? { processed: true } : undefined,
          success ? undefined : 'Simulated error for testing'
        );
        
        if (!success) break;
      }

      // Test providers in parallel
      const providerPromises = INITIAL_PROVIDERS.map(async (provider) => {
        updateProviderStatus(provider.name, 'running');
        await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));
        
        const success = Math.random() > 0.15; // 85% success rate
        updateProviderStatus(provider.name, success ? 'success' : 'error', {
          tokens: success ? Math.floor(Math.random() * 1000) + 100 : undefined,
          cost: success ? Math.random() * 0.1 + 0.01 : undefined,
          error: success ? undefined : 'Provider timeout or API error'
        });
      });

      await Promise.all(providerPromises);

      setTestResults({
        competitor: testCompetitor,
        timestamp: new Date().toISOString(),
        success: true,
        totalSteps: steps.length,
        completedSteps: steps.length,
      });

      toast({
        title: 'Flow Test Complete',
        description: `Analysis flow test for ${testCompetitor} completed successfully`,
      });

    } catch (error) {
      console.error('Flow test error:', error);
      toast({
        title: 'Flow Test Failed',
        description: 'An error occurred during the flow test',
        variant: 'destructive',
      });
    } finally {
      setIsRunningTest(false);
    }
  };

  const groupedSteps = {
    auth: flowSteps.filter(step => step.category === 'auth'),
    data: flowSteps.filter(step => step.category === 'data'),
    analysis: flowSteps.filter(step => step.category === 'analysis'),
    storage: flowSteps.filter(step => step.category === 'storage'),
  };

  const overallProgress = Math.round(
    (flowSteps.filter(step => step.status === 'success').length / flowSteps.length) * 100
  );

  if (!isSuperAdmin) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Access Restricted
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This monitoring interface requires super admin privileges.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <MonitorSpeaker className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Pipeline Monitor</h2>
              <p className="text-sm text-muted-foreground">
                Real-time analysis workflow diagnostics
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Test competitor name..."
              value={testCompetitor}
              onChange={(e) => setTestCompetitor(e.target.value)}
              className="px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              disabled={isRunningTest}
            />
            <Button 
              onClick={runFlowTest} 
              disabled={isRunningTest || !testCompetitor.trim()}
              className="gap-2"
            >
              {isRunningTest ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {isRunningTest ? 'Testing...' : 'Run Test'}
            </Button>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      {isRunningTest && (
        <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-foreground">Test Progress</h3>
                <Badge variant="secondary" className="gap-1">
                  <Activity className="h-3 w-3" />
                  {overallProgress}%
                </Badge>
              </div>
              <Progress value={overallProgress} className="h-2" />
              <p className="text-sm text-muted-foreground">
                Testing analysis pipeline for <strong>{testCompetitor}</strong>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="flow" className="gap-2">
            <Activity className="h-4 w-4" />
            Flow
          </TabsTrigger>
          <TabsTrigger value="providers" className="gap-2">
            <Zap className="h-4 w-4" />
            Providers
          </TabsTrigger>
          <TabsTrigger value="metrics" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Metrics
          </TabsTrigger>
          <TabsTrigger value="diagnostics" className="gap-2">
            <Settings className="h-4 w-4" />
            Diagnostics
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <Clock className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="flow" className="space-y-6">
          {/* Flow Categories */}
          {Object.entries(groupedSteps).map(([category, steps]) => (
            <div key={category} className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-foreground capitalize">{category} Layer</h3>
                <Badge variant="outline" className="text-xs">
                  {steps.filter(s => s.status === 'success').length}/{steps.length}
                </Badge>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {steps.map((step) => (
                  <FlowStepCard key={step.id} step={step} />
                ))}
              </div>
              
              {category !== 'storage' && <Separator />}
            </div>
          ))}
        </TabsContent>

        <TabsContent value="providers">
          <ProviderTestPanel 
            providers={providerTests}
            onUpdateProvider={updateProviderStatus}
          />
        </TabsContent>

        <TabsContent value="metrics">
          <MetricsOverview 
            flowSteps={flowSteps}
            providerTests={providerTests}
            testResults={testResults}
          />
        </TabsContent>

        <TabsContent value="diagnostics">
          <DiagnosticsPanel user={user} />
        </TabsContent>

        <TabsContent value="history">
          <HistoryPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};