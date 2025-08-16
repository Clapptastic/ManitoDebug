
export interface RegionData {
  region: string;
  marketSize: number;
  growthRate: number;
  competitorCount: number;
  [key: string]: string | number; // Index signature for dynamic properties
}

export interface ForecastData {
  period: string;
  projected_growth: number;
  confidence: number;
  [key: string]: string | number; // Index signature for dynamic properties
}

export interface PriceData {
  price_point: string;
  customer_segment: string;
  willingness_to_pay: number;
  conversion_rate: number;
  [key: string]: string | number; // Index signature for dynamic properties
}

export interface TrendDataPoint {
  date: string;
  value: number;
  [key: string]: string | number; // Index signature for dynamic properties
}

export interface TrendData {
  keyword: string;
  data: TrendDataPoint[];
}

export interface MarketResearchData {
  id: string;
  startup_id: string;
  research_type: string;
  data: any;
  created_at?: string;
  updated_at?: string;
}
