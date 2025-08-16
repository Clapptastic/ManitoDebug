import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCompetitorAnalysis } from '@/hooks/useCompetitorAnalysis';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AnalysisComparison } from '@/components/competitor-analysis/AnalysisComparison';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

const ComparisonPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, initialized } = useAuth();
  const { analyses, analysesLoading, fetchAnalyses } = useCompetitorAnalysis();

  useEffect(() => {
    if (initialized && isAuthenticated) {
      fetchAnalyses();
    }
  }, [initialized, isAuthenticated, fetchAnalyses]);

  if (!initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading comparison tool...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>
            Please log in to access the competitor analysis comparison tool.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (analysesLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
            <div className="grid gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
          <BarChart3 className="h-8 w-8" />
          Competitor Analysis Comparison
        </h1>
        <p className="text-muted-foreground">
          Compare competitor analyses side-by-side to identify patterns, opportunities, and competitive advantages.
        </p>
      </div>

      {analyses.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Analyses Available</CardTitle>
          </CardHeader>
          <CardContent className="text-center py-8">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground mb-4">
              You need at least 2 competitor analyses to use the comparison tool.
            </p>
            <p className="text-sm text-muted-foreground">
              Create some analyses first, then return here to compare them.
            </p>
          </CardContent>
        </Card>
      ) : analyses.length === 1 ? (
        <Card>
          <CardHeader>
            <CardTitle>More Analyses Needed</CardTitle>
          </CardHeader>
          <CardContent className="text-center py-8">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground mb-4">
              You have 1 analysis. You need at least 2 analyses to perform comparisons.
            </p>
            <p className="text-sm text-muted-foreground">
              Create additional competitor analyses to unlock comparison features.
            </p>
          </CardContent>
        </Card>
      ) : (
        <AnalysisComparison 
          analyses={analyses.map(analysis => ({
            ...analysis,
            name: analysis.name || 'Unnamed Analysis',
            status: (analysis.status as 'completed' | 'analyzing' | 'pending' | 'failed' | 'processing') || 'completed'
          }))} 
          onAnalysisSelect={(analysisIds) => {
            console.log('Selected analyses for comparison:', analysisIds);
          }}
        />
      )}
    </div>
  );
};

export default ComparisonPage;