import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Target, 
  Lightbulb,
  BarChart3,
  Gauge,
  Calendar
} from 'lucide-react';
import StockChart from './StockChart';
import SentimentDashboard from './SentimentDashboard';
import MarketNewsFeed from './MarketNewsFeed';

interface AnalysisResult {
  aiSummary: string;
  insights: string[];
  riskFactors: string[];
  opportunities: string[];
  confidenceScore: number;
  recommendations: string[];
  marketSentiment: {
    overall: number;
    label: string;
    factors: string[];
  };
}

interface MarketData {
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  pe?: number;
  high52w?: number;
  low52w?: number;
  priceHistory?: Array<{ date: string; price: number; volume: number }>;
}

interface MarketAnalysisResultsProps {
  analysis: AnalysisResult;
  marketData?: MarketData;
  ticker?: string;
  query: string;
  newsCount?: number;
  onAskAgain?: () => void;
}

const MarketAnalysisResults: React.FC<MarketAnalysisResultsProps> = ({
  analysis,
  marketData,
  ticker,
  query,
  newsCount = 0,
  onAskAgain
}) => {
  const getSentimentColor = (score: number) => {
    if (score > 0.2) return 'text-emerald-600';
    if (score < -0.2) return 'text-red-600';
    return 'text-amber-600';
  };

  const getSentimentIcon = (score: number) => {
    if (score > 0.2) return TrendingUp;
    if (score < -0.2) return TrendingDown;
    return BarChart3;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const formatNumber = (num: number) => {
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toString();
  };

  const SentimentIcon = getSentimentIcon(analysis.marketSentiment.overall);

  return (
    <div className="space-y-6">
      {/* Query Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Analysis Results</span>
            <Badge variant="outline" className="flex items-center gap-1">
              <Gauge className="h-4 w-4" />
              {Math.round(analysis.confidenceScore * 100)}% Confidence
            </Badge>
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Query: "{query}" {ticker && `• Ticker: ${ticker}`}
          </div>
        </CardHeader>
      </Card>

      {/* Market Data Overview */}
      {marketData && ticker && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Price</p>
                  <p className="text-2xl font-bold">{formatPrice(marketData.price)}</p>
                </div>
                <div className={`text-right ${marketData.changePercent >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  <p className="text-sm font-medium">
                    {marketData.changePercent >= 0 ? '+' : ''}{marketData.changePercent.toFixed(2)}%
                  </p>
                  <p className="text-xs">
                    {marketData.change >= 0 ? '+' : ''}{formatPrice(marketData.change)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Volume</p>
                <p className="text-2xl font-bold">{formatNumber(marketData.volume)}</p>
              </div>
            </CardContent>
          </Card>

          {marketData.marketCap && (
            <Card>
              <CardContent className="pt-6">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Market Cap</p>
                  <p className="text-2xl font-bold">{formatPrice(marketData.marketCap)}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {marketData.pe && (
            <Card>
              <CardContent className="pt-6">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">P/E Ratio</p>
                  <p className="text-2xl font-bold">{marketData.pe.toFixed(2)}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Main Analysis Tabs */}
      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="news">News</TabsTrigger>
        </TabsList>

        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                {analysis.aiSummary.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-4 last:mb-0">
                    {paragraph}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Market Sentiment Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SentimentIcon className={`h-5 w-5 ${getSentimentColor(analysis.marketSentiment.overall)}`} />
                Market Sentiment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Overall Sentiment</span>
                  <Badge className={getSentimentColor(analysis.marketSentiment.overall)}>
                    {analysis.marketSentiment.label}
                  </Badge>
                </div>
                <Progress 
                  value={(analysis.marketSentiment.overall + 1) * 50} 
                  className="h-2"
                />
                <div className="text-sm text-muted-foreground">
                  Score: {analysis.marketSentiment.overall.toFixed(2)} (Range: -1 to +1)
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          {analysis.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Target className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Key Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Key Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {analysis.insights.map((insight, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Lightbulb className="h-4 w-4 mt-0.5 text-blue-500 flex-shrink-0" />
                      <span className="text-sm">{insight}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Opportunities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                  Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {analysis.opportunities.map((opportunity, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <TrendingUp className="h-4 w-4 mt-0.5 text-emerald-600 flex-shrink-0" />
                      <span className="text-sm">{opportunity}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Risk Factors */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  Risk Factors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  {analysis.riskFactors.map((risk, index) => (
                    <Alert key={index}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        {risk}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sentiment Tab */}
        <TabsContent value="sentiment">
          <SentimentDashboard 
            sentiment={analysis.marketSentiment}
            ticker={ticker}
          />
        </TabsContent>

        {/* Charts Tab */}
        <TabsContent value="charts">
          {marketData && ticker ? (
            <StockChart 
              data={marketData}
              ticker={ticker}
            />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No market data available for charting.</p>
                  <p className="text-sm">Provide a ticker symbol to see price charts.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* News Tab */}
        <TabsContent value="news">
          <MarketNewsFeed 
            ticker={ticker}
            newsCount={newsCount}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarketAnalysisResults;