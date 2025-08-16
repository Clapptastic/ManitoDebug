import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedCompetitorAnalysis } from '@/hooks/useUnifiedCompetitorAnalysis';
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  RefreshCw,
  Database,
  Brain,
  Zap,
  FileText,
  Settings,
  Eye,
  Activity,
  BarChart3,
  Search,
  Shield,
  Key,
  Workflow,
  GitBranch,
  Save,
  ExternalLink
} from 'lucide-react';

/**
 * ENHANCED COMPETITOR ANALYSIS FLOW DIAGRAM
 * Dynamically reflects backend architecture changes with real-time progress tracking
 */

export interface FlowStep {
  id: string;
  name: string;
  description: string;
  status: 'idle' | 'running' | 'success' | 'warning' | 'error';
  icon: React.ReactNode;
  dependencies: string[];
  edgeFunctions: string[];
  dbTables: string[];
  progress?: number;
  duration?: number;
  error?: string;
  subSteps?: Array<{
    id: string;
    name: string;
    status: 'idle' | 'running' | 'success' | 'warning' | 'error';
  }>;
}

export const EnhancedCompetitorAnalysisFlow: React.FC = () => {
  const [flowSteps, setFlowSteps] = useState<FlowStep[]>([
    {
      id: 'user-input',
      name: 'User Input & Interface',
      description: 'User enters competitors on analysis page',
      status: 'idle',
      icon: <Search className="h-4 w-4" />,
      dependencies: [],
      edgeFunctions: [],
      dbTables: [],
      subSteps: [
        { id: 'dashboard', name: 'Navigate from Dashboard', status: 'idle' },
        { id: 'input-competitors', name: 'Input Competitor Names', status: 'idle' }
      ]
    },
    {
      id: 'authentication',
      name: 'Authentication & Authorization',
      description: 'Verify user session and permissions',
      status: 'idle',
      icon: <Shield className="h-4 w-4" />,
      dependencies: ['user-input'],
      edgeFunctions: ['competitor-analysis-core'],
      dbTables: ['auth.users', 'profiles'],
      subSteps: [
        { id: 'auth-check', name: 'Validate JWT token', status: 'idle' },
        { id: 'permissions', name: 'Check user permissions', status: 'idle' }
      ]
    },
    {
      id: 'admin-prompts',
      name: 'Admin Prompt Integration',
      description: 'Fetch and process admin-configured AI prompts',
      status: 'idle',
      icon: <FileText className="h-4 w-4" />,
      dependencies: ['authentication'],
      edgeFunctions: ['competitor-analysis-core'],
      dbTables: ['prompts'],
      subSteps: [
        { id: 'fetch-main-prompt', name: 'Load competitor_analysis_main prompt', status: 'idle' },
        { id: 'template-vars', name: 'Process template variables', status: 'idle' },
        { id: 'fallback-prompt', name: 'Handle fallback if needed', status: 'idle' }
      ]
    },
    {
      id: 'api-key-management',
      name: 'API Key Validation & Decryption',
      description: 'Fetch, decrypt and validate user API keys',
      status: 'idle',
      icon: <Key className="h-4 w-4" />,
      dependencies: ['admin-prompts'],
      edgeFunctions: ['unified-api-key-manager'],
      dbTables: ['api_keys'],
      subSteps: [
        { id: 'fetch-keys', name: 'Fetch user API keys', status: 'idle' },
        { id: 'decrypt-keys', name: 'Decrypt API keys', status: 'idle' },
        { id: 'validate-formats', name: 'Validate key formats', status: 'idle' }
      ]
    },
    {
      id: 'feature-gate-cost',
      name: 'Feature Gate & Cost Control',
      description: 'Check usage limits and cost controls',
      status: 'idle',
      icon: <Settings className="h-4 w-4" />,
      dependencies: ['api-key-management'],
      edgeFunctions: ['competitor-analysis-gate'],
      dbTables: ['feature_flags', 'user_cost_limits'],
      subSteps: [
        { id: 'usage-limits', name: 'Check usage limits', status: 'idle' },
        { id: 'cost-check', name: 'Validate cost limits', status: 'idle' }
      ]
    },
    {
      id: 'database-setup',
      name: 'Database Setup & Progress Tracking',
      description: 'Initialize analysis record and progress tracking',
      status: 'idle',
      icon: <Database className="h-4 w-4" />,
      dependencies: ['feature-gate-cost'],
      edgeFunctions: ['competitor-analysis-core'],
      dbTables: ['competitor_analyses', 'competitor_analysis_progress'],
      subSteps: [
        { id: 'create-record', name: 'Create analysis record', status: 'idle' },
        { id: 'init-progress', name: 'Initialize progress tracking', status: 'idle' }
      ]
    },
    {
      id: 'master-profile-matching',
      name: 'Master Profile Integration',
      description: 'Search and link to master company profiles',
      status: 'idle',
      icon: <Search className="h-4 w-4" />,
      dependencies: ['database-setup'],
      edgeFunctions: ['find-master-profile-match'],
      dbTables: ['master_company_profiles', 'company_profiles'],
      subSteps: [
        { id: 'search-profiles', name: 'Search existing profiles', status: 'idle' },
        { id: 'create-or-link', name: 'Create new or link existing', status: 'idle' }
      ]
    },
    {
      id: 'ai-gateway-routing',
      name: 'AI Provider Gateway',
      description: 'Select optimal providers and load balancing',
      status: 'idle',
      icon: <Workflow className="h-4 w-4" />,
      dependencies: ['master-profile-matching'],
      edgeFunctions: ['competitor-analysis-core'],
      dbTables: ['api_keys', 'prompts'],
      subSteps: [
        { id: 'provider-selection', name: 'Select optimal providers', status: 'idle' },
        { id: 'load-balancing', name: 'Apply load balancing logic', status: 'idle' }
      ]
    },
    {
      id: 'multi-provider-analysis',
      name: 'Multi-Provider AI Analysis',
      description: 'Parallel analysis across AI providers with failover',
      status: 'idle',
      icon: <Brain className="h-4 w-4" />,
      dependencies: ['ai-gateway-routing'],
      edgeFunctions: ['competitor-analysis-core'],
      dbTables: ['analysis_provider_runs', 'analysis_provider_results'],
      subSteps: [
        { id: 'openai-analysis', name: 'OpenAI GPT-5 Analysis', status: 'idle' },
        { id: 'anthropic-analysis', name: 'Anthropic Claude Analysis', status: 'idle' },
        { id: 'perplexity-analysis', name: 'Perplexity Search Analysis', status: 'idle' },
        { id: 'failover-logic', name: 'Handle provider failover', status: 'idle' }
      ]
    },
    {
      id: 'data-aggregation',
      name: 'Results Aggregation & Scoring',
      description: 'Combine results with confidence scoring',
      status: 'idle',
      icon: <BarChart3 className="h-4 w-4" />,
      dependencies: ['multi-provider-analysis'],
      edgeFunctions: ['competitor-analysis-core'],
      dbTables: ['analysis_combined', 'analysis_provider_results'],
      subSteps: [
        { id: 'aggregate-results', name: 'Aggregate provider results', status: 'idle' },
        { id: 'confidence-scoring', name: 'Calculate confidence scores', status: 'idle' },
        { id: 'quality-assessment', name: 'Data quality assessment', status: 'idle' }
      ]
    },
    {
      id: 'master-profile-enhancement',
      name: 'Master Profile Enhancement',
      description: 'Update master profiles with new insights',
      status: 'idle',
      icon: <GitBranch className="h-4 w-4" />,
      dependencies: ['data-aggregation'],
      edgeFunctions: ['master-profile-ai-enhancer'],
      dbTables: ['master_company_profiles', 'profile_field_contributions', 'profile_quality_metrics'],
      subSteps: [
        { id: 'confidence-boost', name: 'Boost profile confidence', status: 'idle' },
        { id: 'fill-gaps', name: 'Fill missing data points', status: 'idle' },
        { id: 'update-quality', name: 'Update quality metrics', status: 'idle' }
      ]
    },
    {
      id: 'business-insights',
      name: 'Business Intelligence Generation',
      description: 'Generate actionable business insights',
      status: 'idle',
      icon: <Zap className="h-4 w-4" />,
      dependencies: ['master-profile-enhancement'],
      edgeFunctions: ['competitor-analysis-core'],
      dbTables: ['business_insights'],
      subSteps: [
        { id: 'actionable-insights', name: 'Generate actionable insights', status: 'idle' },
        { id: 'strategic-recommendations', name: 'Strategic recommendations', status: 'idle' },
        { id: 'competitive-positioning', name: 'Competitive positioning', status: 'idle' },
        { id: 'swot-analysis', name: 'SWOT analysis generation', status: 'idle' }
      ]
    },
    {
      id: 'data-persistence',
      name: 'Data Persistence & Cleanup',
      description: 'Store results, log costs, and cleanup',
      status: 'idle',
      icon: <Database className="h-4 w-4" />,
      dependencies: ['business-insights'],
      edgeFunctions: ['competitor-analysis-core'],
      dbTables: ['competitor_analyses', 'api_usage_costs', 'audit_logs'],
      subSteps: [
        { id: 'store-results', name: 'Store final results', status: 'idle' },
        { id: 'log-costs', name: 'Log API costs', status: 'idle' },
        { id: 'audit-trail', name: 'Create audit trail', status: 'idle' },
        { id: 'cleanup-temp', name: 'Cleanup temporary data', status: 'idle' }
      ]
    },
    {
      id: 'ui-rendering',
      name: 'UI Updates & Notifications',
      description: 'Real-time UI updates and notifications',
      status: 'idle',
      icon: <Eye className="h-4 w-4" />,
      dependencies: ['data-persistence'],
      edgeFunctions: [],
      dbTables: ['competitor_analyses'],
      subSteps: [
        { id: 'render-results', name: 'Render results to UI', status: 'idle' },
        { id: 'send-notifications', name: 'Send notifications', status: 'idle' },
        { id: 'complete-analysis', name: 'Mark analysis complete', status: 'idle' }
      ]
    }
  ]);

  // Unified competitor analysis hook
  const {
    progress,
    startAnalysis,
    saveAnalysis,
    analyses,
    fetchAnalyses,
    loading,
    error
  } = useUnifiedCompetitorAnalysis();

  const [isAdminFlowMonitoring, setIsAdminFlowMonitoring] = useState(false);
  const [adminFlowSessionId, setAdminFlowSessionId] = useState<string | null>(null);
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null);
  const [overallProgress, setOverallProgress] = useState(0);
  const [lastSavedAnalysisId, setLastSavedAnalysisId] = useState<string | null>(null);
  
  // Analysis form state
  const [competitors, setCompetitors] = useState<string>('Microsoft, Google, Amazon');
  const [analysisName, setAnalysisName] = useState<string>('');
  const [analysisDescription, setAnalysisDescription] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);

  // Load saved analyses on mount
  useEffect(() => {
    fetchAnalyses();
  }, [fetchAnalyses]);

  // Sync with unified analysis progress - but only monitor if started from admin flow
  useEffect(() => {
    if (progress.status !== 'idle') {
      // Check if this analysis was started from admin flow
      if (isAdminFlowMonitoring && progress.sessionId === adminFlowSessionId) {
        setOverallProgress(progress.progress);
        setCurrentAnalysisId(progress.sessionId);
        setIsRunning(progress.status === 'analyzing' || progress.status === 'starting');
        
        // Update flow steps based on progress with enhanced mapping
        if (progress.status === 'analyzing') {
          updateFlowProgressFromMessage('analyzing', progress.progress, progress.statusMessage);
        } else if (progress.status === 'completed') {
          updateFlowProgressFromMessage('completed', 100, 'Analysis completed');
          setIsRunning(false);
        } else if (progress.status === 'error') {
          updateFlowProgressFromMessage('error', progress.progress, progress.error || 'Analysis failed');
          setIsRunning(false);
        }
      }
    } else if (!isRunning) {
      setIsAdminFlowMonitoring(false);
    }
  }, [progress, isAdminFlowMonitoring, adminFlowSessionId]);

  // Real-time monitoring of analysis progress - only for admin flow
  useEffect(() => {
    if (!isAdminFlowMonitoring || !currentAnalysisId) return;

    const channel = supabase
      .channel(`analysis-progress-${currentAnalysisId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'competitor_analyses',
          filter: `id=eq.${currentAnalysisId}`
        },
        (payload) => {
          const newData = payload.new as any;
          if (isAdminFlowMonitoring) {
            updateFlowProgressFromMessage(newData.status, newData.progress_percentage, newData.current_step);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdminFlowMonitoring, currentAnalysisId]);

  const updateFlowProgressFromMessage = (status: string, progress: number, currentStep: string) => {
    setOverallProgress(progress);
    
    setFlowSteps(prev => prev.map((step, index) => {
      // Map progress messages to flow steps
      const stepMapping: { [key: string]: string[] } = {
        'authentication': ['auth', 'session', 'permission'],
        'admin-prompts': ['prompt', 'template'],
        'api-key-management': ['api', 'key', 'decrypt', 'validate'],
        'feature-gate-cost': ['feature', 'gate', 'cost', 'limit'],
        'database-setup': ['database', 'record', 'progress', 'tracking'],
        'master-profile-matching': ['master', 'profile', 'matching', 'search'],
        'ai-gateway-routing': ['gateway', 'routing', 'provider', 'selection'],
        'multi-provider-analysis': ['analysis', 'ai', 'processing', 'provider'],
        'data-aggregation': ['aggregation', 'scoring', 'confidence'],
        'master-profile-enhancement': ['enhancement', 'enrichment'],
        'business-insights': ['insights', 'business', 'intelligence'],
        'data-persistence': ['persistence', 'storage', 'cleanup'],
        'ui-rendering': ['rendering', 'notification', 'complete']
      };
      
      // Find matching step based on current message
      const isCurrentStep = Object.entries(stepMapping).some(([stepId, keywords]) => {
        return step.id === stepId && keywords.some(keyword => 
          currentStep?.toLowerCase().includes(keyword.toLowerCase())
        );
      });
      
      if (isCurrentStep) {
        const newStatus = status === 'completed' ? 'success' : status === 'error' ? 'error' : 'running';
        return { 
          ...step, 
          status: newStatus as FlowStep['status'], 
          progress: newStatus === 'running' ? progress : 100 
        };
      }
      
      // Update based on overall progress and dependencies
      const stepIndex = index;
      const expectedProgress = (stepIndex / prev.length) * 100;
      
      if (progress > expectedProgress + 10) {
        return { ...step, status: 'success' as FlowStep['status'] };
      } else if (Math.abs(progress - expectedProgress) <= 10) {
        return { ...step, status: 'running' as FlowStep['status'] };
      }
      
      return step;
    }));
  };

  const handleStartAnalysis = async () => {
    if (!competitors.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter at least one competitor',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsRunning(true);
      setIsAdminFlowMonitoring(true);
      
      // Generate a unique session ID for admin flow monitoring
      const sessionId = `admin-flow-${Date.now()}`;
      setAdminFlowSessionId(sessionId);
      
      // Reset flow steps with enhanced status tracking
      setFlowSteps(prev => prev.map((step, index) => ({ 
        ...step, 
        status: (index === 0 ? 'running' : 'idle') as FlowStep['status']
      })));
      
      const competitorList = competitors.split(',').map(c => c.trim()).filter(Boolean);
      
      await startAnalysis(competitorList);
      
      toast({
        title: 'Analysis Started from Admin Flow',
        description: `Started analysis for ${competitorList.length} competitors with real-time monitoring`,
      });
    } catch (err) {
      console.error('Failed to start analysis:', err);
      toast({
        title: 'Error',
        description: 'Failed to start competitor analysis',
        variant: 'destructive',
      });
      setIsRunning(false);
      setIsAdminFlowMonitoring(false);
    }
  };

  const handleSaveAnalysis = async () => {
    if (!analysisName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a name for the analysis',
        variant: 'destructive',
      });
      return;
    }

    if (progress.results.length === 0) {
      toast({
        title: 'Error',
        description: 'No analysis results to save',
        variant: 'destructive',
      });
      return;
    }

    try {
      const savedAnalysis = await saveAnalysis(analysisName, analysisDescription, progress.results);
      setLastSavedAnalysisId(savedAnalysis.id);
      setAnalysisName('');
      setAnalysisDescription('');
      
      toast({
        title: 'Analysis Saved',
        description: `Analysis "${analysisName}" has been saved successfully`,
      });
    } catch (err) {
      console.error('Failed to save analysis:', err);
      toast({
        title: 'Error',
        description: 'Failed to save analysis',
        variant: 'destructive',
      });
    }
  };

  const stopMonitoring = () => {
    setIsAdminFlowMonitoring(false);
    setCurrentAnalysisId(null);
    setAdminFlowSessionId(null);
    setOverallProgress(0);
    setIsRunning(false);
    
    // Reset all flow steps to idle
    setFlowSteps(prev => prev.map(step => ({ ...step, status: 'idle' as FlowStep['status'] })));
  };

  const getStepStatusColor = (status: FlowStep['status']) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-500/10 border-green-500/20';
      case 'running': return 'text-blue-600 bg-blue-500/10 border-blue-500/20 animate-pulse';
      case 'error': return 'text-red-600 bg-red-500/10 border-red-500/20';
      case 'warning': return 'text-amber-600 bg-amber-500/10 border-amber-500/20';
      default: return 'text-muted-foreground bg-muted/10 border-border';
    }
  };

  const getStepIcon = (status: FlowStep['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4" />;
      case 'running': return <Clock className="h-4 w-4 animate-spin" />;
      case 'error': return <XCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const completedSteps = flowSteps.filter(step => step.status === 'success').length;
  const totalSteps = flowSteps.length;

  return (
    <div className="space-y-6">
      {/* Analysis Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Run Competitor Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="competitors">Competitors (comma-separated)</Label>
              <Input
                id="competitors"
                value={competitors}
                onChange={(e) => setCompetitors(e.target.value)}
                placeholder="Microsoft, Google, Amazon"
                disabled={isRunning}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="analysisName">Analysis Name (for saving)</Label>
              <Input
                id="analysisName"
                value={analysisName}
                onChange={(e) => setAnalysisName(e.target.value)}
                placeholder="Q4 2024 Analysis"
                disabled={isRunning}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="analysisDescription">Description (optional)</Label>
            <Input
              id="analysisDescription"
              value={analysisDescription}
              onChange={(e) => setAnalysisDescription(e.target.value)}
              placeholder="Quarterly competitive landscape analysis"
              disabled={isRunning}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleStartAnalysis}
                  disabled={isRunning || loading}
                  size="sm"
                >
                  <Play className="mr-2 h-4 w-4" />
                  {isRunning ? 'Running Analysis...' : 'Start Analysis with Flow Monitoring'}
                </Button>
                {progress.status === 'completed' && progress.results.length > 0 && (
                  <Button
                    onClick={handleSaveAnalysis}
                    variant="outline"
                    size="sm"
                    disabled={!analysisName.trim()}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save Analysis
                  </Button>
                )}
              </div>
              {lastSavedAnalysisId && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => window.open(`/market-research/competitor-analysis/saved/${lastSavedAnalysisId}`, '_blank')}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Saved Analysis
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Flow Control Panel */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Admin Flow Monitoring Dashboard
              </CardTitle>
              <div className="text-sm text-muted-foreground mt-1">
                Real-time monitoring of the complete analysis pipeline (only when started from this page)
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={isAdminFlowMonitoring ? stopMonitoring : handleStartAnalysis}
                variant={isAdminFlowMonitoring ? "destructive" : "default"}
                size="sm"
                disabled={isRunning && !isAdminFlowMonitoring}
              >
                {isAdminFlowMonitoring ? (
                  <>
                    <XCircle className="mr-2 h-4 w-4" />
                    Stop Admin Flow Monitoring
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    {isRunning ? 'Running...' : 'Start Admin Flow Analysis'}
                  </>
                )}
              </Button>
              <Button variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center justify-between text-sm mb-1">
                <span>Overall Progress</span>
                <span>{completedSteps}/{totalSteps} steps completed</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>
            <Badge variant={isAdminFlowMonitoring ? "default" : "secondary"}>
              {isAdminFlowMonitoring ? "Admin Flow Active" : "Idle"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Flow Steps Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {flowSteps.map((step, index) => (
          <Card key={step.id} className={`transition-all duration-200 ${getStepStatusColor(step.status)}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="h-6 w-6 p-0 justify-center">
                    {index + 1}
                  </Badge>
                  <div className="flex items-center gap-2">
                    {step.icon}
                    {getStepIcon(step.status)}
                  </div>
                </div>
                <Badge variant={step.status === 'success' ? 'default' : 'secondary'} className="text-xs">
                  {step.status}
                </Badge>
              </div>
              <h3 className="font-semibold text-sm">{step.name}</h3>
              <p className="text-xs text-muted-foreground">{step.description}</p>
            </CardHeader>
            
            <CardContent className="pt-0">
              {/* Dependencies */}
              {step.dependencies.length > 0 && (
                <div className="mb-2">
                  <div className="text-xs font-medium mb-1">Dependencies:</div>
                  <div className="flex flex-wrap gap-1">
                    {step.dependencies.map(dep => (
                      <Badge key={dep} variant="outline" className="text-xs">
                        {dep}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Edge Functions */}
              {step.edgeFunctions.length > 0 && (
                <div className="mb-2">
                  <div className="text-xs font-medium mb-1">Edge Functions:</div>
                  <div className="flex flex-wrap gap-1">
                    {step.edgeFunctions.map(fn => (
                      <Badge key={fn} variant="secondary" className="text-xs">
                        {fn}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Database Tables */}
              {step.dbTables.length > 0 && (
                <div className="mb-2">
                  <div className="text-xs font-medium mb-1">DB Tables:</div>
                  <div className="flex flex-wrap gap-1">
                    {step.dbTables.map(table => (
                      <Badge key={table} variant="outline" className="text-xs">
                        {table}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-steps */}
              {step.subSteps && step.subSteps.length > 0 && (
                <div className="mt-3 space-y-1">
                  <div className="text-xs font-medium">Sub-steps:</div>
                  {step.subSteps.map(subStep => (
                    <div key={subStep.id} className="flex items-center gap-2 text-xs">
                      {getStepIcon(subStep.status)}
                      <span className={subStep.status === 'success' ? 'line-through text-muted-foreground' : ''}>
                        {subStep.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Progress bar for running steps */}
              {step.status === 'running' && (
                <div className="mt-3">
                  <Progress 
                    value={step.progress || 50} 
                    className="h-1" 
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Mermaid Flow Diagram (Text Representation) */}
      <Card>
        <CardHeader>
          <CardTitle>Flow Architecture Diagram</CardTitle>
          <div className="text-sm text-muted-foreground">
            Complete end-to-end competitor analysis flow with real backend architecture
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/30 p-4 rounded-lg font-mono text-xs overflow-x-auto">
            <pre className="whitespace-pre">
{`flowchart TD
    %% User Entry Points
    A[👤 User Dashboard] --> B[🔍 Admin Analysis Page]
    B --> C[📝 Input Competitors]
    
    %% Authentication & Authorization Flow
    C --> D{🔐 Authentication Check}
    D -->|✅ Authenticated| E[🛡️ Authorization Check]
    D -->|❌ Not Auth| F[🚫 Redirect to Login]
    E -->|✅ Authorized| G[📄 Load Admin Prompts]
    E -->|❌ No Access| H[🚫 Access Denied]
    
    %% Admin Prompt & API Key Flow
    G --> I[🔑 API Key Management]
    I --> J[⚙️ Feature Gate & Cost Control]
    J --> K[💾 Database Setup & Progress]
    K --> L[🔍 Master Profile Matching]
    
    %% AI Processing Flow
    L --> M[🌐 AI Gateway Routing]
    M --> N[🧠 Multi-Provider Analysis]
    N --> O[📊 Data Aggregation & Scoring]
    O --> P[🔄 Master Profile Enhancement]
    P --> Q[⚡ Business Insights Generation]
    Q --> R[💾 Data Persistence & Cleanup]
    R --> S[👁️ UI Updates & Notifications]
    
    %% Real-time Progress Updates
    K -.->|📡 WebSocket| T[📊 Admin Flow Monitor]
    N -.->|📡 Live Updates| T
    O -.->|📡 Status| T
    T -.->|📡 Real-time| S
    
    classDef active fill:#22c55e,stroke:#16a34a,stroke-width:3px,color:#fff
    classDef running fill:#3b82f6,stroke:#2563eb,stroke-width:2px,color:#fff
    classDef idle fill:#6b7280,stroke:#4b5563,stroke-width:1px,color:#fff
    classDef error fill:#ef4444,stroke:#dc2626,stroke-width:2px,color:#fff`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedCompetitorAnalysisFlow;