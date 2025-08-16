import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMarketSentiment } from '../report/hooks/useMarketSentiment';

interface MarketSentimentAnalyzerProps {
  competitorId: string;
  competitorName: string;
  currentScore?: number;
  analysis?: any;
  onSentimentUpdate?: (newScore: number) => void;
}

export const MarketSentimentAnalyzer: React.FC<MarketSentimentAnalyzerProps> = ({
  competitorId,
  competitorName,
  currentScore = 0,
  analysis,
  onSentimentUpdate
}) => {
  const sentiment = useMarketSentiment(analysis);
  const score = (typeof currentScore === 'number' && currentScore > 0) ? currentScore : sentiment.score;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Market Sentiment Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Current sentiment for {competitorName}
          </p>
          <div className="text-2xl font-bold">
            {Math.round(score)}%
          </div>
          {!sentiment.hasData && (
            <p className="text-sm text-muted-foreground">
              Sentiment score is estimated from available analysis data.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};