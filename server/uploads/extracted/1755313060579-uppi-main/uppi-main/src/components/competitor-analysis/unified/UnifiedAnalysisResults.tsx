/**
 * UNIFIED Analysis Results Component
 * Stage 4: Frontend Consolidation - Single results display
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Lightbulb,
  Download,
  Save,
  RefreshCw
} from 'lucide-react';
import type { CompetitorAnalysisResult } from '@/types/competitor-analysis';

interface UnifiedAnalysisResultsProps {
  results: CompetitorAnalysisResult[];
  progress?: number;
  status: 'idle' | 'starting' | 'analyzing' | 'completed' | 'error';
  currentCompetitor?: string | null;
  error?: string | null;
  onSave?: () => void;
  onExport?: () => void;
  onRefresh?: () => void;
  loading?: boolean;
}

export const UnifiedAnalysisResults: React.FC<UnifiedAnalysisResultsProps> = ({
  results,
  progress = 0,
  status,
  currentCompetitor,
  error,
  onSave,
  onExport,
  onRefresh,
  loading = false
}) => {
  if (status === 'idle') {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-2">
            <Target className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="text-lg font-medium">Ready to Analyze</h3>
            <p className="text-sm text-muted-foreground">
              Configure your analysis and click "Start Analysis" to begin
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status === 'error' && error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (status === 'starting' || status === 'analyzing') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Analysis in Progress</span>
            <Badge variant="secondary">{Math.round(progress)}%</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={progress} className="w-full" />
          {currentCompetitor && (
            <p className="text-sm text-muted-foreground">
              Analyzing: <span className="font-medium">{currentCompetitor}</span>
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  if (results.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-2">
            <RefreshCw className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="text-lg font-medium">No Results Yet</h3>
            <p className="text-sm text-muted-foreground">
              Analysis completed but no results found
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      {status === 'completed' && (
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="bg-success/10 text-success border-success/20">
            Analysis Complete
          </Badge>
          <div className="flex gap-2">
            {onSave && (
              <Button variant="outline" size="sm" onClick={onSave}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            )}
            {onExport && (
              <Button variant="outline" size="sm" onClick={onExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            )}
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Results Grid */}
      <div className="grid gap-6">
        {results.map((result, index) => (
          <CompetitorCard key={index} result={result} />
        ))}
      </div>
    </div>
  );
};

interface CompetitorCardProps {
  result: CompetitorAnalysisResult;
}

const CompetitorCard: React.FC<CompetitorCardProps> = ({ result }) => {
  const strengths = result.insights || [];
  const opportunities = result.recommendations || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{result.name}</span>
          <Badge variant="outline">
            {(result as any).success ? 'Success' : 'Partial'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Strengths */}
        {strengths.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-success" />
              <h4 className="font-medium">Strengths</h4>
            </div>
            <ul className="space-y-1 ml-6">
              {strengths.slice(0, 3).map((strength, idx) => (
                <li key={idx} className="text-sm text-muted-foreground">
                  • {typeof strength === 'string' ? strength : (strength as any)?.description || 'Insight'}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Opportunities */}
        {opportunities.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-warning" />
              <h4 className="font-medium">Opportunities</h4>
            </div>
            <ul className="space-y-1 ml-6">
              {opportunities.slice(0, 3).map((opportunity, idx) => (
                <li key={idx} className="text-sm text-muted-foreground">
                  • {typeof opportunity === 'string' ? opportunity : (opportunity as any)?.description || 'Opportunity'}
                </li>
              ))}
            </ul>
          </div>
        )}

        {(result as any).error && (
          <Alert variant="destructive">
            <AlertDescription className="text-xs">{(result as any).error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};