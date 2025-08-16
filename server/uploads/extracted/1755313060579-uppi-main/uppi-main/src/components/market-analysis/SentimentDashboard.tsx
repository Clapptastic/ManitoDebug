import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Gauge, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Heart,
  MessageSquare,
  Newspaper
} from 'lucide-react';

interface SentimentData {
  overall: number;
  label: string;
  factors: string[];
}

interface SentimentDashboardProps {
  sentiment: SentimentData;
  ticker?: string;
}

const SentimentDashboard: React.FC<SentimentDashboardProps> = ({ sentiment, ticker }) => {
  const getSentimentColor = (score: number) => {
    if (score > 0.3) return 'text-emerald-600';
    if (score > 0.1) return 'text-emerald-500';
    if (score > -0.1) return 'text-amber-500';
    if (score > -0.3) return 'text-red-500';
    return 'text-red-600';
  };

  const getSentimentBgColor = (score: number) => {
    if (score > 0.3) return 'bg-emerald-100 border-emerald-200';
    if (score > 0.1) return 'bg-emerald-50 border-emerald-100';
    if (score > -0.1) return 'bg-amber-50 border-amber-100';
    if (score > -0.3) return 'bg-red-50 border-red-100';
    return 'bg-red-100 border-red-200';
  };

  const getSentimentIcon = (score: number) => {
    if (score > 0.1) return TrendingUp;
    if (score < -0.1) return TrendingDown;
    return Minus;
  };

  const formatSentimentLabel = (label: string) => {
    return label.replace('_', ' ').toUpperCase();
  };

  const getProgressColor = (score: number) => {
    if (score > 0.2) return 'bg-emerald-500';
    if (score < -0.2) return 'bg-red-500';
    return 'bg-amber-500';
  };

  const SentimentIcon = getSentimentIcon(sentiment.overall);

  // Generate sample sentiment breakdown
  const sentimentBreakdown = [
    {
      source: 'News Articles',
      score: sentiment.overall + (Math.random() - 0.5) * 0.3,
      icon: Newspaper,
      count: Math.floor(15 + Math.random() * 25)
    },
    {
      source: 'Social Media',
      score: sentiment.overall + (Math.random() - 0.5) * 0.4,
      icon: MessageSquare,
      count: Math.floor(50 + Math.random() * 100)
    },
    {
      source: 'Analyst Reports',
      score: sentiment.overall + (Math.random() - 0.5) * 0.2,
      icon: Heart,
      count: Math.floor(3 + Math.random() * 8)
    }
  ];

  return (
    <div className="space-y-6">
      {/* Overall Sentiment Card */}
      <Card className={getSentimentBgColor(sentiment.overall)}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gauge className="h-5 w-5" />
              Overall Market Sentiment
              {ticker && <span className="text-sm font-normal">for {ticker}</span>}
            </div>
            <Badge variant="outline" className={getSentimentColor(sentiment.overall)}>
              {formatSentimentLabel(sentiment.label)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <div className="relative">
                <div className={`text-6xl font-bold ${getSentimentColor(sentiment.overall)}`}>
                  {sentiment.overall.toFixed(2)}
                </div>
                <div className="absolute -top-2 -right-2">
                  <SentimentIcon className={`h-8 w-8 ${getSentimentColor(sentiment.overall)}`} />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Very Negative</span>
                <span>Neutral</span>
                <span>Very Positive</span>
              </div>
              <div className="relative">
                <Progress 
                  value={(sentiment.overall + 1) * 50} 
                  className="h-4"
                />
                <div 
                  className="absolute top-0 h-4 w-1 bg-black rounded"
                  style={{ left: '50%', transform: 'translateX(-50%)' }}
                />
              </div>
              <div className="text-center text-xs text-muted-foreground">
                Score Range: -1.0 (Very Negative) to +1.0 (Very Positive)
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sentiment Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Sentiment by Source</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sentimentBreakdown.map((source, index) => {
              const SourceIcon = source.icon;
              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <SourceIcon className="h-4 w-4" />
                      <span className="font-medium">{source.source}</span>
                      <Badge variant="outline" className="text-xs">
                        {source.count} items
                      </Badge>
                    </div>
                    <div className={`font-bold ${getSentimentColor(source.score)}`}>
                      {source.score.toFixed(2)}
                    </div>
                  </div>
                  <Progress 
                    value={(source.score + 1) * 50} 
                    className="h-2"
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Sentiment Factors */}
      {sentiment.factors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Key Sentiment Factors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sentiment.factors.map((factor, index) => (
                <div key={index} className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span className="text-sm">{factor}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sentiment Timeline (Placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle>Sentiment Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <Gauge className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Sentiment timeline coming soon</p>
            <p className="text-sm">Historical sentiment data will be displayed here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SentimentDashboard;