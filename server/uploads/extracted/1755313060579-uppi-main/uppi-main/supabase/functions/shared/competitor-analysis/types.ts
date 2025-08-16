
export interface CompetitorAnalysisResult {
  // Core Identity
  id?: string;
  name: string;
  description?: string;
  user_id?: string;
  organization_id?: string;
  
  // Company Information
  website_url?: string;
  website?: string; // Legacy compatibility
  website_verified?: boolean;
  industry?: string;
  headquarters?: string;
  founded_year?: number;
  employee_count?: number;
  employee_count_verified?: boolean;
  business_model?: string;
  
  // SWOT Analysis
  strengths?: string[];
  weaknesses?: string[];
  opportunities?: string[];
  threats?: string[];
  swot_analysis?: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  
  // Market & Strategy
  market_position?: {
    target_audience: string[];
    geographic_presence: string[];
    market_share: number;
    competitive_advantage: string;
  };
  target_market?: string[];
  customer_segments?: string[];
  geographic_presence?: string[];
  market_share_estimate?: number;
  marketShare?: number; // Legacy compatibility
  market_trends?: string[];
  
  // Competitive Analysis
  competitive_advantages?: string[];
  competitive_disadvantages?: string[];
  overall_threat_level?: string;
  
  // Financial & Business Data
  revenue_estimate?: number;
  pricing_strategy?: any;
  pricing?: string; // Legacy compatibility
  funding_info?: any;
  financial_metrics?: any;
  product_portfolio?: any;
  features?: string[]; // Legacy compatibility
  
  // Technology & Innovation
  technology_analysis?: any;
  patent_count?: number;
  certification_standards?: string[];
  innovation_score?: number;
  
  // Social & Governance
  environmental_social_governance?: any;
  social_media_presence?: any;
  key_personnel?: any;
  partnerships?: string[];
  
  // Scores & Analytics
  data_quality_score?: number;
  data_completeness_score?: number;
  brand_strength_score?: number;
  operational_efficiency_score?: number;
  market_sentiment_score?: number;
  confidence_scores?: any;
  normalized_scores?: any;
  
  // Data Sources & Verification
  source_citations?: any;
  api_responses?: any;
  analysis_data?: any;
  last_news_update?: string;
  last_updated_sources?: string;
  
  // Status & Metadata
  status?: string;
  created_at?: string;
  updated_at?: string;
  completed_at?: string;
  provider?: string; // Legacy compatibility
  analysisDate?: string; // Legacy compatibility
  apiStatus?: {
    success: boolean;
    partialSuccess?: boolean;
    error?: string;
  };
}

export type ApiProvider = 'openai' | 'anthropic' | 'gemini' | 'perplexity';
