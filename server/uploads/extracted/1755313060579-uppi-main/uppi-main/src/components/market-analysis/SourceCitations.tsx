import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, TrendingUp, CheckCircle, AlertCircle, Database } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SourceCitation {
  field: string;
  source: string;
  url?: string;
  confidence: number;
  reliability_score?: number;
  data_type?: string;
}

interface SourceCitationsProps {
  citations: SourceCitation[];
  confidenceScores?: {
    overall?: number;
    data_quality?: number;
    methodology?: number;
    source_reliability?: number;
  };
  dataSources?: string[];
  className?: string;
}

export function MarketSourceCitations({ 
  citations, 
  confidenceScores, 
  dataSources = [],
  className = '' 
}: SourceCitationsProps) {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (confidence >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 80) return <CheckCircle className="h-3 w-3" />;
    if (confidence >= 60) return <TrendingUp className="h-3 w-3" />;
    return <AlertCircle className="h-3 w-3" />;
  };

  const averageConfidence = citations.length > 0 
    ? Math.round(citations.reduce((sum, c) => sum + c.confidence, 0) / citations.length)
    : 0;

  const groupedCitations = citations.reduce((acc, citation) => {
    const field = citation.field || 'general';
    if (!acc[field]) acc[field] = [];
    acc[field].push(citation);
    return acc;
  }, {} as Record<string, SourceCitation[]>);

  if (citations.length === 0) {
    return (
      <Card className={`w-full ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
            Source Citations & Verification
          </CardTitle>
          <CardDescription>
            No source citations available for this market analysis
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-primary" />
          Source Citations & Data Verification
        </CardTitle>
        <CardDescription>
          Market data sources with confidence scores and reliability metrics
          {dataSources.length > 0 && (
            <span className="ml-2 text-sm font-medium">
              • {dataSources.length} data source{dataSources.length !== 1 ? 's' : ''} verified
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Quality Metrics */}
        <div className="p-3 bg-muted rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Data Quality Assessment:</span>
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="outline" className="text-xs">
                      <Database className="h-3 w-3 mr-1" />
                      {dataSources.length} Source{dataSources.length !== 1 ? 's' : ''}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Data aggregated from: {dataSources.join(', ')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Badge 
                variant="outline" 
                className={`text-xs ${getConfidenceColor(averageConfidence)}`}
              >
                {averageConfidence}% Avg Confidence
              </Badge>
            </div>
          </div>
          
          {/* Confidence Score Breakdown */}
          {confidenceScores && (
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              {Object.entries(confidenceScores).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-muted-foreground capitalize">
                    {key.replace(/_/g, ' ')}:
                  </span>
                  <span className="font-medium">{value}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Field-specific Citations */}
        <div className="space-y-3">
          {Object.entries(groupedCitations).map(([field, fieldCitations]) => (
            <div key={field} className="border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm capitalize">
                  {field.replace(/_/g, ' ')}
                </h4>
                {fieldCitations.length > 1 && (
                  <Badge variant="secondary" className="text-xs">
                    {fieldCitations.length} sources
                  </Badge>
                )}
              </div>
              
              <div className="space-y-2">
                {fieldCitations.map((citation, index) => (
                  <div 
                    key={index}
                    className="flex items-start justify-between gap-3 p-2 bg-muted/50 rounded"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground truncate">
                        {citation.source}
                      </p>
                      {citation.data_type && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Type: {citation.data_type}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Confidence Score */}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${getConfidenceColor(citation.confidence)}`}>
                              {getConfidenceIcon(citation.confidence)}
                              {citation.confidence}%
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Confidence score for this data point</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      {/* Reliability Score */}
                      {citation.reliability_score && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge variant="outline" className="text-xs">
                                R: {citation.reliability_score}%
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Source reliability score</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      
                      {/* External Link */}
                      {citation.url && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <a
                                href={citation.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 text-muted-foreground hover:text-primary transition-colors"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>View source</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Confidence Legend */}
        <div className="flex items-center justify-center gap-4 pt-3 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3 text-green-600" />
            <span>High (80%+)</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-yellow-600" />
            <span>Medium (60-79%)</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3 text-red-600" />
            <span>Low (&lt;60%)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export { MarketSourceCitations as SourceCitations };
export default MarketSourceCitations;