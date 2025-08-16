import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ArrowLeft, 
  RefreshCw, 
  Download, 
  Calendar,
  ExternalLink,
  Users,
  Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ComprehensiveAnalysisButton } from '../ComprehensiveAnalysisButton';
import { AdvancedExportDialog } from '../AdvancedExportDialog';
import type { CompetitorAnalysis } from './types/reportTypes';

interface AnalysisReportHeaderProps {
  analysis: CompetitorAnalysis;
  refreshing: boolean;
  onRefresh: () => void;
}

export const AnalysisReportHeader: React.FC<AnalysisReportHeaderProps> = ({
  analysis,
  refreshing,
  onRefresh
}) => {
  const navigate = useNavigate();
  
  const getStatusConfig = (status: string) => {
    const configs = {
      'completed': { color: 'bg-green-100 text-green-800 border-green-200', label: 'Completed' },
      'pending': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Pending' },
      'analyzing': { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Analyzing' },
      'processing': { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Processing' },
      'failed': { color: 'bg-red-100 text-red-800 border-red-200', label: 'Failed' }
    };
    return configs[status] || configs['pending'];
  };

  const statusConfig = getStatusConfig(analysis.status);
  const analysisResults = (analysis as any)?.analysis_data?.results || [];
  const primaryResult = analysisResults[0] || (analysis as any);

  // Build plain-English confidence explanation for header badge
  const providersUsed: string[] = Array.isArray((analysis as any)?.analysis_data?.providers_used)
    ? (analysis as any).analysis_data.providers_used
    : [];
  const consistencyScoreRaw = typeof (analysis as any)?.confidence_scores?.consistency_score === 'number'
    ? (analysis as any).confidence_scores.consistency_score
    : (typeof (analysis as any)?.analysis_data?.consistency_score === 'number'
        ? (analysis as any).analysis_data.consistency_score
        : null);
  const toPct = (val: number | null) => {
    if (typeof val !== 'number' || isNaN(val)) return null;
    const pct = val <= 1 ? val * 100 : val;
    return Math.max(0, Math.min(100, Math.round(pct)));
  };
  const consistencyPct = toPct(consistencyScoreRaw as any);
  const qualityPct = toPct(typeof (analysis as any)?.data_quality_score === 'number' ? (analysis as any).data_quality_score : null);
  const websiteVerified = (analysis as any)?.website_verified === true;
  const employeeVerified = (analysis as any)?.employee_count_verified === true;

  const explanationParts: string[] = [];
  if (providersUsed.length > 1 && typeof consistencyPct === 'number') explanationParts.push(`cross-provider consistency ${consistencyPct}%`);
  if (websiteVerified) explanationParts.push('website verified');
  if (employeeVerified) explanationParts.push('employee count verified');
  if (typeof qualityPct === 'number') explanationParts.push(`overall data quality ${qualityPct}%`);
  const explanation = `Confidence derived from ${explanationParts.length ? explanationParts.join(', ') : 'provider reliability and available verifications'}.`;


  return (
    <div className="space-y-6">
      {/* Navigation & Actions Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/competitor-analysis')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Analyses
          </Button>
          
          <div className="h-6 w-px bg-border" />
          
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {analysis.name}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge 
                variant="outline" 
                className={`${statusConfig.color} border text-xs font-medium`}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
                {statusConfig.label}
              </Badge>
              
              {/* Replace raw quality label with analysis badge + hover explanation */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="secondary" className="text-xs">This analysis</Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="max-w-xs">
                      <p className="text-xs leading-relaxed">{explanation}</p>
                      {typeof qualityPct === 'number' && (
                        <p className="text-xs text-muted-foreground mt-1">Overall quality: {qualityPct}%</p>
                      )}
                      {providersUsed.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">Providers used: {providersUsed.join(', ')}</p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {analysis.analysis_data?.provider_count > 1 && (
                <Badge variant="outline" className="text-xs">
                  {analysis.analysis_data.provider_count} AI Sources
                </Badge>
              )}

              {Array.isArray(analysis.analysis_data?.providers_used) && analysis.analysis_data.providers_used.length > 0 && (
                <div className="flex flex-wrap items-center gap-1">
                  {analysis.analysis_data.providers_used.map((p: string) => (
                    <Badge key={p} variant="secondary" className="text-2xs">
                      {p}
                    </Badge>
                  ))}
                  {Array.isArray(analysis.analysis_data?.providers_skipped) && analysis.analysis_data.providers_skipped.length > 0 && (
                    <Badge variant="outline" className="text-2xs" title={`Skipped providers: ${analysis.analysis_data.providers_skipped.join(', ')}`}>
                      {analysis.analysis_data.providers_skipped.length} skipped
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <ComprehensiveAnalysisButton
            analysisId={analysis.id}
            companyName={analysis.name}
            onAnalysisComplete={onRefresh}
          />
          
          <Button
            variant="outline"
            onClick={onRefresh}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <AdvancedExportDialog 
            analysis={analysis}
            trigger={
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            }
          />
        </div>
      </div>

      {/* Metadata Card */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-background to-muted/30">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Created</p>
                <p className="text-sm font-semibold">
                  {new Date(analysis.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            {analysis.completed_at && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Clock className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Completed</p>
                  <p className="text-sm font-semibold">
                    {new Date(analysis.completed_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
            
            {primaryResult.website_url && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ExternalLink className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Website</p>
                  <a 
                    href={primaryResult.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-primary hover:underline truncate block max-w-32"
                  >
                    Visit Site
                  </a>
                </div>
              </div>
            )}
            
            {primaryResult.employee_count && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Team Size</p>
                  <p className="text-sm font-semibold">
                    {primaryResult.employee_count.toLocaleString()} employees
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};