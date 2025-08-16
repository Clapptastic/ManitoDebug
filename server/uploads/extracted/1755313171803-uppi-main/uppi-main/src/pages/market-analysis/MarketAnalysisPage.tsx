import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Activity,
  Globe
} from 'lucide-react';
import { TrustIndicators } from '@/components/market-analysis/TrustIndicators';
import { SourceCitations } from '@/components/market-analysis/SourceCitations';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface MarketAnalysisSession {
  id: string;
  user_id: string;
  session_type: string;
  query_text: string;
  company_name?: string;
  ticker_symbol?: string;
  market_segment?: string;
  time_range?: string;
  analysis_result?: any;
  confidence_scores?: any;
  source_citations?: any;
  data_quality_score?: number;
  validation_status?: string;
  ai_models_used?: string[];
  sources_checked?: number;
  consistency_score?: number;
  sentiment_score?: number;
  processing_time_ms?: number;
  created_at: string;
  updated_at: string;
}

const MarketAnalysisPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [analysis, setAnalysis] = useState<MarketAnalysisSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (id && user) {
      fetchAnalysis();
    }
  }, [id, user]);

  const fetchAnalysis = async () => {
    if (!id || !user) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('market_analysis_sessions')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setAnalysis(data as MarketAnalysisSession);
    } catch (error) {
      console.error('Error fetching analysis:', error);
      toast({
        title: 'Error',
        description: 'Failed to load market analysis',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAnalysis();
    setIsRefreshing(false);
  };

  const handleExport = () => {
    if (!analysis) return;
    
    const exportData = {
      analysis_id: analysis.id,
      company_name: analysis.company_name,
      ticker_symbol: analysis.ticker_symbol,
      query: analysis.query_text,
      results: analysis.analysis_result,
      confidence_scores: analysis.confidence_scores,
      sources: analysis.source_citations,
      generated_at: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `market-analysis-${analysis.company_name || analysis.ticker_symbol || analysis.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'validated': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatProcessingTime = (ms?: number) => {
    if (!ms) return 'Unknown';
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
  };

  if (!user) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Please log in to view market analysis results.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-3 text-lg text-muted-foreground">Loading analysis...</span>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate('/market-research')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Market Research
          </Button>
        </div>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Market analysis not found or you don't have permission to view it.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate('/market-research')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {analysis.company_name || analysis.ticker_symbol || 'Market Analysis'}
            </h1>
            <p className="text-muted-foreground">
              {analysis.session_type === 'company_analysis' ? 'Company Analysis' : 'Market Segment Analysis'} • 
              {new Date(analysis.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Analysis Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Query & Results */}
          <Card>
            <CardHeader>
              <CardTitle>Analysis Query</CardTitle>
              <CardDescription>
                The original question or request that generated this analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm">{analysis.query_text}</p>
              </div>
            </CardContent>
          </Card>

          {/* Analysis Results */}
          {analysis.analysis_result && (
            <Card>
              <CardHeader>
                <CardTitle>Analysis Results</CardTitle>
                <CardDescription>
                  Detailed findings and insights from the market analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Market Size */}
                {analysis.analysis_result.market_size && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Market Size</h4>
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">TAM</p>
                          <p className="text-lg font-semibold">
                            ${analysis.analysis_result.market_size.tam?.toLocaleString() || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">SAM</p>
                          <p className="text-lg font-semibold">
                            ${analysis.analysis_result.market_size.sam?.toLocaleString() || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Growth Rate</p>
                          <div className="flex items-center space-x-1">
                            {analysis.analysis_result.market_size.growth_rate > 0 ? (
                              <TrendingUp className="h-4 w-4 text-green-500" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-500" />
                            )}
                            <p className="text-lg font-semibold">
                              {analysis.analysis_result.market_size.growth_rate}%
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Key Insights */}
                {analysis.analysis_result.insights && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Key Insights</h4>
                    <div className="space-y-2">
                      {analysis.analysis_result.insights.map((insight: string, index: number) => (
                        <div key={index} className="flex items-start space-x-2 p-3 bg-muted/50 rounded-lg">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Opportunities & Threats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysis.analysis_result.opportunities && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-green-700">Opportunities</h4>
                      <div className="space-y-1">
                        {analysis.analysis_result.opportunities.map((opp: string, index: number) => (
                          <div key={index} className="text-sm p-2 bg-green-50 rounded">
                            • {opp}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {analysis.analysis_result.threats && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-red-700">Threats</h4>
                      <div className="space-y-1">
                        {analysis.analysis_result.threats.map((threat: string, index: number) => (
                          <div key={index} className="text-sm p-2 bg-red-50 rounded">
                            • {threat}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Trust & Metadata */}
        <div className="space-y-6">
          {/* Trust Indicators */}
          <TrustIndicators 
            trustMetrics={{
              sourceReliability: analysis.data_quality_score,
              dataQuality: analysis.data_quality_score,
              validationStatus: analysis.validation_status,
              consistencyScore: analysis.consistency_score,
              confidenceScores: analysis.confidence_scores,
              sourcesChecked: analysis.sources_checked
            }}
          />

          {/* Analysis Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Analysis Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge className={getStatusColor(analysis.validation_status)}>
                  {analysis.validation_status || 'Unknown'}
                </Badge>
              </div>

              {/* Processing Time */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Processing Time</span>
                <span className="text-sm font-medium">
                  {formatProcessingTime(analysis.processing_time_ms)}
                </span>
              </div>

              {/* AI Models Used */}
              {analysis.ai_models_used && analysis.ai_models_used.length > 0 && (
                <div>
                  <span className="text-sm text-muted-foreground block mb-2">AI Models</span>
                  <div className="space-y-1">
                    {analysis.ai_models_used.map((model, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {model}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Sources Checked */}
              {analysis.sources_checked && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Sources Checked</span>
                  <div className="flex items-center space-x-1">
                    <Globe className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">{analysis.sources_checked}</span>
                  </div>
                </div>
              )}

              <Separator />

              {/* Timestamps */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Created</span>
                  <span className="text-sm">
                    {new Date(analysis.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Updated</span>
                  <span className="text-sm">
                    {new Date(analysis.updated_at).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Source Citations */}
          {analysis.source_citations && (
            <SourceCitations citations={Array.isArray(analysis.source_citations) ? analysis.source_citations : []} />
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketAnalysisPage;