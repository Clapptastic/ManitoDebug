import { Json } from '@/integrations/supabase/types';

interface SystemHealthMetrics {
  tables: Array<{
    table_schema: string;
    table_name: string; 
    total_size_bytes: number;
    live_rows: number;
    rls_enabled: boolean;
  }>;
  api_metrics: Array<{
    api_provider: string;
    total_requests: number;
    avg_response_time: number;
    successful_requests: number;
    failed_requests: number;
    total_cost: number;
  }>;
  competitor_health: Array<{
    status: string;
    count: number;
    avg_processing_time: number;
    error_count: number;
  }>;
}

export interface SystemHealthReport {
  snapshot_time: string;
  metrics: SystemHealthMetrics;
}

export interface Database {
  public: {
    Views: {
      mv_system_health_metrics: {
        Row: {
          snapshot_time: string;
          metrics: Json;
        };
        Relationships: [];
      };
      mv_competitor_analysis_stats: {
        Row: {
          avg_analysis_cost: number | null;
          completed_analyses: number | null;
          failed_analyses: number | null;
          last_analysis_date: string | null;
          pending_analyses: number | null;
          total_analyses: number | null;
          user_id: string | null;
        };
        Relationships: [];
      };
      v_competitor_analyses: {
        Row: {
          id: string;
          user_id: string;
          competitor_name: string;
          status: string;
          data: Json;
          created_at: string;
          updated_at: string;
          completed_at: string | null;
          company_overview: Json | null;
          market_position: Json | null;
          swot_analysis: Json | null;
          marketing_strategy: Json | null;
          distribution_channels: Json | null;
          product_offerings: Json | null;
          competitive_benchmarking: Json | null;
          market_differentiation: Json | null;
          metadata: Json;
          api_provider_status: Json;
          provider_responses: Json;
          analysis_log: Json[];
          analysis_started_at: string | null;
          analysis_completed_at: string | null;
          analysis_attempt_count: number;
          debug_info: Json | null;
          source_metadata: Json;
          ai_provider_responses: Json;
          combined_analysis: Json;
          computed_similar_competitors: Json[];
          cost_breakdown: Json;
          last_analyzed: string | null;
          company_logo: string | null;
          company_url: string | null;
          industry_classification: Json | null;
          industry_trends: Json[];
          market_trends: Json[];
          growth_stage: string | null;
          position_type: string | null;
          value_proposition: string | null;
          business_model: string | null;
          competitor_notes: Json[];
          url_verified: boolean;
          api_sources: Json;
          api_attribution_info: Json;
          data_gathering_methods: string[];
        };
        Relationships: [
          {
            foreignKeyName: "competitor_analyses_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Tables: {
      competitor_analyses: {
        Row: {
          id: string;
          user_id: string;
          competitor_name: string;
          data: Json;
          status: string;
          created_at: string;
          updated_at: string;
          api_attribution_info: Json;
          api_sources: Json;
          cost_breakdown: Json;
          provider_responses: Json;
          metadata: Json;
          analysis_log: Json[];
          analysis_started_at: string | null;
          analysis_completed_at: string | null;
          analysis_attempt_count: number;
          debug_info: Json | null;
          source_metadata: Json;
          ai_provider_responses: Json;
          combined_analysis: Json;
          computed_similar_competitors: Json[];
          last_analyzed: string | null;
          company_logo: string | null;
          company_url: string | null;
          industry_classification: Json | null;
          industry_trends: Json[];
          market_trends: Json[];
          growth_stage: string | null;
          position_type: string | null;
          value_proposition: string | null;
          business_model: string | null;
          competitor_notes: Json[];
          url_verified: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          competitor_name: string;
          data?: Json;
          status?: string;
          created_at?: string;
          updated_at?: string;
          api_attribution_info?: Json;
          api_sources?: Json;
          cost_breakdown?: Json;
          provider_responses?: Json;
          metadata?: Json;
          analysis_log?: Json[];
          analysis_started_at?: string | null;
          analysis_completed_at?: string | null;
          analysis_attempt_count?: number;
          debug_info?: Json | null;
          source_metadata?: Json;
          ai_provider_responses?: Json;
          combined_analysis?: Json;
          computed_similar_competitors?: Json[];
          last_analyzed?: string | null;
          company_logo?: string | null;
          company_url?: string | null;
          industry_classification?: Json | null;
          industry_trends?: Json[];
          market_trends?: Json[];
          growth_stage?: string | null;
          position_type?: string | null;
          value_proposition?: string | null;
          business_model?: string | null;
          competitor_notes?: Json[];
          url_verified?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          competitor_name?: string;
          data?: Json;
          status?: string;
          created_at?: string;
          updated_at?: string;
          api_attribution_info?: Json;
          api_sources?: Json;
          cost_breakdown?: Json;
          provider_responses?: Json;
          metadata?: Json;
          analysis_log?: Json[];
          analysis_started_at?: string | null;
          analysis_completed_at?: string | null;
          analysis_attempt_count?: number;
          debug_info?: Json | null;
          source_metadata?: Json;
          ai_provider_responses?: Json;
          combined_analysis?: Json;
          computed_similar_competitors?: Json[];
          last_analyzed?: string | null;
          company_logo?: string | null;
          company_url?: string | null;
          industry_classification?: Json | null;
          industry_trends?: Json[];
          market_trends?: Json[];
          growth_stage?: string | null;
          position_type?: string | null;
          value_proposition?: string | null;
          business_model?: string | null;
          competitor_notes?: Json[];
          url_verified?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "competitor_analyses_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Functions: {
      get_system_health_report: {
        Args: Record<string, never>;
        Returns: SystemHealthReport;
      };
      refresh_system_health_metrics: {
        Args: Record<string, never>;
        Returns: void;
      };
    };
  };
}
