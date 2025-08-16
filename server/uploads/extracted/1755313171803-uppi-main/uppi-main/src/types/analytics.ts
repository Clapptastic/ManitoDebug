export interface AnalyticsDataPoint {
  name: string;
  users?: number;
  revenue?: number;
  value?: number;
}

export interface UserGrowthData {
  name: string;
  users: number;
}

export interface RevenueData {
  name: string;
  revenue: number;
}

export interface ConversionData {
  name: string;
  value: number;
}

export interface WebsiteAnalytics {
  unique_visitors: number;
  pageviews: number;
  date: string;
}