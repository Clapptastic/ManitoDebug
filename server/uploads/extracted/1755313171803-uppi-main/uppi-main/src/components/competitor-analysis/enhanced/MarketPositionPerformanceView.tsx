import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Target, 
  Award, 
  BarChart3,
  Globe,
  Zap,
  Eye,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { CompetitorAnalysisEntity } from '@/types/competitor';

interface MarketPositionPerformanceViewProps {
  analysis: CompetitorAnalysisEntity;
}

export const MarketPositionPerformanceView: React.FC<MarketPositionPerformanceViewProps> = ({ analysis }) => {
  const marketData = (analysis as any).market_position_data 
    || (analysis as any).analysis_data?.market_position_data
    || (analysis as any).analysis_data?.market_position_performance 
    || (analysis as any).analysis_data?.results?.[0]?.market_position_data 
    || (analysis as any).analysis_data?.results?.[0]?.market_position_performance 
    || {};

  const getPerformanceIcon = (value: string) => {
    if (value?.toLowerCase().includes('high') || value?.toLowerCase().includes('strong') || value?.toLowerCase().includes('growing')) {
      return <ArrowUp className="w-4 h-4 text-green-500" />;
    } else if (value?.toLowerCase().includes('low') || value?.toLowerCase().includes('weak') || value?.toLowerCase().includes('declining')) {
      return <ArrowDown className="w-4 h-4 text-red-500" />;
    }
    return <Minus className="w-4 h-4 text-yellow-500" />;
  };

  const renderMarketShare = () => (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-500" />
          Market Share & Position
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {marketData.market_share_percentage && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Market Share</span>
              <span className="text-lg font-bold text-primary">{marketData.market_share_percentage}%</span>
            </div>
            <Progress value={marketData.market_share_percentage} className="h-3" />
          </div>
        )}
        
        {marketData.competitive_ranking && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Market Ranking</span>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-yellow-500" />
              <span className="font-semibold">#{marketData.competitive_ranking}</span>
            </div>
          </div>
        )}

        {marketData.market_growth_rate && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Growth Rate</span>
            <div className="flex items-center gap-2">
              {getPerformanceIcon(marketData.market_growth_rate)}
              <Badge variant="outline">{marketData.market_growth_rate}</Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderPerformanceMetrics = () => (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-500" />
          Performance Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {marketData.performance_metrics && Object.entries(marketData.performance_metrics).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between">
            <span className="text-sm capitalize">{key.replace('_', ' ')}</span>
            <div className="flex items-center gap-2">
              {getPerformanceIcon(value as string)}
              <Badge variant="secondary">{value as string}</Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );

  const renderMarketTrends = () => (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-purple-500" />
          Market Trends
        </CardTitle>
      </CardHeader>
      <CardContent>
        {marketData.market_trends && marketData.market_trends.length > 0 ? (
          <div className="space-y-2">
            {marketData.market_trends.map((trend: string, idx: number) => (
              <div key={idx} className="flex items-start gap-2">
                <TrendingUp className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
                <span className="text-sm">{trend}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">No market trends data available</div>
        )}
      </CardContent>
    </Card>
  );

  const renderCompetitiveAdvantages = () => (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          Competitive Advantages
        </CardTitle>
      </CardHeader>
      <CardContent>
        {marketData.competitive_advantages && marketData.competitive_advantages.length > 0 ? (
          <div className="grid gap-2">
            {marketData.competitive_advantages.map((advantage: string, idx: number) => (
              <Badge key={idx} variant="default" className="justify-start">
                {advantage}
              </Badge>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">No competitive advantages data available</div>
        )}
      </CardContent>
    </Card>
  );

  const renderChallengesAndOutlook = () => (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-red-500" />
            Market Challenges
          </CardTitle>
        </CardHeader>
        <CardContent>
          {marketData.market_challenges && marketData.market_challenges.length > 0 ? (
            <div className="space-y-2">
              {marketData.market_challenges.map((challenge: string, idx: number) => (
                <div key={idx} className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                  <span className="text-sm">{challenge}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No market challenges data available</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-blue-500" />
            Future Outlook
          </CardTitle>
        </CardHeader>
        <CardContent>
          {marketData.future_outlook ? (
            <p className="text-sm leading-relaxed">{marketData.future_outlook}</p>
          ) : (
            <div className="text-sm text-muted-foreground">No future outlook data available</div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {renderMarketShare()}
        {renderPerformanceMetrics()}
        {renderMarketTrends()}
        {renderCompetitiveAdvantages()}
      </div>
      {renderChallengesAndOutlook()}
    </div>
  );
};