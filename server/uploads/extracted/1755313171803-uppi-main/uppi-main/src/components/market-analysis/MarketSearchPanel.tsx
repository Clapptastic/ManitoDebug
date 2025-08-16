import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Search, TrendingUp, Clock } from 'lucide-react';

interface MarketSearchPanelProps {
  onSearch: (params: SearchData) => void;
  isLoading?: boolean;
}

export interface SearchData {
  ticker?: string;
  company?: string;
  marketSegment?: string;
  timeRange: string;
  query?: string;
  analysisType: string;
  includeNews: boolean;
  type: 'ticker_search' | 'company_analysis' | 'market_segment' | 'natural_language';
}

const MarketSearchPanel: React.FC<MarketSearchPanelProps> = ({ onSearch, isLoading = false }) => {
  const [ticker, setTicker] = useState('');
  const [company, setCompany] = useState('');
  const [marketSegment, setMarketSegment] = useState('');
  const [timeRange, setTimeRange] = useState('1m');
  const [query, setQuery] = useState('');
  const [analysisType, setAnalysisType] = useState('comprehensive');
  const [includeNews, setIncludeNews] = useState(true);
  const [researchType, setResearchType] = useState<'company' | 'market_segment'>('company');

  const handleSearch = () => {
    const searchData: SearchData = {
      timeRange,
      query: query || undefined,
      analysisType,
      includeNews,
      type: researchType === 'company' ? 
        (ticker ? 'ticker_search' : 'company_analysis') : 'market_segment'
    };

    if (researchType === 'company') {
      if (ticker) searchData.ticker = ticker;
      if (company) searchData.company = company;
    } else {
      searchData.marketSegment = marketSegment;
    }

    onSearch(searchData);
  };

  const popularQueries = [
    "Electric vehicle market size and growth potential",
    "AI and machine learning market trends",
    "Renewable energy sector market analysis", 
    "E-commerce market growth in 2024",
    "Healthcare technology market opportunities"
  ];

  const handlePopularQuery = (popularQuery: string) => {
    setQuery(popularQuery);
    setResearchType('market_segment');
    setMarketSegment(popularQuery.split(' market')[0]);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          AI Market Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Research Type Selection */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-3 block">Research Type</label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={researchType === 'company' ? 'default' : 'outline'}
                onClick={() => setResearchType('company')}
                className="w-full"
              >
                Company Analysis
              </Button>
              <Button
                variant={researchType === 'market_segment' ? 'default' : 'outline'}
                onClick={() => setResearchType('market_segment')}
                className="w-full"
              >
                Market Segment
              </Button>
            </div>
          </div>

          {/* Company Research Fields */}
          {researchType === 'company' && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Stock Ticker (Optional)
                  </label>
                  <Input
                    placeholder="e.g., AAPL, MSFT, TSLA"
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value.toUpperCase())}
                    className="font-mono"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Company Name
                  </label>
                  <Input
                    placeholder="e.g., Apple Inc, Microsoft"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Market Segment Research Fields */}
          {researchType === 'market_segment' && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Market Segment/Industry
                </label>
                <Input
                  placeholder="e.g., Electric Vehicles, AI/Machine Learning, Healthcare"
                  value={marketSegment}
                  onChange={(e) => setMarketSegment(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Time Range
              </label>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="1m">Last Month</SelectItem>
                  <SelectItem value="3m">Last 3 Months</SelectItem>
                  <SelectItem value="6m">Last 6 Months</SelectItem>
                  <SelectItem value="ytd">Year to Date</SelectItem>
                  <SelectItem value="1y">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Analysis Type
              </label>
              <Select value={analysisType} onValueChange={setAnalysisType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comprehensive">Market Size & Growth</SelectItem>
                  <SelectItem value="competitive">Competitive Analysis</SelectItem>
                  <SelectItem value="trends">Trend Analysis</SelectItem>
                  <SelectItem value="financial">Financial Analysis</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Specific Question (Optional)
            </label>
            <Textarea
              placeholder="Optional: Ask a specific question about market size, growth rates, key players, trends, etc."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="includeNews"
              checked={includeNews}
              onChange={(e) => setIncludeNews(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="includeNews" className="text-sm font-medium">
              Include recent news and market sentiment
            </label>
          </div>
        </div>

        {/* Popular Market Segments */}
        <div>
          <label className="text-sm font-medium mb-3 block">
            Popular Market Segments
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {popularQueries.map((popularQuery, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handlePopularQuery(popularQuery)}
                className="justify-start text-left h-auto py-2 px-3"
                disabled={isLoading}
              >
                <TrendingUp className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">{popularQuery}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Search Button */}
        <Button
          onClick={handleSearch}
          disabled={
            isLoading || 
            (researchType === 'company' && !ticker && !company) ||
            (researchType === 'market_segment' && !marketSegment)
          }
          size="lg"
          className="w-full"
        >
          {isLoading ? (
            <>
              <Clock className="h-4 w-4 mr-2 animate-spin" />
              Analyzing Market Data...
            </>
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              Analyze {researchType === 'company' ? 'Company' : 'Market Segment'}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default MarketSearchPanel;