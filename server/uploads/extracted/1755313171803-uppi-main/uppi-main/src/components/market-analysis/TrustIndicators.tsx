import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertCircle, Database, TrendingUp, Shield, Clock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TrustMetrics {
  sourceReliability?: number;
  dataQuality?: number;
  validationStatus?: string;
  lastUpdated?: string;
  sourcesChecked?: number;
  consistencyScore?: number;
  confidenceScores?: {
    overall?: number;
    data_quality?: number;
    methodology?: number;
    source_reliability?: number;
  };
}

interface TrustIndicatorsProps {
  trustMetrics: TrustMetrics;
  dataSources?: string[];
  className?: string;
}

export const TrustIndicators: React.FC<TrustIndicatorsProps> = ({
  trustMetrics,
  dataSources = [],
  className = ''
}) => {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'validated': return 'text-green-600';
      case 'pending': return 'text-yellow-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Shield className="h-4 w-4" />
          Data Trust & Quality Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Data Quality */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Data Quality Score</span>
            <Badge variant={getQualityVariant(trustMetrics.dataQuality || 0)}>
              {trustMetrics.dataQuality || 0}/100
            </Badge>
          </div>
          <Progress value={trustMetrics.dataQuality || 0} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Poor</span>
            <span className={getQualityColor(trustMetrics.dataQuality || 0)}>
              {trustMetrics.dataQuality || 0}%
            </span>
            <span>Excellent</span>
          </div>
        </div>

        {/* Source Reliability */}
        {trustMetrics.sourceReliability && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Source Reliability</span>
              <Badge variant="outline">
                {trustMetrics.sourceReliability}%
              </Badge>
            </div>
            <Progress value={trustMetrics.sourceReliability} className="h-2" />
          </div>
        )}

        {/* Detailed Confidence Scores */}
        {trustMetrics.confidenceScores && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-3 w-3" />
              <span className="text-sm font-medium">Confidence Breakdown</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(trustMetrics.confidenceScores).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-muted-foreground capitalize">
                    {key.replace(/_/g, ' ')}
                  </span>
                  <span className="font-medium">{value}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Data Sources */}
        {dataSources.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Database className="h-3 w-3" />
              <span className="text-sm font-medium">Data Sources</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {dataSources.map((source, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {source}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Validation Status */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            {trustMetrics.validationStatus === 'validated' ? (
              <CheckCircle className="h-3 w-3 text-green-600" />
            ) : (
              <AlertCircle className="h-3 w-3 text-yellow-600" />
            )}
            <span>Validation Status</span>
          </div>
          <Badge 
            variant={trustMetrics.validationStatus === 'validated' ? 'default' : 'outline'}
            className={getStatusColor(trustMetrics.validationStatus || 'unknown')}
          >
            {trustMetrics.validationStatus || 'Unknown'}
          </Badge>
        </div>

        {/* Sources Checked */}
        {(trustMetrics.sourcesChecked !== undefined) && (
          <div className="flex items-center justify-between text-sm">
            <span>Sources Verified</span>
            <Badge variant="secondary">
              {trustMetrics.sourcesChecked} source{trustMetrics.sourcesChecked !== 1 ? 's' : ''}
            </Badge>
          </div>
        )}

        {/* Consistency Score */}
        {(trustMetrics.consistencyScore !== undefined) && (
          <div className="flex items-center justify-between text-sm">
            <span>Cross-Source Consistency</span>
            <Badge variant="outline">
              {Math.round((trustMetrics.consistencyScore || 0) * 100)}%
            </Badge>
          </div>
        )}

        {/* Last Updated */}
        {trustMetrics.lastUpdated && (
          <div className="flex items-center justify-between text-sm border-t pt-3">
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span>Last Updated</span>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <span className="text-muted-foreground">
                    {formatTimeAgo(trustMetrics.lastUpdated)}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{new Date(trustMetrics.lastUpdated).toLocaleString()}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        {/* Trust Level Legend */}
        <div className="flex items-center justify-center gap-4 pt-2 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3 text-green-600" />
            <span>High Trust (90%+)</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-yellow-600" />
            <span>Medium Trust (70-89%)</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3 text-red-600" />
            <span>Low Trust (&lt;70%)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};