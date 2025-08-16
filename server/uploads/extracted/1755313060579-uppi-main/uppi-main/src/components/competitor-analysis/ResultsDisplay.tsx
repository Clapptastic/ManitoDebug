/**
 * SINGLE SOURCE OF TRUTH: Results Display
 * This component supports visual variants and can delegate to the modern UI.
 */
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CompetitorCard } from './CompetitorCard';
import { BarChart3, Download, Share2, Filter, Save, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
// Removed ModernResultsDisplay import - consolidated into this component

interface ResultsDisplayProps {
  results: any[];
  onExport?: () => void;
  onSave?: () => void;
  onShare?: () => void;
  onFilter?: () => void;
  loading?: boolean;
  showSaveOption?: boolean;
  savedAnalysisId?: string | null;
  // variant prop removed - component is now consolidated
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  results,
  onExport,
  onSave,
  onShare,
  onFilter,
  loading = false,
  showSaveOption = false,
  savedAnalysisId,
  // variant prop removed
}) => {
  // Modern variant consolidated into this component

  const navigate = useNavigate();
  const { toast } = useToast();
  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!results || results.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center space-y-4">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto" />
            <h3 className="text-lg font-medium">No Analysis Results</h3>
            <p className="text-muted-foreground">
              Start a new analysis to see competitor insights here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getOverallInsights = () => {
    const totalCompetitors = results.length;
    const marketLeaders = results.filter(r => r.market_position === 'leader').length;
    const avgQualityScore = results.reduce((sum, r) => sum + (r.data_quality_score || 0), 0) / totalCompetitors;
    
    return { totalCompetitors, marketLeaders, avgQualityScore };
  };

  const insights = getOverallInsights();

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Analysis Results
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Comprehensive competitor analysis completed
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => {
                  if (savedAnalysisId) {
                    navigate(`/market-research/competitor-analysis/details/${savedAnalysisId}`);
                  } else {
                    navigate('/market-research/saved-analyses');
                  }
                }}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Full Report
              </Button>
              {showSaveOption && onSave && !savedAnalysisId && (
                <Button variant="outline" size="sm" onClick={onSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Analysis
                </Button>
              )}
              {onFilter && (
                <Button variant="outline" size="sm" onClick={onFilter}>
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              )}
              {onShare && (
                <Button variant="outline" size="sm" onClick={onShare}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              )}
              {onExport && (
                <Button variant="outline" size="sm" onClick={onExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Quick Insights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">{insights.totalCompetitors}</div>
              <div className="text-sm text-muted-foreground">Competitors Analyzed</div>
            </div>
            
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-green-600">{insights.marketLeaders}</div>
              <div className="text-sm text-muted-foreground">Market Leaders</div>
            </div>
            
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {Number(insights.avgQualityScore ?? 0).toFixed(0)}%
              </div>
              <div className="text-sm text-muted-foreground">Avg Data Quality</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Market Position Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Market Positioning Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {['leader', 'challenger', 'follower', 'niche'].map(position => {
              const count = results.filter(r => r.market_position === position).length;
              const color = {
                leader: 'bg-green-100 text-green-800',
                challenger: 'bg-blue-100 text-blue-800', 
                follower: 'bg-yellow-100 text-yellow-800',
                niche: 'bg-purple-100 text-purple-800'
              }[position];
              
              return count > 0 ? (
                <Badge key={position} className={color}>
                  {count} {position}{count !== 1 ? 's' : ''}
                </Badge>
              ) : null;
            })}
          </div>
        </CardContent>
      </Card>

      {/* Competitor Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {results.map((competitor, index) => (
          <CompetitorCard
            key={competitor.id || index}
            competitor={competitor}
            onViewDetails={(comp) => {
              // Navigate to saved analysis details if available
              if (savedAnalysisId) {
                navigate(`/market-research/competitor-analysis/details/${savedAnalysisId}`);
              } else if (comp.id) {
                navigate(`/market-research/competitor-analysis/details/${comp.id}`);
              } else {
                // Show analysis data in place instead of navigating with temp ID
                console.log('Competitor data:', comp);
                toast({
                  title: "Analysis Data",
                  description: `Viewing ${comp.name || comp.competitor_name || 'Unknown'} analysis details`,
                });
              }
            }}
          />
        ))}
      </div>

      {/* Analysis Footer */}
      <Card>
        <CardContent className="py-4">
          <div className="text-center text-sm text-muted-foreground">
            <p>
              Analysis completed at {new Date().toLocaleString()} • 
              Powered by AI • Data accuracy may vary
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};