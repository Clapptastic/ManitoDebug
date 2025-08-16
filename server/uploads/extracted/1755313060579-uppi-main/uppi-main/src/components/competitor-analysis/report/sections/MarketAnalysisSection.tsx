import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Globe, 
  Users, 
  Target,
  BarChart3,
  MapPin,
  ArrowUpRight,
  TrendingDown
} from 'lucide-react';
import { MetricCard } from '../ui/MetricCard';
import type { CompetitorAnalysis } from '../types/reportTypes';

interface MarketAnalysisSectionProps {
  analysis: CompetitorAnalysis;
}

export const MarketAnalysisSection: React.FC<MarketAnalysisSectionProps> = ({ analysis }) => {
  const analysisResults = analysis.analysis_data?.results || [];
  const primaryResult = analysisResults[0] || analysis;

  // Fallbacks: pull missing fields from analysis.analysis_data to ensure tabs render data
  const ad: any = (analysis as any).analysis_data || {};
  const market_share_estimate = (analysis as any).market_share_estimate ?? ad.market_share_percentage ?? ad.market_share_estimate ?? 0;
  const market_position = analysis.market_position || ad.market_position || 'Unknown';
  const market_sentiment_score = (analysis as any).market_sentiment_score ?? ad.market_sentiment_score ?? 0;
  const geographic_presence: string[] = (analysis as any).geographic_presence ?? ad.geographic_presence ?? [];
  const target_market: string[] = analysis.target_market ?? ad.target_market ?? [];
  const customer_segments: string[] = (analysis as any).customer_segments ?? ad.customer_segments ?? [];
  const market_trends: string[] = (analysis as any).market_trends ?? ad.market_trends ?? [];

  return (
    <div className="space-y-8">
      {/* Market Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Market Share"
          value={`${market_share_estimate || 0}%`}
          subtitle="Estimated market share"
          icon={BarChart3}
          confidence={analysis.confidence_scores?.market_share_estimate}
        />
        
        <MetricCard
          title="Market Position"
          value={market_position}
          subtitle="Competitive standing"
          icon={Target}
          confidence={analysis.confidence_scores?.market_position}
        />
        
        <MetricCard
          title="Market Sentiment"
          value={`${Math.round(market_sentiment_score || 0)}%`}
          subtitle="Public perception"
          icon={TrendingUp}
          confidence={analysis.confidence_scores?.market_sentiment_score}
        />
        
        <MetricCard
          title="Geographic Reach"
          value={geographic_presence?.length || 0}
          subtitle="Markets served"
          icon={Globe}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Target Markets */}
        {target_market && target_market.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Target Markets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {target_market.slice(0, 6).map((market, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium">{market}</span>
                    <Badge variant="secondary" className="text-xs">
                      Primary
                    </Badge>
                  </div>
                ))}
                {target_market.length > 6 && (
                  <div className="text-center">
                    <Badge variant="outline" className="text-xs">
                      +{target_market.length - 6} more markets
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Customer Segments */}
        {customer_segments && customer_segments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Customer Segments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {customer_segments.slice(0, 6).map((segment, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <span className="font-medium">{segment}</span>
                  </div>
                ))}
                {customer_segments.length > 6 && (
                  <div className="text-center">
                    <Badge variant="outline" className="text-xs">
                      +{customer_segments.length - 6} more segments
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Geographic Presence */}
      {geographic_presence && geographic_presence.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Geographic Presence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {geographic_presence.map((location, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-muted/30 rounded-md">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm font-medium">{location}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Market Trends */}
      {market_trends && market_trends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Market Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {market_trends.slice(0, 5).map((trend, index) => (
                <div key={index} className="flex items-start gap-3 p-4 border rounded-lg">
                  <div className="p-1 bg-blue-50 rounded">
                    <ArrowUpRight className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium leading-relaxed">{trend}</p>
                  </div>
                </div>
              ))}
              {market_trends.length > 5 && (
                <div className="text-center">
                  <Badge variant="outline" className="text-xs">
                    +{market_trends.length - 5} more trends
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Market Analysis Summary */}
      {primaryResult.market_analysis && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Market Analysis Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <p className="text-muted-foreground leading-relaxed">
                {typeof primaryResult.market_analysis === 'string' 
                  ? primaryResult.market_analysis 
                  : primaryResult.market_analysis?.summary || 'No market analysis summary available'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};