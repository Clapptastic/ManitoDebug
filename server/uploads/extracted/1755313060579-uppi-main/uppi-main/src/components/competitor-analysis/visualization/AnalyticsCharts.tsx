import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { TrendingUp, Users, DollarSign, Globe, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AnalyticsChartsProps {
  data: any;
  competitors: any[];
  confidenceScores?: { consistency_score?: number } | any;
  palette?: string[];
}

const DEFAULT_PALETTE = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--chart-6))'
];

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ data, competitors, confidenceScores, palette }) => {
  const colors = palette ?? DEFAULT_PALETTE;
  // Prepare market share data
  const marketShareData = competitors
    .filter(comp => comp.market_share)
    .map((comp, index) => ({
      name: comp.name,
      share: comp.market_share,
      color: colors[index % colors.length]
    }))
    .sort((a, b) => b.share - a.share);

  // Prepare competitive strength data
  const competitiveData = competitors
    .filter(comp => comp.competitive_score)
    .map(comp => ({
      name: comp.name.length > 15 ? comp.name.substring(0, 15) + '...' : comp.name,
      score: comp.competitive_score,
      fullName: comp.name
    }))
    .sort((a, b) => b.score - a.score);

  // Prepare funding data
  const fundingData = competitors
    .filter(comp => comp.funding && comp.funding !== 'Unknown')
    .map(comp => {
      // Parse funding amount (assuming format like "$50M", "$1.2B", etc.)
      const fundingStr = comp.funding;
      let amount = 0;
      if (fundingStr.includes('B')) {
        amount = parseFloat(fundingStr.replace(/[^0-9.]/g, '')) * 1000;
      } else if (fundingStr.includes('M')) {
        amount = parseFloat(fundingStr.replace(/[^0-9.]/g, ''));
      }
      
      return {
        name: comp.name.length > 15 ? comp.name.substring(0, 15) + '...' : comp.name,
        funding: amount,
        fullName: comp.name,
        original: comp.funding
      };
    })
    .filter(item => item.funding > 0)
    .sort((a, b) => b.funding - a.funding);

  // Calculate key metrics
  const totalCompetitors = competitors.length;
  const avgMarketShare = marketShareData.length > 0 
    ? marketShareData.reduce((sum, item) => sum + item.share, 0) / marketShareData.length 
    : 0;
  const topFunding = fundingData.length > 0 ? fundingData[0].original : 'N/A';
  const avgCompetitiveScore = competitiveData.length > 0
    ? competitiveData.reduce((sum, item) => sum + item.score, 0) / competitiveData.length
    : 0;

  return (
    <div className="space-y-6">
      {typeof (confidenceScores?.consistency_score) === 'number' && (
        <div className="flex justify-end">
          <Badge variant="outline">
            Consistency: {Math.round(((confidenceScores.consistency_score <= 1 ? confidenceScores.consistency_score * 100 : confidenceScores.consistency_score) || 0))}%
          </Badge>
        </div>
      )}
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Always real: count of competitors */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Competitors</p>
                <p className="text-2xl font-bold">{totalCompetitors}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Only render when backed by real data */}
        {marketShareData.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Avg Market Share</p>
                  <p className="text-2xl font-bold">{avgMarketShare.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {fundingData.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Top Funding</p>
                  <p className="text-2xl font-bold">{fundingData[0].original}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {competitiveData.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-500" />
                <div>
                  <div className="flex items-center gap-1">
                    <p className="text-sm text-muted-foreground">Avg Score</p>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Competitive strength score on a 0–10 scale. When not provided by the data, it is inferred
                            from provider signals and consistency; higher means stronger competitive position.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-2xl font-bold">{avgCompetitiveScore.toFixed(1)}<span className="text-sm text-muted-foreground">/10</span></p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Market Share Pie Chart */}
        {marketShareData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Market Share Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={marketShareData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="share"
                      label={({ name, share }) => `${name}: ${share}%`}
                    >
                      {marketShareData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Competitive Strength Bar Chart */}
        {competitiveData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Competitive Strength Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={competitiveData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis domain={[0, 10]} />
                    <RechartsTooltip 
                      labelFormatter={(label, payload) => {
                        const item = competitiveData.find(d => d.name === label);
                        return item ? item.fullName : label;
                      }}
                    />
                    <Bar dataKey="score" fill={'hsl(var(--chart-1))'} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Funding Comparison */}
        {fundingData.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Funding Comparison (Millions USD)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={fundingData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <RechartsTooltip 
                      labelFormatter={(label, payload) => {
                        const item = fundingData.find(d => d.name === label);
                        return item ? item.fullName : label;
                      }}
                      formatter={(value: number, name) => [`$${value}M`, 'Funding']}
                    />
                    <Bar dataKey="funding" fill={'hsl(var(--chart-2))'} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Additional Insights */}
      {(marketShareData.length > 0 || competitiveData.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Market Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {marketShareData.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Market Leaders</h4>
                  {marketShareData.slice(0, 3).map((leader, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm">{leader.name}</span>
                      <Badge variant="secondary">{leader.share}% share</Badge>
                    </div>
                  ))}
                </div>
              )}
              {competitiveData.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Strongest Competitors</h4>
                  {competitiveData.slice(0, 3).map((comp, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm">{comp.fullName}</span>
                      <Badge variant="secondary">{comp.score}/10 score</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};