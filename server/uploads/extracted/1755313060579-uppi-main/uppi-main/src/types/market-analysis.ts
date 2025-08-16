
import { Json } from '@/integrations/supabase/types';

export interface MarketAnalysis {
  id: string;
  user_id: string;
  keyword: string;
  analysis_type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  data: Record<string, unknown>[];
  created_at: string;
  updated_at: string;
  market_analysis_history?: Record<string, unknown>;
}

export interface MarketTrend {
  period: string;
  search_volume: number;
  growth_rate: number;
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface MarketSurvey {
  question: string;
  answers: {
    text: string;
    percentage: number;
  }[];
}

export interface MarketSize {
  tam: number; // Total Addressable Market
  sam: number; // Serviceable Addressable Market
  som: number; // Serviceable Obtainable Market
  currency: string;
  growth_rate: number;
  year: number;
}

export interface CompetitiveAnalysis {
  competitor_name: string;
  market_share: number;
  strengths: string[];
  weaknesses: string[];
}
