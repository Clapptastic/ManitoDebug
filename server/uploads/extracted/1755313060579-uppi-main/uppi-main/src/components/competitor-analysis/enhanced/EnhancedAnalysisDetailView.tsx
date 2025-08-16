
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, AlertTriangle, RefreshCw, Settings } from 'lucide-react';
import { useAnalysisReport } from '../report/hooks/useAnalysisReport';
import { AnalysisReportContainer } from '../report/AnalysisReportContainer';
import { ReportSkeleton } from '../report/ui/LoadingStates';

interface EnhancedAnalysisDetailViewProps {
  analysisId?: string;
}

export const EnhancedAnalysisDetailView: React.FC<EnhancedAnalysisDetailViewProps> = ({ analysisId }) => {
  const navigate = useNavigate();
  const { analysis, loading, error, refreshAnalysis } = useAnalysisReport(analysisId);

  if (loading) {
    return <ReportSkeleton />;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate('/market-research/competitor-analysis')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Analysis
          </Button>
        </div>
        
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load analysis: {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate('/market-research/competitor-analysis')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Analysis
          </Button>
        </div>
        
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto" />
              <h3 className="text-lg font-medium">Analysis Not Found</h3>
              <p className="text-muted-foreground">
                The requested analysis could not be found or may have been deleted.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if analysis failed or has errors
  const analysisData = analysis.analysis_data;
  const hasErrors = analysisData && Array.isArray(analysisData) && analysisData.some((item: any) => 
    item.status === 'failed' || item.error || (item.provider_errors && item.provider_errors.length > 0)
  );

  if (hasErrors) {
    const failedItem = analysisData.find((item: any) => item.status === 'failed' || item.error);
    
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate('/market-research/competitor-analysis')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Analysis
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Analysis Failed: {analysis.name}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Created: {new Date(analysis.created_at).toLocaleString()}
                </p>
              </div>
              <Badge variant="destructive">Failed</Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Analysis failed with the following errors:</p>
                  {failedItem?.error && (
                    <p>• Main error: {failedItem.error}</p>
                  )}
                  {failedItem?.provider_errors && failedItem.provider_errors.length > 0 && (
                    <div>
                      <p>• Provider errors:</p>
                      <ul className="ml-4 space-y-1">
                        {failedItem.provider_errors.map((error: string, index: number) => (
                          <li key={index} className="text-sm">- {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button onClick={refreshAnalysis} disabled={loading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Analysis
              </Button>
              <Button variant="outline" onClick={() => navigate('/api-keys')}>
                <Settings className="h-4 w-4 mr-2" />
                Check API Keys
              </Button>
            </div>

            {failedItem?.providers_skipped && failedItem.providers_skipped.length > 0 && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Providers Skipped:</h4>
                <div className="flex flex-wrap gap-2">
                  {failedItem.providers_skipped.map((provider: string) => (
                    <Badge key={provider} variant="secondary">
                      {provider}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  These providers were skipped due to API key issues or validation failures.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // If analysis is successful, show the full report
  return <AnalysisReportContainer analysisId={analysisId} />;
};
