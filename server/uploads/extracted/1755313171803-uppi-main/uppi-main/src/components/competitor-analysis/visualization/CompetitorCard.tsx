import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus, ExternalLink } from 'lucide-react';
import { CompetitorAnalysis } from '@/types/competitor/unified-types';

interface CompetitorCardProps {
  competitor: any;
  index: number;
}

export const CompetitorCard: React.FC<CompetitorCardProps> = ({ competitor, index }) => {
  const getMarketShareTrend = (share: number) => {
    if (share > 20) return { icon: TrendingUp, color: 'text-green-500', trend: 'Growing' };
    if (share < 10) return { icon: TrendingDown, color: 'text-red-500', trend: 'Declining' };
    return { icon: Minus, color: 'text-yellow-500', trend: 'Stable' };
  };

  const formatUrl = (url: string) => {
    return url.startsWith('http') ? url : `https://${url}`;
  };

  const TrendIcon = getMarketShareTrend(competitor.market_share || 0).icon;
  const trendColor = getMarketShareTrend(competitor.market_share || 0).color;
  const trendLabel = getMarketShareTrend(competitor.market_share || 0).trend;

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <span className="bg-primary/10 text-primary rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                {index + 1}
              </span>
              {competitor.name}
            </CardTitle>
            {competitor.website && (
              <a
                href={formatUrl(competitor.website)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mt-1"
              >
                {competitor.website}
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          {competitor.market_share && (
            <div className="flex items-center gap-1 text-sm">
              <TrendIcon className={`w-4 h-4 ${trendColor}`} />
              <span className="font-semibold">{competitor.market_share}%</span>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
          {competitor.funding && (
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="text-xs text-muted-foreground">Funding</div>
              <div className="font-semibold">{competitor.funding}</div>
            </div>
          )}
          {competitor.employees && (
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="text-xs text-muted-foreground">Employees</div>
              <div className="font-semibold">{competitor.employees}</div>
            </div>
          )}
        </div>

        {/* Description */}
        {competitor.description && (
          <div>
            <p className="text-sm text-muted-foreground line-clamp-3">
              {competitor.description}
            </p>
          </div>
        )}

        {/* Strengths */}
        {competitor.strengths && competitor.strengths.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-green-700 mb-2">Key Strengths</h4>
            <div className="flex flex-wrap gap-1">
              {competitor.strengths.slice(0, 3).map((strength: string, idx: number) => (
                <Badge key={idx} variant="secondary" className="text-xs bg-green-50 text-green-700">
                  {strength}
                </Badge>
              ))}
              {competitor.strengths.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{competitor.strengths.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Weaknesses */}
        {competitor.weaknesses && competitor.weaknesses.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-red-700 mb-2">Potential Gaps</h4>
            <div className="flex flex-wrap gap-1">
              {competitor.weaknesses.slice(0, 2).map((weakness: string, idx: number) => (
                <Badge key={idx} variant="secondary" className="text-xs bg-red-50 text-red-700">
                  {weakness}
                </Badge>
              ))}
              {competitor.weaknesses.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{competitor.weaknesses.length - 2} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Key Products */}
        {competitor.key_products && competitor.key_products.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Key Products</h4>
            <div className="flex flex-wrap gap-1">
              {competitor.key_products.slice(0, 3).map((product: string, idx: number) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {product}
                </Badge>
              ))}
              {competitor.key_products.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{competitor.key_products.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Competitive Score */}
        {competitor.competitive_score && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Competitive Strength</span>
              <span className="text-sm font-semibold">{competitor.competitive_score}/10</span>
            </div>
            <Progress 
              value={competitor.competitive_score * 10} 
              className="h-2"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};