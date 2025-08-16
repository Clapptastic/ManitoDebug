/**
 * Unified API Response Types for Competitor Analysis
 * This ensures consistency between edge function output and UI consumption
 */

export interface CompetitorApiResponse {
  name: string;
  overview?: string;
  founded_year?: number;
  headquarters?: string;
  business_model?: string;
  employee_count?: number;
  market_position?: 'leader' | 'challenger' | 'follower' | 'niche';
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  competitive_advantages?: string[];
  target_market?: string[];
  pricing_strategy?: string;
  website_url?: string;
  recent_developments?: string[];
  data_quality_score: number;
  provider_count?: number;
  providers_used?: string[];
  providers_skipped?: string[];
  cost_breakdown?: { provider: string; cost_usd: number }[];
  api_provider?: string;
  source_citations?: string[];
  confidence_scores?: { overall: number };
  status: 'completed' | 'failed' | 'pending';
  analyzed_at?: string;
  analysis_method?: string;
  error?: string;
  session_id?: string;
}

export interface AnalysisApiResponse {
  success: boolean;
  results: CompetitorApiResponse[];
  message?: string;
  session_id: string;
  error?: string;
}

export interface ProgressUpdate {
  session_id: string;
  status: 'initializing' | 'analyzing' | 'completed' | 'failed';
  current_competitor?: string;
  progress_percentage: number;
  total_competitors?: number;
  completed_competitors?: number;
  error_message?: string;
  metadata?: Record<string, any>;
  updated_at: string;
}