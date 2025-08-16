import React from 'react';
import { CompetitorAnalysisEntity, calculateDataCompleteness, getDataQualityLabel } from '@/types/competitor-analysis';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Database, TrendingUp } from 'lucide-react';

interface DataQualityIndicatorsProps {
  analysis: CompetitorAnalysisEntity;
  className?: string;
}

export const DataQualityIndicators: React.FC<DataQualityIndicatorsProps> = ({
  analysis,
  className = ''
}) => {
  const completenessScore = calculateDataCompleteness(analysis);
  const qualityLabel = getDataQualityLabel(completenessScore);
  
  const getQualityColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getQualityVariant = (score: number) => {
    if (score >= 90) return 'default';
    if (score >= 80) return 'secondary';
    if (score >= 70) return 'outline';
    return 'destructive';
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Database className="h-4 w-4" />
          Data Quality Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Completeness */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Data Completeness</span>
            <Badge variant={getQualityVariant(completenessScore)}>
              {qualityLabel}
            </Badge>
          </div>
          <Progress value={completenessScore} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span className={getQualityColor(completenessScore)}>
              {completenessScore}%
            </span>
            <span>100%</span>
          </div>
        </div>

        {/* Confidence Scores */}
        {analysis.confidence_scores && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-3 w-3" />
              <span className="text-sm font-medium">Confidence Metrics</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(analysis.confidence_scores).slice(0, 4).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-muted-foreground capitalize">
                    {key.replace(/_/g, ' ')}
                  </span>
                  <span className="font-medium">{String(value)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Source Citations Count */}
        {analysis.source_citations && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-600" />
              <span>Source Citations</span>
            </div>
            <Badge variant="outline">
              {Array.isArray(analysis.source_citations) 
                ? analysis.source_citations.length 
                : Object.keys(analysis.source_citations).length || 0
              } sources
            </Badge>
          </div>
        )}

        {/* Data Quality Score */}
        {analysis.data_quality_score && analysis.data_quality_score > 0 && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-3 w-3 text-blue-600" />
              <span>Quality Score</span>
            </div>
            <Badge variant="secondary">
              {analysis.data_quality_score}/100
            </Badge>
          </div>
        )}

        {/* Status Indicator */}
        <div className="flex items-center justify-between text-sm border-t pt-3">
          <span>Analysis Status</span>
          <Badge 
            variant={analysis.status === 'completed' ? 'default' : 'outline'}
          >
            {analysis.status}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};