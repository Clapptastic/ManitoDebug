import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SavedAnalysesList } from '@/components/competitor-analysis/SavedAnalysesList';
import { useCompetitorAnalysis } from '@/hooks/useCompetitorAnalysis';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Helmet } from 'react-helmet-async';
import { ErrorBoundaryWithFeedback } from '@/components/common/ErrorBoundaryWithFeedback';

/**
 * CONSOLIDATED Saved Analyses Page
 * Single source of truth for viewing saved competitor analyses
 */
const SavedAnalysesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, initialized } = useAuth();
  const {
    analyses,
    analysesLoading,
    fetchAnalyses,
    deleteAnalysis,
    refreshAnalysis,
    updateAnalysis
  } = useCompetitorAnalysis();

  const canonicalUrl = typeof window !== 'undefined' ? `${window.location.origin}/market-research/saved-analyses` : '/market-research/saved-analyses';
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Saved Competitor Analyses",
    description: "Manage and review saved competitor analysis reports.",
    url: canonicalUrl
  };


  useEffect(() => {
    if (initialized && isAuthenticated) {
      fetchAnalyses();
    }
  }, [initialized, isAuthenticated, fetchAnalyses]);

  // Export functionality now handled by ExportAnalysisDialog component
  const handleExportAnalysis = async (analysis: any) => {
    // This function is kept for compatibility but actual export is handled by ExportAnalysisDialog
    console.log('Export function called - using ExportAnalysisDialog component');
  };

  // Show loading while authentication is being established
  if (!initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Initializing...</p>
        </div>
      </div>
    );
  }

  // Show authentication required message
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>
            Please log in to access saved competitor analyses.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Saved Competitor Analyses | Reports</title>
        <meta name="description" content="Manage and review your saved competitor analysis reports." />
        <link rel="canonical" href={canonicalUrl} />
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/market-research/competitor-analysis')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Analysis
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Saved Competitor Analyses</h1>
              <p className="text-muted-foreground">
                Manage and review your saved competitor analysis reports
              </p>
            </div>
          </div>
          
          <Button
            onClick={() => navigate('/market-research/competitor-analysis')}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Analysis
          </Button>
        </div>

        <ErrorBoundaryWithFeedback fallback="Saved analyses are temporarily unavailable. Please try again shortly.">
          <SavedAnalysesList
                      analyses={analyses.map(analysis => ({
                        ...analysis,
                        name: analysis.name || 'Unnamed Analysis'
                      }))}
            loading={analysesLoading}
            onDelete={deleteAnalysis}
            onExport={handleExportAnalysis}
            onRefresh={refreshAnalysis}
            onRefreshList={fetchAnalyses}
            onUpdate={updateAnalysis}
          />
        </ErrorBoundaryWithFeedback>
      </div>
    </div>
    </>
  );
};

export default SavedAnalysesPage;