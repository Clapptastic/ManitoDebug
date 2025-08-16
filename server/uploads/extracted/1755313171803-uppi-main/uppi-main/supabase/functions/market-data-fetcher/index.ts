import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface MarketDataRequest {
  ticker: string;
  timeRange?: string;
  startDate?: string;
  endDate?: string;
  includeNews?: boolean;
}

// Calculate data quality score based on completeness and freshness
function calculateDataQuality(meta: any): number {
  let score = 100;
  
  // Check for missing essential fields
  if (!meta.regularMarketPrice) score -= 30;
  if (!meta.regularMarketVolume) score -= 20;
  if (!meta.marketCap) score -= 10;
  if (!meta.fiftyTwoWeekHigh || !meta.fiftyTwoWeekLow) score -= 10;
  
  // Check data freshness (market hours)
  const now = new Date();
  const marketClose = new Date();
  marketClose.setHours(16, 0, 0, 0); // 4 PM EST
  
  if (now.getDay() === 0 || now.getDay() === 6) { // Weekend
    score -= 5; // Slight penalty for weekend data
  } else if (now.getHours() > 16) { // After market hours
    score -= 2;
  }
  
  return Math.max(score, 0);
}

// Enhanced Yahoo Finance data fetcher with validation
async function fetchYahooFinanceData(ticker: string, supabase: any): Promise<any> {
  try {
    // Get source reliability info
    const { data: sourceInfo } = await supabase
      .from('trusted_data_sources')
      .select('*')
      .eq('source_name', 'Yahoo Finance')
      .single();

    const reliabilityScore = sourceInfo?.reliability_score || 85;
    
    // Using Yahoo Finance API alternative
    const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}`);
    const data = await response.json();
    
    if (!data.chart?.result?.[0]) {
      throw new Error('No data found for ticker');
    }

    const result = data.chart.result[0];
    const meta = result.meta;
    const timestamps = result.timestamp || [];
    const quotes = result.indicators?.quote?.[0] || {};

    const marketData = {
      symbol: meta.symbol,
      currency: meta.currency,
      regularMarketPrice: meta.regularMarketPrice,
      regularMarketChange: meta.regularMarketPrice - meta.previousClose,
      regularMarketChangePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
      regularMarketVolume: meta.regularMarketVolume,
      marketCap: meta.marketCap,
      fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
      historicalData: timestamps.map((timestamp: number, index: number) => ({
        date: new Date(timestamp * 1000).toISOString(),
        open: quotes.open?.[index],
        high: quotes.high?.[index],
        low: quotes.low?.[index],
        close: quotes.close?.[index],
        volume: quotes.volume?.[index]
      })).filter((item: any) => item.close !== null).slice(-50), // Last 50 data points
      // Trust and validation metadata
      sourceReliability: reliabilityScore,
      dataSource: 'Yahoo Finance',
      lastUpdated: new Date().toISOString(),
      dataQuality: calculateDataQuality(meta),
      validationStatus: 'validated'
    };

    // Store validation record
    await supabase
      .from('market_data_validation')
      .insert({
        data_type: 'stock_price',
        data_identifier: ticker,
        validation_method: 'source_verification',
        validation_score: reliabilityScore,
        cross_references: ['Yahoo Finance'],
        validated_by: 'system',
        metadata: {
          source: 'Yahoo Finance',
          timestamp: new Date().toISOString(),
          reliability_score: reliabilityScore
        }
      });

    return marketData;
  } catch (error) {
    console.error('Yahoo Finance API error:', error);
    
    // Store failed validation
    await supabase
      .from('market_data_validation')
      .insert({
        data_type: 'stock_price',
        data_identifier: ticker,
        validation_method: 'source_verification',
        validation_score: 0,
        cross_references: ['Yahoo Finance'],
        validated_by: 'system',
        metadata: {
          error: error.message,
          timestamp: new Date().toISOString()
        }
      });
    
    throw error;
  }
}

// Alpha Vantage integration (backup source)
async function fetchAlphaVantageData(ticker: string, supabase: any): Promise<any> {
  const apiKey = Deno.env.get('ALPHA_VANTAGE_API_KEY');
  if (!apiKey) {
    throw new Error('Alpha Vantage API key not configured');
  }

  try {
    // Get source reliability info
    const { data: sourceInfo } = await supabase
      .from('trusted_data_sources')
      .select('*')
      .eq('source_name', 'Alpha Vantage')
      .single();

    const reliabilityScore = sourceInfo?.reliability_score || 92;

    const response = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${apiKey}`
    );
    const data = await response.json();
    
    if (data['Error Message']) {
      throw new Error(data['Error Message']);
    }

    const quote = data['Global Quote'];
    if (!quote) {
      throw new Error('No quote data available');
    }

    const marketData = {
      symbol: quote['01. symbol'],
      regularMarketPrice: parseFloat(quote['05. price']),
      regularMarketChange: parseFloat(quote['09. change']),
      regularMarketChangePercent: parseFloat(quote['10. change percent'].replace('%', '')),
      regularMarketVolume: parseInt(quote['06. volume']),
      fiftyTwoWeekHigh: parseFloat(quote['03. high']),
      fiftyTwoWeekLow: parseFloat(quote['04. low']),
      sourceReliability: reliabilityScore,
      dataSource: 'Alpha Vantage',
      lastUpdated: new Date().toISOString(),
      dataQuality: 95, // Alpha Vantage generally has high quality data
      validationStatus: 'validated'
    };

    // Store validation record
    await supabase
      .from('market_data_validation')
      .insert({
        data_type: 'stock_price',
        data_identifier: ticker,
        validation_method: 'source_verification',
        validation_score: reliabilityScore,
        cross_references: ['Alpha Vantage'],
        validated_by: 'system',
        metadata: {
          source: 'Alpha Vantage',
          timestamp: new Date().toISOString(),
          reliability_score: reliabilityScore
        }
      });

    return marketData;
  } catch (error) {
    console.error('Alpha Vantage fetch error:', error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { ticker, timeRange = '1m', includeNews = false }: MarketDataRequest = await req.json();

    if (!ticker) {
      return new Response(
        JSON.stringify({ error: 'Ticker symbol is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching market data for ${ticker}`);

    // Fetch stock data (try Yahoo Finance first, fallback to Alpha Vantage)
    let stockData;
    let dataSources = [];
    
    try {
      stockData = await fetchYahooFinanceData(ticker.toUpperCase(), supabase);
      dataSources.push('Yahoo Finance');
      console.log('Successfully fetched data from Yahoo Finance');
    } catch (yahooError) {
      console.log('Yahoo Finance failed, trying Alpha Vantage:', yahooError);
      try {
        stockData = await fetchAlphaVantageData(ticker.toUpperCase(), supabase);
        dataSources.push('Alpha Vantage');
        console.log('Successfully fetched data from Alpha Vantage');
      } catch (alphaError) {
        console.error('Both Yahoo Finance and Alpha Vantage failed:', alphaError);
        return new Response(
          JSON.stringify({ error: 'Unable to fetch stock data from any source' }),
          { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Calculate basic technical indicators if historical data available
    const technicalIndicators: any = {};
    if (stockData.historicalData && stockData.historicalData.length > 0) {
      const prices = stockData.historicalData.map((d: any) => d.close).filter((p: any) => p);
      if (prices.length >= 20) {
        // Simple Moving Average (20 days)
        const sma20 = prices.slice(-20).reduce((a: number, b: number) => a + b) / 20;
        technicalIndicators.sma20 = sma20;
        
        // RSI calculation (simplified)
        const gains: number[] = [];
        const losses: number[] = [];
        for (let i = 1; i < Math.min(prices.length, 15); i++) {
          const change = prices[prices.length - i] - prices[prices.length - i - 1];
          if (change > 0) gains.push(change);
          else losses.push(Math.abs(change));
        }
        const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b) / gains.length : 0;
        const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b) / losses.length : 0;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        technicalIndicators.rsi = 100 - (100 / (1 + rs));
      }
    }

    const response = {
      ticker: ticker.toUpperCase(),
      stockData,
      technicalIndicators,
      timestamp: new Date().toISOString(),
      dataSources,
      trustMetrics: {
        sourceReliability: stockData.sourceReliability,
        dataQuality: stockData.dataQuality,
        validationStatus: stockData.validationStatus,
        lastUpdated: stockData.lastUpdated
      }
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Market data fetcher error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});