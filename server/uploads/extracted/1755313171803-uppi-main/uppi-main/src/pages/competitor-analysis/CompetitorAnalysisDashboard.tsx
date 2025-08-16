import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Zap, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { CompetitorAnalysisForm } from '@/components/competitor-analysis/CompetitorAnalysisForm';
import { AnalysisProgress } from '@/components/competitor-analysis/AnalysisProgress';
import { EnhancedAnalysisDetailView } from '@/components/competitor-analysis/enhanced/EnhancedAnalysisDetailView';
import { useUnifiedApiKeys } from '@/hooks/useUnifiedApiKeys';
import { RecentAnalyses } from '@/components/competitor-analysis/RecentAnalyses';
import { ApiKeyRequirements } from '@/components/competitor-analysis/ApiKeyRequirements';
import { useAnalysisStatusMonitor } from '@/hooks/useAnalysisStatusMonitor';
import { useCompetitorAnalysis } from '@/hooks/useCompetitorAnalysis';
import { competitorAnalysisService } from '@/services/competitorAnalysisService';

const CompetitorAnalysisDashboard: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null);
  const [analysisResults, setAnalysisResults] = useState<any[]>([]);
  
  const { progress, startAnalysis } = useCompetitorAnalysis();
  // Use unified API key status service - SINGLE SOURCE OF TRUTH
  const { statuses: apiStatuses, isLoading: statusLoading, hasWorkingApis, workingApis } = useUnifiedApiKeys();
  const statusMonitor = useAnalysisStatusMonitor(currentAnalysisId);

  const handleStartAnalysis = async (competitors: string[], sessionId: string) => {
    try {
      setCurrentAnalysisId(sessionId);
      setShowAnalysis(false);
      
      const analysisId = await startAnalysis(competitors);
      setAnalysisResults([]);
      
      if (analysisId) {
        setShowAnalysis(true);
        toast({
          title: "Analysis Complete",
          description: `Successfully analyzed ${competitors.length} competitor${competitors.length !== 1 ? 's' : ''}`,
        });
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      toast({
        title: "Analysis Failed",
        description: "There was an error running the analysis. Please check your API keys and try again.",
        variant: "destructive",
      });
    }
  };

  // Monitor analysis status and update UI accordingly
  useEffect(() => {
    if (statusMonitor.status?.status === 'failed') {
      // Analysis has failed - show error
      setShowAnalysis(false);
    }
  }, [statusMonitor.status?.status]);

  // Use workingApis from unified service instead of filtering
  // const workingApis = Object.keys(apiStatuses).filter(api => apiStatuses[api]?.isWorking);
  // const hasWorkingApis = workingApis.length > 0;

  const getProviderStatusDisplay = (provider: string, status: any) => {
    // If no status object or explicitly no key
    if (!status) {
      return (
        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate('/api-keys')}
          className="h-6 text-xs"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Key
        </Button>
      );
    }

    // If key exists but not working (invalid/expired)
    if (status.hasKey && !status.isWorking) {
      return <Badge variant="destructive">Invalid</Badge>;
    }

    // If key exists and working
    if (status.hasKey && status.isWorking) {
      return <Badge variant="default">Ready</Badge>;
    }

    // Fallback for missing key
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={() => navigate('/api-keys')}
        className="h-6 text-xs"
      >
        <Plus className="h-3 w-3 mr-1" />
        Add Key
      </Button>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            AI-Powered Competitor Analysis
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Get comprehensive insights about your competitors using advanced AI analysis across multiple providers
          </p>
        </div>

        {/* Status Banner */}
        {statusMonitor.status && statusMonitor.status.status !== 'starting' && (
          <Card className="border-l-4 border-l-primary">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Analysis Status:</span>
                  {statusMonitor.status?.status === 'failed' ? (
                    <Badge variant="destructive">Failed</Badge>
                  ) : statusMonitor.status?.status === 'analyzing' ? (
                    <Badge variant="secondary">Analyzing</Badge>
                  ) : (
                    <Badge variant="default">Completed</Badge>
                  )}
                </div>
                {statusMonitor.status?.progress !== undefined && (
                  <span className="text-sm text-muted-foreground">
                    {Math.round(statusMonitor.status.progress)}% complete
                  </span>
                )}
              </div>
              {statusMonitor.status?.apiKeyIssues && statusMonitor.status.apiKeyIssues.length > 0 && (
                <p className="text-sm text-destructive mt-2">
                  API Key Issues: {statusMonitor.status.apiKeyIssues.join(', ')}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Analysis Section */}
          <div className="xl:col-span-2 space-y-8">
            {!showAnalysis ? (
              <CompetitorAnalysisForm 
                onAnalyze={handleStartAnalysis}
                loading={progress.status === 'analyzing'}
                apiStatuses={apiStatuses}
                enabledApis={workingApis}
                progress={progress.progress}
              />
            ) : (
              <EnhancedAnalysisDetailView analysisId={currentAnalysisId} />
            )}
            
            {/* Progress Component */}
            {progress.status === 'analyzing' && (
              <AnalysisProgress progress={progress} />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <RecentAnalyses analyses={[]} />
            
            {/* API Key Requirements Info */}
            <ApiKeyRequirements 
              workingApis={workingApis}
              allStatuses={apiStatuses}
            />
            
            {/* Detailed API Provider Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  All Provider Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                   {Object.entries(apiStatuses).map(([provider, status]) => (
                     <div key={provider} className="flex items-center justify-between">
                       <span className="capitalize">{provider}</span>
                       {getProviderStatusDisplay(provider, status)}
                     </div>
                   ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompetitorAnalysisDashboard;