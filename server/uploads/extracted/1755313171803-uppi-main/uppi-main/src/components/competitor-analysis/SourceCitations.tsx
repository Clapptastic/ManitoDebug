import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * Source citation shape used across competitor analysis views.
 * Optional props are tolerated to support different providers' payloads.
 *
 * NOTE: This is UI-only normalization. We do not change business logic or data flow.
 */
interface SourceCitation {
  field: string;
  source: string;
  url?: string;
  confidence: number | string; // can be 0..1 or 0..100, or stringified
  competitor_name?: string;
  competitor_index?: number;
  // Common optional fields coming from providers
  data_point?: string;
  reliability_score?: number;
  data_type?: string;
  verified?: boolean;
}

interface SourceCitationsProps {
  citations: SourceCitation[];
  confidenceScores?: {
    overall?: Record<string, unknown>;
    primary_result?: Record<string, number>;
    consistency_score?: number; // 0..1
  };
  analysisData?: unknown; // optional raw analysis data to derive basic fallback citations
}

/**
 * SourceCitations
 * Renders real citations (preferred) and a minimal fallback when necessary.
 * - Uses semantic design tokens (no raw hex/HSL constants here) for consistency with the design system
 * - Fully responsive and accessible
 */
export function SourceCitations({ citations, confidenceScores, analysisData }: SourceCitationsProps) {
  // Prefer real citations coming from AI providers
  const realCitations = Array.isArray(citations) && citations.length > 0 ? citations : [];

  // Normalize confidence values into 0..100 integer
  const normalizeConfidence = (value?: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (typeof num !== 'number' || isNaN(num)) return 0;
    const pct = num <= 1 ? num * 100 : num;
    return Math.max(0, Math.min(100, Math.round(pct)));
  };

  // Semantic color variants aligned with design system tokens
  const getConfidenceClasses = (confidence: number | string) => {
    const pct = normalizeConfidence(confidence);
    if (pct >= 80) return 'text-green-700 bg-green-100 border-green-200';
    if (pct >= 60) return 'text-foreground bg-muted border-border';
    return 'text-red-700 bg-red-100 border-red-200';
  };

  const getConfidenceIcon = (confidence: number | string) => {
    const pct = normalizeConfidence(confidence);
    if (pct >= 80) return <CheckCircle className="h-3 w-3" />;
    if (pct >= 60) return <TrendingUp className="h-3 w-3" />;
    return <AlertCircle className="h-3 w-3" />;
  };

  const getHost = (url?: string) => {
    if (!url) return '';
    try {
      const u = new URL(url);
      return u.hostname.replace(/^www\./, '');
    } catch {
      return '';
    }
  };

  // When no real citations exist, create a very conservative fallback from confidenceScores or analysisData
  const fallbackCitations = React.useMemo(() => {
    if (realCitations.length > 0) return [] as SourceCitation[];

    const generated: SourceCitation[] = [];

    // 1) Prefer confidenceScores.primary_result
    if (confidenceScores?.primary_result) {
      const primary = confidenceScores.primary_result;
      Object.entries(primary).forEach(([field, conf]) => {
        if (typeof conf === 'number' && conf > 0) {
          generated.push({
            field: field.replace(/_/g, ' '),
            source: 'AI Analysis (confidence synthesis)',
            confidence: conf,
            competitor_name: 'Primary Analysis'
          });
        }
      });
      return generated;
    }

    // 2) Minimal signals from analysisData if available
    const base: any = Array.isArray(analysisData) ? analysisData[0] : analysisData;
    if (base && typeof base === 'object') {
      const pushIf = (cond: boolean, field: string, conf = 65) => {
        if (cond) generated.push({ field, source: 'AI Analysis (no explicit source)', confidence: conf });
      };
      pushIf(!!base?.industry, 'industry', 70);
      pushIf(!!base?.employee_count, 'employee_count', 65);
      pushIf(!!base?.founded_year, 'founded_year', 65);
      pushIf(Array.isArray(base?.strengths) && base.strengths.length > 0, 'strengths', 60);
      pushIf(Array.isArray(base?.weaknesses) && base.weaknesses.length > 0, 'weaknesses', 60);
      pushIf(Array.isArray(base?.opportunities) && base.opportunities.length > 0, 'opportunities', 60);
      pushIf(Array.isArray(base?.threats) && base.threats.length > 0, 'threats', 60);
      return generated;
    }

    return [] as SourceCitation[];
  }, [realCitations.length, confidenceScores, analysisData]);

  const displayCitations = realCitations.length > 0 ? realCitations : fallbackCitations;

  // Group by field for a concise, scannable layout
  const groupedCitations = React.useMemo(() => {
    return displayCitations.reduce((acc, raw) => {
      // Normalize a single citation
      const citation: SourceCitation = {
        field: (raw?.field || 'general').toString(),
        source: (raw?.source || 'Unknown source').toString(),
        url: raw?.url,
        confidence: normalizeConfidence(raw?.confidence),
        competitor_name: raw?.competitor_name,
        competitor_index: raw?.competitor_index,
        data_point: (raw as any)?.data_point,
        reliability_score: (raw as any)?.reliability_score,
        data_type: (raw as any)?.data_type,
        verified: (raw as any)?.verified,
      };

      const key = citation.field || 'general';
      if (!acc[key]) acc[key] = [] as SourceCitation[];
      acc[key].push(citation);
      return acc;
    }, {} as Record<string, SourceCitation[]>);
  }, [displayCitations]);

  const consistencyScore = confidenceScores?.consistency_score || 0;
  const hasMultipleProviders = Object.keys(confidenceScores?.overall || {}).length > 1;

  if (!displayCitations || displayCitations.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
            Data Sources & Accuracy
          </CardTitle>
          <CardDescription>
            No source citations available for this analysis
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const ProviderBadge = ({ url, source }: { url?: string; source: string }) => {
    const host = getHost(url);
    const label = host || source;
    return (
      <Badge variant="outline" className="text-xs">
        {label}
      </Badge>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-primary" />
          Data Sources & Accuracy
        </CardTitle>
        <CardDescription>
          Source citations and confidence scores for the analysis data
          {hasMultipleProviders && (
            <span className="ml-2 text-sm font-medium">
              • Multi-API consistency: {Math.round(consistencyScore * 100)}%
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Field-specific Citations */}
        <div className="space-y-3">
          {Object.entries(groupedCitations).map(([field, fieldCitations]) => (
            <section key={field} className="border rounded-lg p-3">
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
                {fieldCitations.map((citation, index) => {
                  // Build a plain-English explanation for how this confidence score was derived
                  const pct = normalizeConfidence(citation.confidence);
                  const parts: string[] = [];
                  if (citation.verified) parts.push('verified data point');
                  if (typeof citation.reliability_score === 'number') parts.push(`provider reliability ${normalizeConfidence(citation.reliability_score)}%`);
                  if (hasMultipleProviders) parts.push(`cross-provider consistency ${Math.round(consistencyScore * 100)}%`);
                  if (citation.url) parts.push(`source ${getHost(citation.url)}`);
                  if (citation.data_type) parts.push(`data type ${citation.data_type}`);
                  const method = parts.length > 0 ? parts.join(', ') : 'provider signals and data consistency';
                  const explanation = `Confidence ${pct}% derived from ${method}.`;

                  return (
                    <article 
                      key={`${field}-${index}`}
                      className="flex items-start justify-between gap-3 p-2 bg-muted/50 rounded"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {citation.source}
                        </p>
                        {citation.data_point && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Data: {citation.data_point}
                          </p>
                        )}
                        {citation.competitor_name && (
                          <p className="text-xs text-muted-foreground mt-1">
                            For: {citation.competitor_name}
                          </p>
                        )}
                        {citation.url && (
                          <p className="text-xs text-muted-foreground mt-1 font-mono break-all">
                            {getHost(citation.url)}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Confidence Score Badge */}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge 
                                className={`text-xs flex items-center gap-1 ${getConfidenceClasses(citation.confidence)}`}
                              >
                                {getConfidenceIcon(citation.confidence)}
                                {pct}%
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="max-w-xs">
                                <p className="text-xs leading-relaxed">{explanation}</p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        {/* Keep provider context and source access for transparency */}
                        <ProviderBadge url={citation.url} source={citation.source} />

                        {citation.url && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <a
                                  href={citation.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 px-2 py-1 text-xs bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors border border-primary/20"
                                  aria-label={`Open source ${citation.source}`}
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  View Source
                                </a>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="max-w-sm">
                                  <p className="font-medium">Source URL:</p>
                                  <p className="text-xs break-all">{citation.url}</p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* Confidence Legend */}
        <div className="flex items-center justify-center gap-4 pt-3 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3 text-primary" />
            <span>High (80%+)</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-foreground" />
            <span>Medium (60-79%)</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3 text-destructive" />
            <span>Low (&lt;60%)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
