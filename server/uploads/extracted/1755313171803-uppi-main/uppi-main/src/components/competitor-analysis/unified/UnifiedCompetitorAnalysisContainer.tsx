/**
 * UNIFIED Competitor Analysis Container - Single Source of Truth
 * Integrates all competitor analysis functionality into one cohesive component
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  TrendingUp, 
  Users, 
  Globe, 
  DollarSign, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  Plus,
  X
} from 'lucide-react';
import { unifiedCompetitorAnalysisService } from '@/services/competitor-analysis/unified';
import { useCompetitorAnalysisProgress } from '@/hooks/useCompetitorAnalysisProgress';
import { useUnifiedApiKeys } from '@/hooks/useUnifiedApiKeys';
import { toast } from '@/hooks/use-toast';
import type { CompetitorAnalysis } from '@/types/competitor-analysis';

export const UnifiedCompetitorAnalysisContainer: React.FC = () => {
  // State management
  const [activeTab, setActiveTab] = useState('analyze');
  const [competitors, setCompetitors] = useState<string[]>(['']);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [analyses, setAnalyses] = useState<CompetitorAnalysis[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<CompetitorAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Hooks
  const { hasWorkingApis, workingApis, isLoading: apiKeysLoading } = useUnifiedApiKeys();
  const { progress, percentage, loading: progressLoading } = useCompetitorAnalysisProgress(sessionId);

  // Load existing analyses on mount
  useEffect(() => {
    loadAnalyses();
  }, []);

  // Monitor progress and update UI
  useEffect(() => {
    if (progress?.status === 'completed' && sessionId) {
      setIsAnalyzing(false);
      loadAnalyses();
      toast({
        title: 'Analysis Complete',
        description: 'Competitor analysis has been completed successfully.',
      });
    } else if (progress?.status === 'failed') {
      setIsAnalyzing(false);
      toast({
        title: 'Analysis Failed',
        description: progress.error_message || 'Analysis failed. Please try again.',
        variant: 'destructive',
      });
    }
  }, [progress, sessionId]);

  const loadAnalyses = async () => {
    try {
      setIsLoading(true);
      const data = await unifiedCompetitorAnalysisService.getAnalyses();
      setAnalyses(data);
    } catch (error) {
      console.error('Error loading analyses:', error);
      toast({
        title: 'Error',
        description: 'Failed to load analyses. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addCompetitorField = () => {
    setCompetitors([...competitors, '']);
  };

  const removeCompetitorField = (index: number) => {
    const newCompetitors = competitors.filter((_, i) => i !== index);
    setCompetitors(newCompetitors.length > 0 ? newCompetitors : ['']);
  };

  const updateCompetitor = (index: number, value: string) => {
    const newCompetitors = [...competitors];
    newCompetitors[index] = value;
    setCompetitors(newCompetitors);
  };

  const startAnalysis = async () => {
    const validCompetitors = competitors.filter(c => c.trim());
    
    if (validCompetitors.length === 0) {
      toast({
        title: 'No Competitors',
        description: 'Please enter at least one competitor name.',
        variant: 'destructive',
      });
      return;
    }

    if (!hasWorkingApis) {
      toast({
        title: 'API Keys Required',
        description: 'Please add at least one working API key in Settings to start analysis.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsAnalyzing(true);
      const newSessionId = crypto.randomUUID();
      setSessionId(newSessionId);

      await unifiedCompetitorAnalysisService.startAnalysis(
        newSessionId, 
        validCompetitors, 
        workingApis
      );

      toast({
        title: 'Analysis Started',
        description: `Started analysis for ${validCompetitors.length} competitor(s).`,
      });
    } catch (error) {
      setIsAnalyzing(false);
      setSessionId(null);
      console.error('Error starting analysis:', error);
      toast({
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'Failed to start analysis.',
        variant: 'destructive',
      });
    }
  };

  const selectAnalysis = async (analysis: CompetitorAnalysis) => {
    try {
      const detailed = await unifiedCompetitorAnalysisService.getAnalysisById(analysis.id);
      setSelectedAnalysis(detailed);
      setActiveTab('results');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load analysis details.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Competitor Analysis</h1>
          <p className="text-muted-foreground">
            AI-powered competitive intelligence and market analysis
          </p>
        </div>
        
        {/* API Keys Status */}
        <div className="flex items-center gap-2">
          {apiKeysLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : hasWorkingApis ? (
            <Badge variant="outline" className="text-success border-success">
              <CheckCircle className="h-3 w-3 mr-1" />
              {workingApis.length} API{workingApis.length > 1 ? 's' : ''} Ready
            </Badge>
          ) : (
            <Badge variant="destructive">
              <AlertCircle className="h-3 w-3 mr-1" />
              No API Keys
            </Badge>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analyze">New Analysis</TabsTrigger>
          <TabsTrigger value="history">Analysis History</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        {/* New Analysis Tab */}
        <TabsContent value="analyze" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Competitor Analysis Setup
              </CardTitle>
              <CardDescription>
                Enter competitor names to start AI-powered competitive analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Competitor Input Fields */}
              <div className="space-y-3">
                <Label htmlFor="competitors">Competitors to Analyze</Label>
                {competitors.map((competitor, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      placeholder={`Enter competitor ${index + 1} name`}
                      value={competitor}
                      onChange={(e) => updateCompetitor(index, e.target.value)}
                      disabled={isAnalyzing}
                    />
                    {competitors.length > 1 && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => removeCompetitorField(index)}
                        disabled={isAnalyzing}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={addCompetitorField}
                  disabled={isAnalyzing || competitors.length >= 5}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Competitor
                </Button>
              </div>

              <Separator />

              {/* Analysis Controls */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {workingApis.length > 0 ? (
                    `Using ${workingApis.join(', ')} for analysis`
                  ) : (
                    'Add API keys in Settings to enable analysis'
                  )}
                </div>
                <Button 
                  onClick={startAnalysis}
                  disabled={isAnalyzing || !hasWorkingApis || apiKeysLoading}
                  className="min-w-32"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Start Analysis
                    </>
                  )}
                </Button>
              </div>

              {/* Progress Display */}
              {isAnalyzing && progress && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Analysis Progress</span>
                    <span>{Math.round(percentage)}%</span>
                  </div>
                  <Progress value={percentage} className="w-full" />
                  <p className="text-xs text-muted-foreground">
                    {progress.current_competitor ? 
                      `Analyzing ${progress.current_competitor}...` : 
                      'Initializing analysis...'
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analysis History</CardTitle>
              <CardDescription>
                View and manage your previous competitor analyses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  Loading analyses...
                </div>
              ) : analyses.length > 0 ? (
                <div className="space-y-4">
                  {analyses.map((analysis) => (
                    <Card key={analysis.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">{analysis.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {analysis.description || 'No description'}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline">
                                {new Date(analysis.created_at).toLocaleDateString()}
                              </Badge>
                              <Badge variant="secondary">
                                {analysis.status}
                              </Badge>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            onClick={() => selectAnalysis(analysis)}
                          >
                            View Results
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No analyses found</p>
                  <p className="text-sm text-muted-foreground">
                    Start your first competitor analysis to see results here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-4">
          {selectedAnalysis ? (
            <div className="space-y-6">
              {/* Analysis Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {selectedAnalysis.name}
                    <Badge variant="outline">
                      {new Date(selectedAnalysis.created_at).toLocaleDateString()}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {selectedAnalysis.description}
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Analysis Data */}
              {selectedAnalysis.analysis_data && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {/* Key Metrics */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Key Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Data Quality</span>
                        <span className="font-medium">
                          {selectedAnalysis.analysis_data.data_quality_score || 'N/A'}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Founded</span>
                        <span className="font-medium">
                          {selectedAnalysis.analysis_data.founded_year || 'Unknown'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Employees</span>
                        <span className="font-medium">
                          {selectedAnalysis.analysis_data.employee_count || 'Unknown'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Strengths */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2 text-success">
                        <CheckCircle className="h-4 w-4" />
                        Strengths
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1">
                        {selectedAnalysis.analysis_data.strengths?.slice(0, 3).map((strength: string, index: number) => (
                          <div key={index} className="text-sm">
                            • {strength}
                          </div>
                        )) || <p className="text-sm text-muted-foreground">No strengths data</p>}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Weaknesses */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2 text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        Weaknesses
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1">
                        {selectedAnalysis.analysis_data.weaknesses?.slice(0, 3).map((weakness: string, index: number) => (
                          <div key={index} className="text-sm">
                            • {weakness}
                          </div>
                        )) || <p className="text-sm text-muted-foreground">No weaknesses data</p>}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No analysis selected</p>
                <p className="text-sm text-muted-foreground">
                  Select an analysis from the history tab to view detailed results
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};