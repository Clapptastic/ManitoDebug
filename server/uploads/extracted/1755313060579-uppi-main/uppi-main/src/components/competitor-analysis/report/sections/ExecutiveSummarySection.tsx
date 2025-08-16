import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  TrendingUp, 
  Shield, 
  Target,
  DollarSign,
  BarChart3,
  MapPin,
  Calendar,
  Users,
  Globe
} from 'lucide-react';
import { MetricCard } from '../ui/MetricCard';
import { ScoreVisualization } from '../ui/ScoreVisualization';
import type { CompetitorAnalysis } from '../types/reportTypes';

interface ExecutiveSummarySectionProps {
  analysis: CompetitorAnalysis;
}

export const ExecutiveSummarySection: React.FC<ExecutiveSummarySectionProps> = ({ analysis }) => {
  const analysisResults = analysis.analysis_data?.results || [];
  const primaryResult = analysisResults[0] || analysis;

  // Prepare performance scores
  const performanceScores = [
    { 
      label: 'Innovation', 
      value: analysis.innovation_score || 0,
      confidence: analysis.confidence_scores?.innovation_score 
    },
    { 
      label: 'Brand Strength', 
      value: analysis.brand_strength_score || 0,
      confidence: analysis.confidence_scores?.brand_strength_score 
    },
    { 
      label: 'Operational Efficiency', 
      value: analysis.operational_efficiency_score || 0,
      confidence: analysis.confidence_scores?.operational_efficiency_score 
    },
    { 
      label: 'Market Sentiment', 
      value: analysis.market_sentiment_score || 0,
      confidence: analysis.confidence_scores?.market_sentiment_score 
    }
  ].filter(score => score.value > 0);

  // Get threat level color
  const getThreatColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  return (
    <div className="space-y-8">
      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Overall Threat Level"
          value={analysis.overall_threat_level || 'Unknown'}
          icon={Shield}
          className={getThreatColor(analysis.overall_threat_level || 'medium')}
          competitorId={analysis.id}
          showInsufficientDataAction={true}
        />
        
        <MetricCard
          title="Market Share"
          value={`${analysis.market_share_estimate || 0}%`}
          subtitle="Estimated market share"
          icon={BarChart3}
          confidence={analysis.confidence_scores?.market_share_estimate}
        />
        
        <MetricCard
          title="Data Quality"
          value={`${Math.round(analysis.data_quality_score || 0)}%`}
          subtitle="Analysis confidence"
          icon={TrendingUp}
        />
        
        <MetricCard
          title="Revenue Estimate"
          value={analysis.revenue_estimate ? 
            `$${(analysis.revenue_estimate / 1000000).toFixed(1)}M` : 
            'N/A'
          }
          subtitle="Annual revenue"
          icon={DollarSign}
          confidence={analysis.confidence_scores?.revenue_estimate}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Company Overview */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Company Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="prose prose-sm max-w-none">
              <p className="text-muted-foreground leading-relaxed">
                {primaryResult.company_overview || 
                 analysis.description || 
                 'No detailed company overview available. This analysis provides insights based on available market data and competitive intelligence.'}
              </p>
            </div>
            
            {/* Key Company Facts */}
            <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t">
              {primaryResult.industry && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">Industry</p>
                  <Badge variant="outline" className="text-xs">
                    {primaryResult.industry}
                  </Badge>
                </div>
              )}
              
              {primaryResult.founded_year && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">Founded</p>
                  <p className="text-sm font-semibold">{primaryResult.founded_year}</p>
                </div>
              )}
              
              {primaryResult.headquarters && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">Headquarters</p>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <p className="text-sm font-semibold">{primaryResult.headquarters}</p>
                  </div>
                </div>
              )}
              
              {primaryResult.employee_count && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">Team Size</p>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <p className="text-sm font-semibold">
                      {primaryResult.employee_count.toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Performance Scores */}
        {performanceScores.length > 0 && (
          <ScoreVisualization
            title="Performance Analysis"
            scores={performanceScores}
            className="h-fit"
          />
        )}
      </div>

      {/* Business Model & Position */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {primaryResult.business_model && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Business Model
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {primaryResult.business_model}
              </p>
            </CardContent>
          </Card>
        )}

        {analysis.market_position && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Market Position
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {analysis.market_position}
              </p>
              
              {analysis.target_market && analysis.target_market.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-muted-foreground font-medium mb-2">Target Markets</p>
                  <div className="flex flex-wrap gap-1">
                    {analysis.target_market.slice(0, 4).map((market, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {market}
                      </Badge>
                    ))}
                    {analysis.target_market.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{analysis.target_market.length - 4} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Multi-API Analysis Indicator */}
      {analysis.analysis_data?.provider_count > 1 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Multi-Source Analysis</h4>
                <p className="text-xs text-muted-foreground">
                  This analysis aggregates data from {analysis.analysis_data.provider_count} AI sources 
                  with {Math.round((analysis.analysis_data?.consistency_score || 0) * 100)}% consistency score
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};