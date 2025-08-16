import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { competitorAnalysisService, CompetitorAnalysis } from '@/services/competitorAnalysisService';
import { competitorProgressService, ProgressUpdate } from '@/services/competitorProgressService';
import { Loader2, Search, TrendingUp, Eye, Download, Trash2 } from 'lucide-react';

const CompetitiveAnalysisDashboard: React.FC = () => {
  const [analyses, setAnalyses] = useState<CompetitorAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAnalysis, setNewAnalysis] = useState({
    competitors: '',
    isRunning: false
  });
  const [progress, setProgress] = useState<ProgressUpdate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadAnalyses();
  }, []);

  const loadAnalyses = async () => {
    try {
      const data = await competitorAnalysisService.getAnalyses();
      setAnalyses(data);
    } catch (error) {
      console.error('Error loading analyses:', error);
    } finally {
      setLoading(false);
    }
  };

  const startNewAnalysis = async () => {
    if (!newAnalysis.competitors.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter competitor names',
        variant: 'destructive',
      });
      return;
    }

    const competitors = newAnalysis.competitors
      .split(',')
      .map(c => c.trim())
      .filter(c => c.length > 0);

    if (competitors.length === 0) {
      toast({
        title: 'Error',
        description: 'Please enter valid competitor names',
        variant: 'destructive',
      });
      return;
    }

    try {
      setNewAnalysis(prev => ({ ...prev, isRunning: true }));

      // Check API key requirements
      const apiKeyCheck = await competitorAnalysisService.checkApiKeyRequirements();
      if (!apiKeyCheck.hasRequiredKeys) {
        toast({
          title: 'API Keys Required',
          description: `Please configure the following API keys: ${apiKeyCheck.missingKeys.join(', ')}`,
          variant: 'destructive',
        });
        return;
      }

      // Initialize progress tracking
      const sessionId = await competitorProgressService.initializeProgress(
        competitors.length,
        competitors
      );

      // Subscribe to progress updates
      const unsubscribe = await competitorProgressService.subscribeToProgress(
        sessionId,
        (progressUpdate) => {
          setProgress(progressUpdate);
          if (progressUpdate.status === 'completed' || progressUpdate.status === 'failed') {
            setNewAnalysis(prev => ({ ...prev, isRunning: false }));
            loadAnalyses(); // Refresh the list
            if (progressUpdate.status === 'completed') {
              toast({
                title: 'Analysis Complete',
                description: 'Competitive analysis has been completed successfully',
              });
            }
          }
        }
      );

      // Start the analysis
      await competitorAnalysisService.startAnalysis(sessionId, competitors);

      setNewAnalysis({ competitors: '', isRunning: false });

      // Cleanup subscription after 30 minutes
      setTimeout(() => {
        unsubscribe();
      }, 30 * 60 * 1000);

    } catch (error) {
      console.error('Error starting analysis:', error);
      setNewAnalysis(prev => ({ ...prev, isRunning: false }));
      toast({
        title: 'Error',
        description: 'Failed to start competitive analysis',
        variant: 'destructive',
      });
    }
  };

  const deleteAnalysis = async (id: string) => {
    try {
      await competitorAnalysisService.deleteAnalysis(id);
      setAnalyses(prev => prev.filter(a => a.id !== id));
    } catch (error) {
      console.error('Error deleting analysis:', error);
    }
  };

  const filteredAnalyses = analyses.filter(analysis =>
    analysis.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    analysis.industry?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Competitive Analysis</h2>
          <p className="text-muted-foreground">
            AI-powered competitive intelligence and market analysis
          </p>
        </div>
      </div>

      {/* New Analysis Form */}
      <Card>
        <CardHeader>
          <CardTitle>Start New Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Input
              placeholder="Enter competitor names (comma-separated)"
              value={newAnalysis.competitors}
              onChange={(e) => setNewAnalysis(prev => ({ ...prev, competitors: e.target.value }))}
              disabled={newAnalysis.isRunning}
              className="flex-1"
            />
            <Button
              onClick={startNewAnalysis}
              disabled={newAnalysis.isRunning}
            >
              {newAnalysis.isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Start Analysis'
              )}
            </Button>
          </div>

          {/* Progress Display */}
          {progress && newAnalysis.isRunning && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Analyzing: {progress.currentCompetitor}</span>
                <span>{progress.completedCompetitors}/{progress.totalCompetitors} completed</span>
              </div>
              <Progress value={progress.progressPercentage} className="w-full" />
              {progress.errorMessage && (
                <p className="text-red-500 text-sm">{progress.errorMessage}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search analyses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Analysis List */}
      <div className="grid gap-4">
        {filteredAnalyses.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Analyses Yet</h3>
              <p className="text-muted-foreground">
                Start your first competitive analysis to see insights here.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAnalyses.map((analysis) => (
            <Card key={analysis.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-lg font-semibold">{analysis.name}</h3>
                      <Badge
                        variant="secondary"
                        className={`${getStatusColor(analysis.status)} text-primary-foreground`}
                      >
                        {analysis.status}
                      </Badge>
                      {analysis.data_quality_score && (
                        <Badge variant="outline">
                          Quality: {Math.round(analysis.data_quality_score)}%
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Industry:</span>
                        <p className="font-medium">{analysis.industry || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Employees:</span>
                        <p className="font-medium">{analysis.employee_count || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Founded:</span>
                        <p className="font-medium">{analysis.founded_year || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Cost:</span>
                        <p className="font-medium">$0.00</p>
                      </div>
                    </div>

                    {analysis.description && (
                      <p className="text-muted-foreground mt-3 line-clamp-2">
                        {analysis.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                      <span>Created: {new Date(analysis.created_at).toLocaleDateString()}</span>
                      {analysis.completed_at && (
                        <span>Completed: {new Date(analysis.completed_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteAnalysis(analysis.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default CompetitiveAnalysisDashboard;