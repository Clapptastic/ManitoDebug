/**
 * MASTER COMPETITOR ANALYSIS TYPES
 * Single source of truth for all competitor analysis data structures
 * 
 * This file consolidates and replaces:
 * - src/types/competitor/unified-types.ts
 * - src/components/competitor-analysis/report/types/reportTypes.ts  
 * - Edge function interfaces
 * 
 * CRITICAL: All field names MUST match database schema exactly
 */

// ======= DATABASE SCHEMA COMPLIANT TYPES =======

export interface CompetitorAnalysisEntity {
  // Core Identity (matches database exactly)
  id: string;
  user_id: string;
  organization_id?: string;
  analysis_id?: string;
  session_id?: string;
  company_profile_id?: string;
  name: string;
  description?: string;
  
  // Status & Timestamps
  status: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  
  // Company Information
  website_url?: string;
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
  swot_analysis?: any;
  
  // Market & Strategy
  market_position?: string;
  target_market?: string[];
  customer_segments?: string[];
  geographic_presence?: string[];
  market_share_estimate?: number;
  market_trends?: string[];
  
  // Competitive Analysis
  competitive_advantages?: string[];
  competitive_disadvantages?: string[];
  overall_threat_level?: string;
  
  // Financial & Business Data
  revenue_estimate?: number;
  pricing_strategy?: any;
  funding_info?: any;
  financial_metrics?: any;
  product_portfolio?: any;
  partnerships?: string[];
  
  // Technology & Innovation
  technology_analysis?: any;
  patent_count?: number;
  certification_standards?: string[];
  innovation_score?: number;
  
  // Social & Governance
  environmental_social_governance?: any;
  social_media_presence?: any;
  key_personnel?: any;
  
  // Scores & Analytics (ALL DATABASE FIELDS)
  data_quality_score?: number;
  data_completeness_score?: number;
  brand_strength_score?: number;
  operational_efficiency_score?: number;
  market_sentiment_score?: number;
  actual_cost?: number;
  confidence_scores?: any;
  normalized_scores?: any;
  
  // AI narrative fields (optional)
  insights?: string[];
  recommendations?: string[];
  
  // Data Sources & Verification
  source_citations?: any;
  api_responses?: any;
  analysis_data?: any;
  market_position_data?: any;
  technology_innovation_data?: any;
  customer_journey_data?: any;
  last_news_update?: string;
  last_updated_sources?: string;
}

// ======= DERIVED TYPES =======

export interface SavedAnalysis extends CompetitorAnalysisEntity {
  // Ensures required timestamp fields for saved analyses
  created_at: string;
  updated_at: string;
  data?: any; // For backward compatibility
}

// Hook-compatible data structure with progress tracking
export interface CompetitorAnalysisData extends CompetitorAnalysisEntity {
  progress_percentage?: number;
  total_competitors?: number;
  analysis_type?: string;
  options?: any;
}

export interface CompetitorAnalysisRequest {
  competitors: string[];
  focusAreas?: string[];
  sessionId?: string;
  enabledApis?: string[];
  mode?: 'full_analysis' | 'find_similar' | 'basic';
  includeSourceAttribution?: boolean;
}

// ======= UI COMPONENT INTERFACES =======

export interface Competitor {
  id: string;
  name: string;
  website?: string;
  description?: string;
  strengths?: string[];
  weaknesses?: string[];
  market_position?: string;
  founded_year?: number;
  employee_count?: number;
  funding_info?: any;
}

export interface SWOTAnalysis {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface MarketAnalysis {
  market_size?: number;
  growth_rate?: number;
  key_trends?: string[];
  target_segments?: string[];
}

export interface AnalysisInsight {
  type: 'strength' | 'weakness' | 'opportunity' | 'threat' | 'trend';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
}

export interface ApiKeyRequirement {
  provider: string;
  required: boolean;
  configured: boolean;
  reason: string;
}

export interface SourceCitation {
  field: string;
  source: string;
  url?: string;
  confidence: number;
  competitor_name?: string;
  competitor_index?: number;
}

export interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ComponentType<any>;
  trend?: 'up' | 'down' | 'neutral';
  confidence?: number;
  className?: string;
  competitorId?: string;
  showInsufficientDataAction?: boolean;
}

export interface ScoreVisualizationProps {
  scores: {
    label: string;
    value: number;
    color?: string;
    confidence?: number;
  }[];
  title?: string;
  className?: string;
}

export interface InsightCardProps {
  title: string;
  insights: string[];
  type: 'strength' | 'weakness' | 'opportunity' | 'threat' | 'neutral';
  confidence?: number;
  sources?: SourceCitation[];
}

export interface ReportSection {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  badge?: string;
  component: React.ComponentType<{ analysis: CompetitorAnalysisEntity }>;
}

// ======= PROGRESS TRACKING =======

export interface AnalysisProgress {
  sessionId: string;
  status: 'idle' | 'starting' | 'analyzing' | 'completed' | 'error';
  currentCompetitor: string | null;
  completedCount: number;
  totalCount: number;
  results: CompetitorAnalysisEntity[];
  error: string | null;
  progress?: number;
  statusMessage?: string;
}

// ======= EXPORT FUNCTIONALITY =======

export interface ExportOptions {
  format: 'json' | 'csv' | 'pdf';
  pdfFormat?: 'basic' | 'comprehensive' | 'executive';
  includeCharts?: boolean;
  customSections?: string[];
  analysisId?: string; // For single analysis export
  analysis_data?: any; // For backward compatibility
}

// ======= BACKWARD COMPATIBILITY ALIASES =======
// These maintain compatibility with existing code while migration happens

export type CompetitorAnalysis = CompetitorAnalysisEntity;
export type CompetitorAnalysisResult = CompetitorAnalysisEntity;
export type CompetitorData = CompetitorAnalysisEntity;

// ======= TYPE GUARDS =======

export function isValidCompetitorAnalysis(obj: any): obj is CompetitorAnalysisEntity {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.user_id === 'string' &&
    typeof obj.name === 'string' &&
    ['pending', 'analyzing', 'completed', 'failed', 'processing'].includes(obj.status)
  );
}

export function isCompletedAnalysis(analysis: CompetitorAnalysisEntity): boolean {
  return analysis.status === 'completed' && !!analysis.completed_at;
}

export function hasFinancialData(analysis: CompetitorAnalysisEntity): boolean {
  return !!(analysis.revenue_estimate || analysis.market_share_estimate || analysis.funding_info);
}

export function hasSwotData(analysis: CompetitorAnalysisEntity): boolean {
  return !!(
    analysis.strengths?.length ||
    analysis.weaknesses?.length ||
    analysis.opportunities?.length ||
    analysis.threats?.length
  );
}

// ======= DATA QUALITY HELPERS =======

export function calculateDataCompleteness(analysis: CompetitorAnalysisEntity): number {
  const requiredFields = [
    'name', 'industry', 'headquarters', 'founded_year', 'employee_count',
    'business_model', 'market_position', 'strengths', 'weaknesses'
  ];
  
  const filledFields = requiredFields.filter(field => {
    const value = analysis[field as keyof CompetitorAnalysisEntity];
    return value !== null && value !== undefined && value !== '';
  });
  
  return Math.round((filledFields.length / requiredFields.length) * 100);
}

export function getDataQualityLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Good';
  if (score >= 70) return 'Fair';
  if (score >= 60) return 'Poor';
  return 'Incomplete';
}

// ======= FIELD MAPPING UTILITIES =======

/**
 * Maps edge function response to database-compliant entity
 * Used during data ingestion to ensure field consistency
 */
export function mapEdgeFunctionResponse(response: any): Partial<CompetitorAnalysisEntity> {
  return {
    name: response.name || response.competitor_name,
    description: response.description || response.company_overview,
    website_url: response.website_url || response.website,
    industry: response.industry,
    headquarters: response.headquarters,
    founded_year: response.founded_year,
    employee_count: response.employee_count,
    business_model: response.business_model,
    strengths: response.strengths || [],
    weaknesses: response.weaknesses || [],
    opportunities: response.opportunities || [],
    threats: response.threats || [],
    market_position: response.market_position,
    target_market: response.target_market || [],
    customer_segments: response.customer_segments || [],
    geographic_presence: response.geographic_presence || [],
    market_share_estimate: response.market_share_estimate,
    competitive_advantages: response.competitive_advantages || [],
    competitive_disadvantages: response.competitive_disadvantages || [],
    overall_threat_level: response.overall_threat_level,
    revenue_estimate: response.revenue_estimate,
    pricing_strategy: response.pricing_strategy,
    funding_info: response.funding_info,
    financial_metrics: response.financial_metrics,
    product_portfolio: response.product_portfolio,
    partnerships: response.partnerships || [],
    technology_analysis: response.technology_analysis,
    patent_count: response.patent_count,
    certification_standards: response.certification_standards || [],
    innovation_score: response.innovation_score,
    environmental_social_governance: response.environmental_social_governance,
    social_media_presence: response.social_media_presence,
    key_personnel: response.key_personnel,
    data_quality_score: response.data_quality_score,
    brand_strength_score: response.brand_strength_score,
    operational_efficiency_score: response.operational_efficiency_score,
    market_sentiment_score: response.market_sentiment_score,
    market_trends: response.market_trends || [],
    swot_analysis: response.swot_analysis,
    analysis_data: response.analysis_data,
    api_responses: response.api_responses,
    source_citations: response.source_citations,
    confidence_scores: response.confidence_scores,
    normalized_scores: response.normalized_scores
  };
}