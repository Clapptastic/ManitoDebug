
/**
 * Types for market size analysis
 */

// Market size data structure
export interface MarketSizeData {
  industry: string;
  region: string;
  totalMarketSize: number;
  growthRate: number;
  timeframeYears: number;
  year?: number;
  competitors?: string[] | { name: string; marketShare: number }[];
  segmentation?: Record<string, any>;
  tam?: number; // Total Addressable Market
  sam?: number; // Serviceable Addressable Market
  som?: number; // Serviceable Obtainable Market
}

// Market region data
export interface RegionData {
  region: string;
  marketSize: number;
  growthRate: number;
  competitorCount: number;
  [key: string]: string | number; // Index signature for dynamic properties
}

// Market forecast data
export interface ForecastData {
  period: string;
  projected_growth: number;
  confidence: number;
  [key: string]: string | number; // Index signature for dynamic properties
}

// Price testing data
export interface PriceData {
  price_point: string;
  customer_segment: string;
  willingness_to_pay: number;
  conversion_rate: number;
  [key: string]: string | number; // Index signature for dynamic properties
}
