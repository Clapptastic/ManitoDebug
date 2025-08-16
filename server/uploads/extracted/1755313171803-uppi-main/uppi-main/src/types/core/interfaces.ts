export interface CompetitorData {
  id: string;
  name: string;
  competitor_name: string;
  analysis_data?: Record<string, any>;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  company_overview: string;
  market_share: number;
  status: 'pending' | 'completed' | 'failed' | 'analyzing' | 'error';
  created_at: string;
  updated_at: string;
  user_id: string;
  description?: string;
  website?: string;
  founded_year?: number;
  employee_count?: number;
  industry?: string;
  headquarters?: string;
  target_market?: string[];
  pricing_strategy?: Record<string, any>;
  funding_info?: Record<string, any>;
  data_quality_score?: number;
  market_position?: string;
  pricing?: string;
  features?: string[];
  market_presence_score?: number;
}

export interface AnalysisResult {
  id: string;
  competitor_name: string;
  analysis_data: Record<string, any>;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  created_at: string;
  status: string;
}

export interface CompetitorAnalysis {
  id: string;
  user_id: string;
  organization_id?: string;
  name: string;
  competitor_name?: string;
  status: string;
  data?: Record<string, any>;
  created_at: string;
  updated_at: string;
  last_analyzed?: string;
  analysis_started_at?: string;
  analysis_completed_at?: string;
  market_presence_score?: number;
  data_quality_score?: number;
  strengths?: string[];
  weaknesses?: string[];
  opportunities?: string[];
  threats?: string[];
  features?: string[];
  url_verified?: boolean;
  company_url?: string;
  company_logo?: string;
  value_proposition?: string;
  business_model?: string;
  actual_cost?: number;
  analysis_data?: Record<string, any>;
  pricing_strategy?: Record<string, any>;
  funding_info?: Record<string, any>;
  description?: string;
  website_url?: string;
  founded_year?: number;
  employee_count?: number;
  industry?: string;
  headquarters?: string;
  target_market?: string[];
  market_position?: string;
  completed_at?: string;
  company_overview?: string;
}

// Note: SystemHealthData and ComponentHealthData moved to src/types/system-health.ts
// Import from there instead of defining here to avoid duplicates
import { SystemHealthData, SystemComponent } from '@/types/system-health';

export interface SystemHealthOverview {
  overall_status: 'operational' | 'degraded' | 'outage' | 'maintenance';
  components: SystemComponent[];
  system_metrics: SystemHealthData;
  incidents: any[];
  uptime_percentage: number;
}

export interface QueryMetric {
  id: string;
  query: string;
  execution_time_ms: number;
  rows_affected?: number;
  timestamp: string;
  user_id?: string;
}

export interface TableStats {
  table_name: string;
  row_count: number;
  size_mb: number;
  last_analyzed: string;
}

export interface TrackedError {
  id: string;
  message: string;
  source: string;
  timestamp: string;
  handled: boolean;
  stack?: string;
  details?: Record<string, any>;
}

export interface ErrorReport {
  id: string;
  error_id: string;
  user_id?: string;
  context: Record<string, any>;
  created_at: string;
}

export interface SwotItem {
  id?: string;
  title?: string;
  description?: string;
  content?: string;
  text?: string;
  impact?: string;
  type?: string;
}

export interface SwotCategory {
  title: string;
  items: SwotItem[];
}

export interface SwotAnalysis {
  strengths: SwotCategory;
  weaknesses: SwotCategory;
  opportunities: SwotCategory;
  threats: SwotCategory;
}

export interface SwotAnalysisData {
  strengths: SwotItem[];
  weaknesses: SwotItem[];
  opportunities: SwotItem[];
  threats: SwotItem[];
}
