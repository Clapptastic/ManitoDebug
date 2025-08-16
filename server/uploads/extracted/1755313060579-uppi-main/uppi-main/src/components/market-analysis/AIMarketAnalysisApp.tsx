import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import MarketSearchPanel, { SearchData } from './MarketSearchPanel';
import MarketAnalysisResults from './MarketAnalysisResults';
import { Loader2 } from 'lucide-react';

const AIMarketAnalysisApp: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const { toast } = useToast();

  const handleSearch = async (searchData: SearchData) => {
    setIsLoading(true);
    setAnalysisData(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to use the market analysis feature.",
          variant: "destructive",
        });
        return;
      }

      // Step 1: Fetch market data or calculate market size
      let stockData = null;
      let newsData = null;
      let marketSizeData = null;

      if (searchData.ticker) {
        const { data: marketDataResponse, error: marketError } = await supabase.functions.invoke('market-data-fetcher', {
          body: { 
            ticker: searchData.ticker,
            timeRange: searchData.timeRange,
            includeNews: searchData.includeNews
          }
        });

        if (marketError) {
          console.error('Market data error:', marketError);
        } else {
          stockData = marketDataResponse.stockData;
        }
      }

      // Step 1b: Calculate market size for market segment research
      if (searchData.type === 'market_segment' && searchData.marketSegment) {
        // TODO: Function 'calculate-market-size' does not exist - fix or implement
        // const { data: marketSizeResponse, error: marketSizeError } = await supabase.functions.invoke('calculate-market-size', {
        //   body: {
        //     industry: searchData.marketSegment,
        //     region: 'global',
        //     targetCustomer: 'all',
        //     timeFrame: searchData.timeRange
        //   }
        // });
        const marketSizeResponse = null, marketSizeError = new Error('calculate-market-size function does not exist');

        if (marketSizeError) {
          console.error('Market size calculation error:', marketSizeError);
        } else {
          marketSizeData = marketSizeResponse;
        }
      }

      // Step 2: Fetch news if requested
      if (searchData.includeNews) {
        const newsQuery = searchData.ticker || searchData.company || searchData.marketSegment || searchData.query;
        const { data: newsResponse, error: newsError } = await supabase.functions.invoke('news-aggregator', {
          body: { 
            query: newsQuery,
            pageSize: 20
          }
        });

        if (newsError) {
          console.error('News fetch error:', newsError);
        } else {
          newsData = newsResponse.articles;
        }
      }

      // Step 3: Get AI analysis
      const analysisQuery = searchData.query || 
        (searchData.type === 'market_segment' ? `Analyze the ${searchData.marketSegment} market including size, growth potential, key players, and trends` :
         searchData.type === 'company_analysis' ? `Analyze ${searchData.company} including market position, financials, and competitive landscape` :
         `Analyze ${searchData.ticker} stock performance and market outlook`);

      // TODO: Function 'ai-market-analyst' does not exist - fix or implement
      // const { data: analysisResponse, error: analysisError } = await supabase.functions.invoke('ai-market-analyst', {
      //   body: {
      //     userId: user.id,
      //     query: analysisQuery,
      //     queryType: searchData.type,
      //     ticker: searchData.ticker,
      //     company: searchData.company,
      //     marketSegment: searchData.marketSegment,
      //     timeRange: searchData.timeRange,
      //     stockData,
      //     newsData,
      //     marketSizeData
      //   }
      // });
      const analysisResponse = null, analysisError = new Error('ai-market-analyst function does not exist');

      if (analysisError) {
        throw new Error(analysisError.message || 'Analysis failed');
      }

      setAnalysisData({
        query: analysisQuery,
        analysis: analysisResponse.analysis,
        stockData,
        newsData,
        marketSizeData,
        sentimentScore: analysisResponse.sentimentScore,
        processingTime: analysisResponse.processingTimeMs,
        ticker: searchData.ticker,
        company: searchData.company,
        marketSegment: searchData.marketSegment,
        researchType: searchData.type,
        technicalIndicators: stockData?.technicalIndicators
      });

      toast({
        title: "Analysis Complete",
        description: "Your market analysis is ready!",
      });

    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze market data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">AI-Powered Market Analysis</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Research companies or market segments with AI-powered analysis including market size, growth rates, competitive landscape, and trends.
          </p>
        </div>

        <MarketSearchPanel onSearch={handleSearch} isLoading={isLoading} />

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <p className="text-muted-foreground">Analyzing market data...</p>
            </div>
          </div>
        )}

        {analysisData && !isLoading && (
          <MarketAnalysisResults {...analysisData} />
        )}
      </div>
    </div>
  );
};

export default AIMarketAnalysisApp;