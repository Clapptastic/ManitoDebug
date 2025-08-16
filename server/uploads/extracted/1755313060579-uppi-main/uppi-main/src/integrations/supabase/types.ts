export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      account_deletion_requests: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          processed_at: string | null
          reason: string
          requested_at: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          processed_at?: string | null
          reason: string
          requested_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          processed_at?: string | null
          reason?: string
          requested_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      admin_api_keys: {
        Row: {
          api_key: string
          created_at: string | null
          created_by: string
          current_month_usage: number | null
          error_message: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          last_validated: string | null
          masked_key: string | null
          metadata: Json | null
          name: string
          permissions: Json | null
          provider: string
          status: string | null
          updated_at: string | null
          usage_limit_per_month: number | null
        }
        Insert: {
          api_key: string
          created_at?: string | null
          created_by: string
          current_month_usage?: number | null
          error_message?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          last_validated?: string | null
          masked_key?: string | null
          metadata?: Json | null
          name: string
          permissions?: Json | null
          provider: string
          status?: string | null
          updated_at?: string | null
          usage_limit_per_month?: number | null
        }
        Update: {
          api_key?: string
          created_at?: string | null
          created_by?: string
          current_month_usage?: number | null
          error_message?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          last_validated?: string | null
          masked_key?: string | null
          metadata?: Json | null
          name?: string
          permissions?: Json | null
          provider?: string
          status?: string | null
          updated_at?: string | null
          usage_limit_per_month?: number | null
        }
        Relationships: []
      }
      admin_api_usage_tracking: {
        Row: {
          admin_api_key_id: string
          cost_usd: number | null
          created_at: string | null
          endpoint: string
          error_details: Json | null
          id: string
          metadata: Json | null
          success: boolean | null
          tokens_used: number | null
          user_id: string | null
        }
        Insert: {
          admin_api_key_id: string
          cost_usd?: number | null
          created_at?: string | null
          endpoint: string
          error_details?: Json | null
          id?: string
          metadata?: Json | null
          success?: boolean | null
          tokens_used?: number | null
          user_id?: string | null
        }
        Update: {
          admin_api_key_id?: string
          cost_usd?: number | null
          created_at?: string | null
          endpoint?: string
          error_details?: Json | null
          id?: string
          metadata?: Json | null
          success?: boolean | null
          tokens_used?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_api_usage_tracking_admin_api_key_id_fkey"
            columns: ["admin_api_key_id"]
            isOneToOne: false
            referencedRelation: "admin_api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_audit_log: {
        Row: {
          action: string
          admin_user_id: string | null
          created_at: string | null
          error_message: string | null
          id: string
          ip_address: unknown | null
          is_legacy: boolean | null
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          resource_id: string | null
          resource_type: string | null
          success: boolean | null
          target_user_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_user_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          ip_address?: unknown | null
          is_legacy?: boolean | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          success?: boolean | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          ip_address?: unknown | null
          is_legacy?: boolean | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          success?: boolean | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      admin_permissions: {
        Row: {
          created_at: string | null
          expires_at: string | null
          granted_at: string | null
          granted_by: string | null
          id: string
          metadata: Json | null
          permission: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          metadata?: Json | null
          permission: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          metadata?: Json | null
          permission?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          created_at: string | null
          created_by: string | null
          email: string
          id: string
          is_active: boolean | null
          metadata: Json | null
          role: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          role?: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          role?: string
        }
        Relationships: []
      }
      affiliate_link_suggestions: {
        Row: {
          created_at: string
          created_by: string
          detected_program_name: string | null
          domain: string
          id: string
          original_url: string
          provider: string | null
          signup_url: string | null
          status: string
        }
        Insert: {
          created_at?: string
          created_by: string
          detected_program_name?: string | null
          domain: string
          id?: string
          original_url: string
          provider?: string | null
          signup_url?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          detected_program_name?: string | null
          domain?: string
          id?: string
          original_url?: string
          provider?: string | null
          signup_url?: string | null
          status?: string
        }
        Relationships: []
      }
      affiliate_links: {
        Row: {
          affiliate_code: string
          clicks: number | null
          conversions: number | null
          created_at: string | null
          id: string
          name: string
          status: string | null
          updated_at: string | null
          url: string
        }
        Insert: {
          affiliate_code: string
          clicks?: number | null
          conversions?: number | null
          created_at?: string | null
          id?: string
          name: string
          status?: string | null
          updated_at?: string | null
          url: string
        }
        Update: {
          affiliate_code?: string
          clicks?: number | null
          conversions?: number | null
          created_at?: string | null
          id?: string
          name?: string
          status?: string | null
          updated_at?: string | null
          url?: string
        }
        Relationships: []
      }
      affiliate_programs: {
        Row: {
          affiliate_code: string
          affiliate_url: string | null
          commission_rate: number | null
          created_at: string | null
          default_url: string | null
          domain: string | null
          id: string
          is_active: boolean | null
          program_name: string
          provider: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          affiliate_code: string
          affiliate_url?: string | null
          commission_rate?: number | null
          created_at?: string | null
          default_url?: string | null
          domain?: string | null
          id?: string
          is_active?: boolean | null
          program_name: string
          provider?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          affiliate_code?: string
          affiliate_url?: string | null
          commission_rate?: number | null
          created_at?: string | null
          default_url?: string | null
          domain?: string | null
          id?: string
          is_active?: boolean | null
          program_name?: string
          provider?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_drill_down_sessions: {
        Row: {
          ai_response: string | null
          analysis_id: string
          category: string
          cost_usd: number | null
          created_at: string | null
          id: string
          model: string | null
          provider: string | null
          response_quality_score: number | null
          specific_area: string | null
          tokens_used: number | null
          updated_at: string | null
          user_id: string
          user_prompt: string
        }
        Insert: {
          ai_response?: string | null
          analysis_id: string
          category: string
          cost_usd?: number | null
          created_at?: string | null
          id?: string
          model?: string | null
          provider?: string | null
          response_quality_score?: number | null
          specific_area?: string | null
          tokens_used?: number | null
          updated_at?: string | null
          user_id: string
          user_prompt: string
        }
        Update: {
          ai_response?: string | null
          analysis_id?: string
          category?: string
          cost_usd?: number | null
          created_at?: string | null
          id?: string
          model?: string | null
          provider?: string | null
          response_quality_score?: number | null
          specific_area?: string | null
          tokens_used?: number | null
          updated_at?: string | null
          user_id?: string
          user_prompt?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_drill_down_sessions_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "competitor_analyses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_drill_down_sessions_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "v_competitor_analysis_full"
            referencedColumns: ["analysis_id"]
          },
        ]
      }
      ai_model_performance: {
        Row: {
          accuracy_score: number
          avg_response_time_ms: number | null
          bias_metrics: Json | null
          confidence_calibration: number | null
          cost_per_request: number | null
          created_at: string
          id: string
          is_active: boolean | null
          last_evaluation: string
          metadata: Json | null
          model_name: string
          model_version: string | null
          performance_trend: string | null
          task_type: string
          updated_at: string
          validation_dataset_size: number | null
        }
        Insert: {
          accuracy_score: number
          avg_response_time_ms?: number | null
          bias_metrics?: Json | null
          confidence_calibration?: number | null
          cost_per_request?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_evaluation?: string
          metadata?: Json | null
          model_name: string
          model_version?: string | null
          performance_trend?: string | null
          task_type: string
          updated_at?: string
          validation_dataset_size?: number | null
        }
        Update: {
          accuracy_score?: number
          avg_response_time_ms?: number | null
          bias_metrics?: Json | null
          confidence_calibration?: number | null
          cost_per_request?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_evaluation?: string
          metadata?: Json | null
          model_name?: string
          model_version?: string | null
          performance_trend?: string | null
          task_type?: string
          updated_at?: string
          validation_dataset_size?: number | null
        }
        Relationships: []
      }
      ai_prompt_logs: {
        Row: {
          analysis_id: string | null
          created_at: string
          error: string | null
          id: string
          metadata: Json
          model: string | null
          prompt_hash: string
          prompt_length: number
          prompt_preview: string | null
          provider: string
          session_id: string | null
          status: string | null
          temperature: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis_id?: string | null
          created_at?: string
          error?: string | null
          id?: string
          metadata?: Json
          model?: string | null
          prompt_hash: string
          prompt_length?: number
          prompt_preview?: string | null
          provider: string
          session_id?: string | null
          status?: string | null
          temperature?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          analysis_id?: string | null
          created_at?: string
          error?: string | null
          id?: string
          metadata?: Json
          model?: string | null
          prompt_hash?: string
          prompt_length?: number
          prompt_preview?: string | null
          provider?: string
          session_id?: string | null
          status?: string | null
          temperature?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_validation_logs: {
        Row: {
          ai_models_used: string[] | null
          content_preview: string | null
          content_type: string
          created_at: string | null
          id: string
          sources_checked: number | null
          updated_at: string | null
          user_id: string
          validation_result: Json
        }
        Insert: {
          ai_models_used?: string[] | null
          content_preview?: string | null
          content_type: string
          created_at?: string | null
          id?: string
          sources_checked?: number | null
          updated_at?: string | null
          user_id: string
          validation_result?: Json
        }
        Update: {
          ai_models_used?: string[] | null
          content_preview?: string | null
          content_type?: string
          created_at?: string | null
          id?: string
          sources_checked?: number | null
          updated_at?: string | null
          user_id?: string
          validation_result?: Json
        }
        Relationships: []
      }
      analysis_combined: {
        Row: {
          aggregated_result: Json
          analysis_id: string
          can_contribute_map: Json
          created_at: string
          field_scores: Json
          filled_from_master: Json
          id: string
          overall_confidence: number | null
          provenance_map: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          aggregated_result?: Json
          analysis_id: string
          can_contribute_map?: Json
          created_at?: string
          field_scores?: Json
          filled_from_master?: Json
          id?: string
          overall_confidence?: number | null
          provenance_map?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          aggregated_result?: Json
          analysis_id?: string
          can_contribute_map?: Json
          created_at?: string
          field_scores?: Json
          filled_from_master?: Json
          id?: string
          overall_confidence?: number | null
          provenance_map?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      analysis_provider_results: {
        Row: {
          analysis_id: string
          confidence_score: number | null
          coverage_score: number | null
          created_at: string
          id: string
          normalized_result: Json
          provider: string
          quality_metrics: Json
          raw_result: Json | null
          run_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis_id: string
          confidence_score?: number | null
          coverage_score?: number | null
          created_at?: string
          id?: string
          normalized_result?: Json
          provider: string
          quality_metrics?: Json
          raw_result?: Json | null
          run_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          analysis_id?: string
          confidence_score?: number | null
          coverage_score?: number | null
          created_at?: string
          id?: string
          normalized_result?: Json
          provider?: string
          quality_metrics?: Json
          raw_result?: Json | null
          run_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analysis_provider_results_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "analysis_provider_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      analysis_provider_runs: {
        Row: {
          analysis_id: string
          completed_at: string | null
          cost_usd: number
          created_at: string
          error_message: string | null
          id: string
          metadata: Json
          provider: string
          started_at: string
          status: Database["public"]["Enums"]["provider_status"]
          tokens_used: number
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis_id: string
          completed_at?: string | null
          cost_usd?: number
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json
          provider: string
          started_at?: string
          status?: Database["public"]["Enums"]["provider_status"]
          tokens_used?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          analysis_id?: string
          completed_at?: string | null
          cost_usd?: number
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json
          provider?: string
          started_at?: string
          status?: Database["public"]["Enums"]["provider_status"]
          tokens_used?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      analysis_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          execution_time_ms: number | null
          id: string
          input_data: Json
          output_data: Json | null
          run_type: string
          session_id: string
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          input_data?: Json
          output_data?: Json | null
          run_type: string
          session_id: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          input_data?: Json
          output_data?: Json | null
          run_type?: string
          session_id?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      analytics_dashboards: {
        Row: {
          created_at: string
          dashboard_config: Json
          description: string | null
          id: string
          is_public: boolean | null
          metadata: Json | null
          name: string
          tags: string[] | null
          updated_at: string
          user_id: string
          widgets: Json
        }
        Insert: {
          created_at?: string
          dashboard_config?: Json
          description?: string | null
          id?: string
          is_public?: boolean | null
          metadata?: Json | null
          name: string
          tags?: string[] | null
          updated_at?: string
          user_id: string
          widgets?: Json
        }
        Update: {
          created_at?: string
          dashboard_config?: Json
          description?: string | null
          id?: string
          is_public?: boolean | null
          metadata?: Json | null
          name?: string
          tags?: string[] | null
          updated_at?: string
          user_id?: string
          widgets?: Json
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          created_at: string | null
          error_message: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          key_hash: string | null
          key_prefix: string
          last_error: string | null
          last_security_audit: string | null
          last_used_at: string | null
          last_validated: string | null
          masked_key: string | null
          metadata: Json | null
          model_preference: string | null
          name: string
          permissions: Json | null
          provider: string | null
          status: string | null
          updated_at: string | null
          usage_count: number | null
          user_id: string
          vault_secret_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash?: string | null
          key_prefix: string
          last_error?: string | null
          last_security_audit?: string | null
          last_used_at?: string | null
          last_validated?: string | null
          masked_key?: string | null
          metadata?: Json | null
          model_preference?: string | null
          name: string
          permissions?: Json | null
          provider?: string | null
          status?: string | null
          updated_at?: string | null
          usage_count?: number | null
          user_id: string
          vault_secret_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash?: string | null
          key_prefix?: string
          last_error?: string | null
          last_security_audit?: string | null
          last_used_at?: string | null
          last_validated?: string | null
          masked_key?: string | null
          metadata?: Json | null
          model_preference?: string | null
          name?: string
          permissions?: Json | null
          provider?: string | null
          status?: string | null
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string
          vault_secret_id?: string | null
        }
        Relationships: []
      }
      api_metrics: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          metadata: Json | null
          method: string
          response_time_ms: number
          status_code: number
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          metadata?: Json | null
          method: string
          response_time_ms: number
          status_code: number
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          metadata?: Json | null
          method?: string
          response_time_ms?: number
          status_code?: number
          user_id?: string | null
        }
        Relationships: []
      }
      api_usage_costs: {
        Row: {
          analysis_id: string | null
          cost_usd: number
          created_at: string | null
          date: string
          endpoint: string | null
          error_details: Json | null
          id: string
          metadata: Json | null
          operation_type: string | null
          provider: string
          request_timestamp: string | null
          response_time_ms: number | null
          service: string
          success: boolean | null
          tokens_used: number
          updated_at: string | null
          usage_count: number
          user_id: string
        }
        Insert: {
          analysis_id?: string | null
          cost_usd?: number
          created_at?: string | null
          date?: string
          endpoint?: string | null
          error_details?: Json | null
          id?: string
          metadata?: Json | null
          operation_type?: string | null
          provider: string
          request_timestamp?: string | null
          response_time_ms?: number | null
          service: string
          success?: boolean | null
          tokens_used?: number
          updated_at?: string | null
          usage_count?: number
          user_id: string
        }
        Update: {
          analysis_id?: string | null
          cost_usd?: number
          created_at?: string | null
          date?: string
          endpoint?: string | null
          error_details?: Json | null
          id?: string
          metadata?: Json | null
          operation_type?: string | null
          provider?: string
          request_timestamp?: string | null
          response_time_ms?: number | null
          service?: string
          success?: boolean | null
          tokens_used?: number
          updated_at?: string | null
          usage_count?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_usage_costs_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "competitor_analyses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_usage_costs_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "v_competitor_analysis_full"
            referencedColumns: ["analysis_id"]
          },
        ]
      }
      api_usage_tracking: {
        Row: {
          endpoint: string
          id: string
          ip_address: unknown | null
          method: string
          response_time_ms: number | null
          status_code: number
          timestamp: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          endpoint: string
          id?: string
          ip_address?: unknown | null
          method: string
          response_time_ms?: number | null
          status_code: number
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          endpoint?: string
          id?: string
          ip_address?: unknown | null
          method?: string
          response_time_ms?: number | null
          status_code?: number
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      application_settings: {
        Row: {
          animations: boolean | null
          auto_save: boolean | null
          background_sync: boolean | null
          cache_size: string | null
          color_scheme: string | null
          compact_mode: boolean | null
          confirmation_dialogs: boolean | null
          created_at: string | null
          date_format: string | null
          first_day_of_week: string | null
          focus_indicators: boolean | null
          font_size: string | null
          high_contrast: boolean | null
          id: string
          keyboard_shortcuts: boolean | null
          language: string | null
          lazy_loading: boolean | null
          motion_reduced: boolean | null
          offline_mode: boolean | null
          screen_reader_support: boolean | null
          sidebar_collapsed: boolean | null
          sound_effects: boolean | null
          theme: string | null
          time_format: string | null
          timezone: string | null
          tooltips: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          animations?: boolean | null
          auto_save?: boolean | null
          background_sync?: boolean | null
          cache_size?: string | null
          color_scheme?: string | null
          compact_mode?: boolean | null
          confirmation_dialogs?: boolean | null
          created_at?: string | null
          date_format?: string | null
          first_day_of_week?: string | null
          focus_indicators?: boolean | null
          font_size?: string | null
          high_contrast?: boolean | null
          id?: string
          keyboard_shortcuts?: boolean | null
          language?: string | null
          lazy_loading?: boolean | null
          motion_reduced?: boolean | null
          offline_mode?: boolean | null
          screen_reader_support?: boolean | null
          sidebar_collapsed?: boolean | null
          sound_effects?: boolean | null
          theme?: string | null
          time_format?: string | null
          timezone?: string | null
          tooltips?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          animations?: boolean | null
          auto_save?: boolean | null
          background_sync?: boolean | null
          cache_size?: string | null
          color_scheme?: string | null
          compact_mode?: boolean | null
          confirmation_dialogs?: boolean | null
          created_at?: string | null
          date_format?: string | null
          first_day_of_week?: string | null
          focus_indicators?: boolean | null
          font_size?: string | null
          high_contrast?: boolean | null
          id?: string
          keyboard_shortcuts?: boolean | null
          language?: string | null
          lazy_loading?: boolean | null
          motion_reduced?: boolean | null
          offline_mode?: boolean | null
          screen_reader_support?: boolean | null
          sidebar_collapsed?: boolean | null
          sound_effects?: boolean | null
          theme?: string | null
          time_format?: string | null
          timezone?: string | null
          tooltips?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown | null
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          resource_id: string | null
          resource_type: string
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type: string
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type?: string
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      automation_workflows: {
        Row: {
          actions: Json
          conditions: Json | null
          created_at: string
          description: string | null
          execution_count: number | null
          id: string
          is_active: boolean | null
          last_executed_at: string | null
          metadata: Json | null
          name: string
          status: string | null
          trigger_config: Json
          trigger_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actions?: Json
          conditions?: Json | null
          created_at?: string
          description?: string | null
          execution_count?: number | null
          id?: string
          is_active?: boolean | null
          last_executed_at?: string | null
          metadata?: Json | null
          name: string
          status?: string | null
          trigger_config?: Json
          trigger_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actions?: Json
          conditions?: Json | null
          created_at?: string
          description?: string | null
          execution_count?: number | null
          id?: string
          is_active?: boolean | null
          last_executed_at?: string | null
          metadata?: Json | null
          name?: string
          status?: string | null
          trigger_config?: Json
          trigger_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      backup_jobs: {
        Row: {
          backup_location: string | null
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          job_type: string
          metadata: Json | null
          size_bytes: number | null
          started_at: string | null
          status: string | null
        }
        Insert: {
          backup_location?: string | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          job_type: string
          metadata?: Json | null
          size_bytes?: number | null
          started_at?: string | null
          status?: string | null
        }
        Update: {
          backup_location?: string | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          job_type?: string
          metadata?: Json | null
          size_bytes?: number | null
          started_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      billing_events: {
        Row: {
          created_at: string
          event_data: Json
          event_type: string
          id: string
          processed_at: string | null
          stripe_event_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_data?: Json
          event_type: string
          id?: string
          processed_at?: string | null
          stripe_event_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_data?: Json
          event_type?: string
          id?: string
          processed_at?: string | null
          stripe_event_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      billing_invoices: {
        Row: {
          amount: number
          created_at: string
          currency: string
          download_url: string | null
          due_date: string | null
          id: string
          invoice_number: string
          paid_at: string | null
          status: string
          stripe_invoice_id: string | null
          subscription_id: string | null
          tax_amount: number | null
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          download_url?: string | null
          due_date?: string | null
          id?: string
          invoice_number: string
          paid_at?: string | null
          status: string
          stripe_invoice_id?: string | null
          subscription_id?: string | null
          tax_amount?: number | null
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          download_url?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string
          paid_at?: string | null
          status?: string
          stripe_invoice_id?: string | null
          subscription_id?: string | null
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_subscriptions: {
        Row: {
          cancel_at: string | null
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          metadata: Json | null
          plan_id: string
          plan_name: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at?: string | null
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          metadata?: Json | null
          plan_id: string
          plan_name: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at?: string | null
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          metadata?: Json | null
          plan_id?: string
          plan_name?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      business_insights: {
        Row: {
          action_items: string[] | null
          confidence_score: number
          created_at: string
          data_source: string
          description: string
          id: string
          impact_level: string
          metadata: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_items?: string[] | null
          confidence_score: number
          created_at?: string
          data_source: string
          description: string
          id?: string
          impact_level: string
          metadata?: Json | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_items?: string[] | null
          confidence_score?: number
          created_at?: string
          data_source?: string
          description?: string
          id?: string
          impact_level?: string
          metadata?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      business_metrics: {
        Row: {
          created_at: string
          dimensions: Json | null
          id: string
          metadata: Json | null
          metric_name: string
          metric_type: string
          metric_value: number
          period_end: string
          period_start: string
        }
        Insert: {
          created_at?: string
          dimensions?: Json | null
          id?: string
          metadata?: Json | null
          metric_name: string
          metric_type: string
          metric_value: number
          period_end: string
          period_start: string
        }
        Update: {
          created_at?: string
          dimensions?: Json | null
          id?: string
          metadata?: Json | null
          metric_name?: string
          metric_type?: string
          metric_value?: number
          period_end?: string
          period_start?: string
        }
        Relationships: []
      }
      business_plans: {
        Row: {
          business_model: string | null
          created_at: string
          financial_projections: Json | null
          id: string
          industry: string | null
          metadata: Json | null
          plan_data: Json
          status: string | null
          template_used: string | null
          title: string
          updated_at: string
          user_id: string
          version: number | null
        }
        Insert: {
          business_model?: string | null
          created_at?: string
          financial_projections?: Json | null
          id?: string
          industry?: string | null
          metadata?: Json | null
          plan_data?: Json
          status?: string | null
          template_used?: string | null
          title: string
          updated_at?: string
          user_id: string
          version?: number | null
        }
        Update: {
          business_model?: string | null
          created_at?: string
          financial_projections?: Json | null
          id?: string
          industry?: string | null
          metadata?: Json | null
          plan_data?: Json
          status?: string | null
          template_used?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          version?: number | null
        }
        Relationships: []
      }
      business_tools_usage: {
        Row: {
          created_at: string | null
          id: string
          last_used_at: string | null
          tool_name: string
          updated_at: string | null
          usage_count: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_used_at?: string | null
          tool_name: string
          updated_at?: string | null
          usage_count?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_used_at?: string | null
          tool_name?: string
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      cache_configurations: {
        Row: {
          cache_key: string
          cache_type: string
          created_at: string | null
          eviction_policy: string | null
          id: string
          is_active: boolean | null
          max_size_mb: number | null
          ttl_seconds: number
          updated_at: string | null
        }
        Insert: {
          cache_key: string
          cache_type: string
          created_at?: string | null
          eviction_policy?: string | null
          id?: string
          is_active?: boolean | null
          max_size_mb?: number | null
          ttl_seconds: number
          updated_at?: string | null
        }
        Update: {
          cache_key?: string
          cache_type?: string
          created_at?: string | null
          eviction_policy?: string | null
          id?: string
          is_active?: boolean | null
          max_size_mb?: number | null
          ttl_seconds?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
          session_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
          session_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
          session_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          context: Json | null
          created_at: string
          id: string
          metadata: Json | null
          status: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          context?: Json | null
          created_at?: string
          id?: string
          metadata?: Json | null
          status?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          context?: Json | null
          created_at?: string
          id?: string
          metadata?: Json | null
          status?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_settings: {
        Row: {
          ai_model: string
          ai_provider: string
          created_at: string
          id: string
          max_tokens: number
          system_prompt: string | null
          temperature: number
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_model?: string
          ai_provider?: string
          created_at?: string
          id?: string
          max_tokens?: number
          system_prompt?: string | null
          temperature?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_model?: string
          ai_provider?: string
          created_at?: string
          id?: string
          max_tokens?: number
          system_prompt?: string | null
          temperature?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      code_embeddings: {
        Row: {
          content: string
          created_at: string | null
          embedding: Json | null
          embedding_vector: string | null
          file_path: string
          id: string
          language: string | null
          metadata: Json | null
          token_count: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          embedding?: Json | null
          embedding_vector?: string | null
          file_path: string
          id?: string
          language?: string | null
          metadata?: Json | null
          token_count?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          embedding?: Json | null
          embedding_vector?: string | null
          file_path?: string
          id?: string
          language?: string | null
          metadata?: Json | null
          token_count?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      company_profiles: {
        Row: {
          ai_analysis_data: Json | null
          business_model: string | null
          company_name: string
          created_at: string | null
          description: string | null
          employee_count: number | null
          founded_year: number | null
          funding_stage: string | null
          headquarters: string | null
          id: string
          industry: string | null
          last_enriched_at: string | null
          metadata: Json | null
          revenue_estimate: number | null
          updated_at: string | null
          user_id: string
          website_url: string | null
        }
        Insert: {
          ai_analysis_data?: Json | null
          business_model?: string | null
          company_name: string
          created_at?: string | null
          description?: string | null
          employee_count?: number | null
          founded_year?: number | null
          funding_stage?: string | null
          headquarters?: string | null
          id?: string
          industry?: string | null
          last_enriched_at?: string | null
          metadata?: Json | null
          revenue_estimate?: number | null
          updated_at?: string | null
          user_id: string
          website_url?: string | null
        }
        Update: {
          ai_analysis_data?: Json | null
          business_model?: string | null
          company_name?: string
          created_at?: string | null
          description?: string | null
          employee_count?: number | null
          founded_year?: number | null
          funding_stage?: string | null
          headquarters?: string | null
          id?: string
          industry?: string | null
          last_enriched_at?: string | null
          metadata?: Json | null
          revenue_estimate?: number | null
          updated_at?: string | null
          user_id?: string
          website_url?: string | null
        }
        Relationships: []
      }
      competitor_analyses: {
        Row: {
          actual_cost: number | null
          ai_drill_down_history: Json | null
          analysis_data: Json | null
          analysis_id: string | null
          brand_strength_score: number | null
          business_model: string | null
          company_profile_id: string | null
          completed_at: string | null
          confidence_scores: Json | null
          cost_breakdown: Json | null
          created_at: string | null
          customer_journey_data: Json | null
          data_completeness_breakdown: Json | null
          data_completeness_score: number | null
          data_quality_breakdown: Json | null
          data_quality_score: number | null
          description: string | null
          employee_count: number | null
          employee_count_verified: boolean | null
          exchange: string | null
          financial_data: Json | null
          founded_year: number | null
          funding_info: Json | null
          headquarters: string | null
          id: string
          industry: string | null
          innovation_score: number | null
          is_public_company: boolean | null
          last_news_refresh: string | null
          last_news_update: string | null
          market_position: string | null
          market_position_data: Json | null
          market_sentiment_score: number | null
          name: string
          news_data: Json | null
          normalized_scores: Json | null
          operational_efficiency_score: number | null
          opportunities: string[] | null
          organization_id: string | null
          patent_count: number | null
          pricing_strategy: Json | null
          public_company_data: Json | null
          session_id: string | null
          social_media_presence: Json | null
          source_citations: Json | null
          status: string | null
          stock_symbol: string | null
          strengths: string[] | null
          target_market: string[] | null
          technology_innovation_data: Json | null
          threats: string[] | null
          total_api_cost: number | null
          updated_at: string | null
          user_id: string
          weaknesses: string[] | null
          website_url: string | null
          website_verified: boolean | null
        }
        Insert: {
          actual_cost?: number | null
          ai_drill_down_history?: Json | null
          analysis_data?: Json | null
          analysis_id?: string | null
          brand_strength_score?: number | null
          business_model?: string | null
          company_profile_id?: string | null
          completed_at?: string | null
          confidence_scores?: Json | null
          cost_breakdown?: Json | null
          created_at?: string | null
          customer_journey_data?: Json | null
          data_completeness_breakdown?: Json | null
          data_completeness_score?: number | null
          data_quality_breakdown?: Json | null
          data_quality_score?: number | null
          description?: string | null
          employee_count?: number | null
          employee_count_verified?: boolean | null
          exchange?: string | null
          financial_data?: Json | null
          founded_year?: number | null
          funding_info?: Json | null
          headquarters?: string | null
          id?: string
          industry?: string | null
          innovation_score?: number | null
          is_public_company?: boolean | null
          last_news_refresh?: string | null
          last_news_update?: string | null
          market_position?: string | null
          market_position_data?: Json | null
          market_sentiment_score?: number | null
          name: string
          news_data?: Json | null
          normalized_scores?: Json | null
          operational_efficiency_score?: number | null
          opportunities?: string[] | null
          organization_id?: string | null
          patent_count?: number | null
          pricing_strategy?: Json | null
          public_company_data?: Json | null
          session_id?: string | null
          social_media_presence?: Json | null
          source_citations?: Json | null
          status?: string | null
          stock_symbol?: string | null
          strengths?: string[] | null
          target_market?: string[] | null
          technology_innovation_data?: Json | null
          threats?: string[] | null
          total_api_cost?: number | null
          updated_at?: string | null
          user_id: string
          weaknesses?: string[] | null
          website_url?: string | null
          website_verified?: boolean | null
        }
        Update: {
          actual_cost?: number | null
          ai_drill_down_history?: Json | null
          analysis_data?: Json | null
          analysis_id?: string | null
          brand_strength_score?: number | null
          business_model?: string | null
          company_profile_id?: string | null
          completed_at?: string | null
          confidence_scores?: Json | null
          cost_breakdown?: Json | null
          created_at?: string | null
          customer_journey_data?: Json | null
          data_completeness_breakdown?: Json | null
          data_completeness_score?: number | null
          data_quality_breakdown?: Json | null
          data_quality_score?: number | null
          description?: string | null
          employee_count?: number | null
          employee_count_verified?: boolean | null
          exchange?: string | null
          financial_data?: Json | null
          founded_year?: number | null
          funding_info?: Json | null
          headquarters?: string | null
          id?: string
          industry?: string | null
          innovation_score?: number | null
          is_public_company?: boolean | null
          last_news_refresh?: string | null
          last_news_update?: string | null
          market_position?: string | null
          market_position_data?: Json | null
          market_sentiment_score?: number | null
          name?: string
          news_data?: Json | null
          normalized_scores?: Json | null
          operational_efficiency_score?: number | null
          opportunities?: string[] | null
          organization_id?: string | null
          patent_count?: number | null
          pricing_strategy?: Json | null
          public_company_data?: Json | null
          session_id?: string | null
          social_media_presence?: Json | null
          source_citations?: Json | null
          status?: string | null
          stock_symbol?: string | null
          strengths?: string[] | null
          target_market?: string[] | null
          technology_innovation_data?: Json | null
          threats?: string[] | null
          total_api_cost?: number | null
          updated_at?: string | null
          user_id?: string
          weaknesses?: string[] | null
          website_url?: string | null
          website_verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "competitor_analyses_company_profile_id_fkey"
            columns: ["company_profile_id"]
            isOneToOne: false
            referencedRelation: "company_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_competitor_analyses_company_profile_id"
            columns: ["company_profile_id"]
            isOneToOne: false
            referencedRelation: "company_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      competitor_analysis_progress: {
        Row: {
          completed_competitors: number
          created_at: string | null
          current_competitor: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          progress_percentage: number
          session_id: string
          status: string
          total_competitors: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_competitors?: number
          created_at?: string | null
          current_competitor?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          progress_percentage?: number
          session_id: string
          status?: string
          total_competitors?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_competitors?: number
          created_at?: string | null
          current_competitor?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          progress_percentage?: number
          session_id?: string
          status?: string
          total_competitors?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      compliance_audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      compliance_reports: {
        Row: {
          created_at: string
          file_url: string | null
          generated_by: string
          id: string
          metadata: Json | null
          organization_id: string | null
          period_end: string
          period_start: string
          report_data: Json
          report_type: string
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          file_url?: string | null
          generated_by: string
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          period_end: string
          period_start: string
          report_data?: Json
          report_type: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          file_url?: string | null
          generated_by?: string
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          period_end?: string
          period_start?: string
          report_data?: Json
          report_type?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      component_library: {
        Row: {
          category: string
          created_at: string | null
          created_by: string
          description: string | null
          elements: Json
          id: string
          is_public: boolean | null
          name: string
          preview_url: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          created_by: string
          description?: string | null
          elements?: Json
          id?: string
          is_public?: boolean | null
          name: string
          preview_url?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string
          description?: string | null
          elements?: Json
          id?: string
          is_public?: boolean | null
          name?: string
          preview_url?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      confidence_history: {
        Row: {
          confidence_score: number
          contributing_sources: Json
          data_field: string
          id: string
          master_profile_id: string
          recorded_at: string
          score_calculation_method: string | null
          triggered_by: string | null
        }
        Insert: {
          confidence_score: number
          contributing_sources?: Json
          data_field: string
          id?: string
          master_profile_id: string
          recorded_at?: string
          score_calculation_method?: string | null
          triggered_by?: string | null
        }
        Update: {
          confidence_score?: number
          contributing_sources?: Json
          data_field?: string
          id?: string
          master_profile_id?: string
          recorded_at?: string
          score_calculation_method?: string | null
          triggered_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "confidence_history_master_profile_id_fkey"
            columns: ["master_profile_id"]
            isOneToOne: false
            referencedRelation: "master_company_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          parent_id: string | null
          slug: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "content_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "content_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      content_item_categories: {
        Row: {
          category_id: string
          content_item_id: string
        }
        Insert: {
          category_id: string
          content_item_id: string
        }
        Update: {
          category_id?: string
          content_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_item_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "content_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_item_categories_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      content_items: {
        Row: {
          author_id: string | null
          body: string | null
          content_type: string
          created_at: string | null
          editor_id: string | null
          excerpt: string | null
          id: string
          metadata: Json | null
          published_at: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: string | null
          title: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          author_id?: string | null
          body?: string | null
          content_type: string
          created_at?: string | null
          editor_id?: string | null
          excerpt?: string | null
          id?: string
          metadata?: Json | null
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: string | null
          title: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          author_id?: string | null
          body?: string | null
          content_type?: string
          created_at?: string | null
          editor_id?: string | null
          excerpt?: string | null
          id?: string
          metadata?: Json | null
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: string | null
          title?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: []
      }
      cookie_consents: {
        Row: {
          analytics_cookies: boolean | null
          consent_date: string | null
          expires_at: string | null
          functional_cookies: boolean | null
          id: string
          marketing_cookies: boolean | null
          necessary_cookies: boolean | null
          session_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          analytics_cookies?: boolean | null
          consent_date?: string | null
          expires_at?: string | null
          functional_cookies?: boolean | null
          id?: string
          marketing_cookies?: boolean | null
          necessary_cookies?: boolean | null
          session_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          analytics_cookies?: boolean | null
          consent_date?: string | null
          expires_at?: string | null
          functional_cookies?: boolean | null
          id?: string
          marketing_cookies?: boolean | null
          necessary_cookies?: boolean | null
          session_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      custom_reports: {
        Row: {
          chart_config: Json | null
          created_at: string | null
          description: string | null
          id: string
          is_shared: boolean | null
          last_run_at: string | null
          name: string
          query_config: Json
          schedule_config: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          chart_config?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_shared?: boolean | null
          last_run_at?: string | null
          name: string
          query_config: Json
          schedule_config?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          chart_config?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_shared?: boolean | null
          last_run_at?: string | null
          name?: string
          query_config?: Json
          schedule_config?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      data_exports: {
        Row: {
          completed_at: string | null
          created_at: string | null
          download_url: string | null
          expires_at: string | null
          file_size: number | null
          id: string
          requested_at: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          download_url?: string | null
          expires_at?: string | null
          file_size?: number | null
          id?: string
          requested_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          download_url?: string | null
          expires_at?: string | null
          file_size?: number | null
          id?: string
          requested_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      data_processing_activities: {
        Row: {
          created_at: string | null
          data_categories: string[]
          data_subjects: string[]
          id: string
          legal_basis: string
          name: string
          purpose: string
          recipients: string[] | null
          retention_period: string | null
          security_measures: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data_categories: string[]
          data_subjects: string[]
          id?: string
          legal_basis: string
          name: string
          purpose: string
          recipients?: string[] | null
          retention_period?: string | null
          security_measures?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data_categories?: string[]
          data_subjects?: string[]
          id?: string
          legal_basis?: string
          name?: string
          purpose?: string
          recipients?: string[] | null
          retention_period?: string | null
          security_measures?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      data_quality_metrics: {
        Row: {
          analysis_id: string
          category: string
          completeness_score: number | null
          confidence_level: string | null
          created_at: string | null
          data_source: string | null
          id: string
          metric_name: string
          provenance: Json | null
          quality_score: number | null
          updated_at: string | null
        }
        Insert: {
          analysis_id: string
          category: string
          completeness_score?: number | null
          confidence_level?: string | null
          created_at?: string | null
          data_source?: string | null
          id?: string
          metric_name: string
          provenance?: Json | null
          quality_score?: number | null
          updated_at?: string | null
        }
        Update: {
          analysis_id?: string
          category?: string
          completeness_score?: number | null
          confidence_level?: string | null
          created_at?: string | null
          data_source?: string | null
          id?: string
          metric_name?: string
          provenance?: Json | null
          quality_score?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "data_quality_metrics_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "competitor_analyses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_quality_metrics_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "v_competitor_analysis_full"
            referencedColumns: ["analysis_id"]
          },
        ]
      }
      data_retention_policies: {
        Row: {
          created_at: string | null
          deletion_criteria: Json | null
          id: string
          is_active: boolean | null
          last_run_at: string | null
          retention_period_days: number
          table_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deletion_criteria?: Json | null
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          retention_period_days: number
          table_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deletion_criteria?: Json | null
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          retention_period_days?: number
          table_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      data_subject_requests: {
        Row: {
          id: string
          notes: string | null
          processed_at: string | null
          processed_by: string | null
          request_details: Json | null
          request_type: string
          response_data: Json | null
          status: string | null
          submitted_at: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          request_details?: Json | null
          request_type: string
          response_data?: Json | null
          status?: string | null
          submitted_at?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          request_details?: Json | null
          request_type?: string
          response_data?: Json | null
          status?: string | null
          submitted_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      data_validation_logs: {
        Row: {
          confidence_score: number | null
          created_at: string
          data_field: string
          discrepancy_reason: string | null
          external_source_response: Json
          id: string
          is_valid: boolean | null
          master_profile_id: string
          original_value: string | null
          user_id: string | null
          validated_at: string
          validated_value: string | null
          validation_method: string
          validation_source: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          data_field: string
          discrepancy_reason?: string | null
          external_source_response?: Json
          id?: string
          is_valid?: boolean | null
          master_profile_id: string
          original_value?: string | null
          user_id?: string | null
          validated_at?: string
          validated_value?: string | null
          validation_method: string
          validation_source: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          data_field?: string
          discrepancy_reason?: string | null
          external_source_response?: Json
          id?: string
          is_valid?: boolean | null
          master_profile_id?: string
          original_value?: string | null
          user_id?: string | null
          validated_at?: string
          validated_value?: string | null
          validation_method?: string
          validation_source?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_validation_logs_master_profile_id_fkey"
            columns: ["master_profile_id"]
            isOneToOne: false
            referencedRelation: "master_company_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      data_visualizations: {
        Row: {
          chart_config: Json
          chart_type: string
          created_at: string
          dashboard_id: string | null
          data_source: string
          id: string
          is_active: boolean | null
          metadata: Json | null
          name: string
          position: Json | null
          updated_at: string
        }
        Insert: {
          chart_config?: Json
          chart_type: string
          created_at?: string
          dashboard_id?: string | null
          data_source: string
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name: string
          position?: Json | null
          updated_at?: string
        }
        Update: {
          chart_config?: Json
          chart_type?: string
          created_at?: string
          dashboard_id?: string | null
          data_source?: string
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name?: string
          position?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_visualizations_dashboard_id_fkey"
            columns: ["dashboard_id"]
            isOneToOne: false
            referencedRelation: "analytics_dashboards"
            referencedColumns: ["id"]
          },
        ]
      }
      design_assets: {
        Row: {
          created_at: string | null
          file_url: string | null
          id: string
          metadata: Json | null
          name: string
          project_id: string
          thumbnail_url: string | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          file_url?: string | null
          id?: string
          metadata?: Json | null
          name: string
          project_id: string
          thumbnail_url?: string | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          file_url?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          project_id?: string
          thumbnail_url?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_assets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      device_registrations: {
        Row: {
          app_version: string | null
          created_at: string | null
          device_model: string | null
          device_token: string
          device_type: string
          id: string
          is_active: boolean | null
          last_seen: string | null
          os_version: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          app_version?: string | null
          created_at?: string | null
          device_model?: string | null
          device_token: string
          device_type: string
          id?: string
          is_active?: boolean | null
          last_seen?: string | null
          os_version?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          app_version?: string | null
          created_at?: string | null
          device_model?: string | null
          device_token?: string
          device_type?: string
          id?: string
          is_active?: boolean | null
          last_seen?: string | null
          os_version?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      documentation: {
        Row: {
          category: string | null
          content: string | null
          created_at: string | null
          created_by: string
          file_path: string | null
          file_size: number | null
          id: string
          is_published: boolean | null
          metadata: Json | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
          version: string | null
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          created_by: string
          file_path?: string | null
          file_size?: number | null
          id?: string
          is_published?: boolean | null
          metadata?: Json | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
          version?: string | null
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string
          file_path?: string | null
          file_size?: number | null
          id?: string
          is_published?: boolean | null
          metadata?: Json | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
          version?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string
          description: string | null
          file_path: string
          file_size: number
          file_type: string
          id: string
          metadata: Json | null
          name: string
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_path: string
          file_size: number
          file_type: string
          id?: string
          metadata?: Json | null
          name: string
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          metadata?: Json | null
          name?: string
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      edge_function_metrics: {
        Row: {
          created_at: string
          error_message: string | null
          execution_time_ms: number
          function_name: string
          id: string
          memory_usage_mb: number | null
          metadata: Json | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          execution_time_ms: number
          function_name: string
          id?: string
          memory_usage_mb?: number | null
          metadata?: Json | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          execution_time_ms?: number
          function_name?: string
          id?: string
          memory_usage_mb?: number | null
          metadata?: Json | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      email_events: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          ip_address: unknown | null
          queue_id: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          queue_id?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          queue_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_events_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "email_queue"
            referencedColumns: ["id"]
          },
        ]
      }
      email_preferences: {
        Row: {
          categories: Json | null
          created_at: string | null
          email_address: string
          frequency: string | null
          id: string
          subscription_status: string | null
          unsubscribe_token: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          categories?: Json | null
          created_at?: string | null
          email_address: string
          frequency?: string | null
          id?: string
          subscription_status?: string | null
          unsubscribe_token?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          categories?: Json | null
          created_at?: string | null
          email_address?: string
          frequency?: string | null
          id?: string
          subscription_status?: string | null
          unsubscribe_token?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      email_queue: {
        Row: {
          attempts: number | null
          created_at: string | null
          error_message: string | null
          html_content: string
          id: string
          max_attempts: number | null
          recipient_email: string
          recipient_name: string | null
          scheduled_at: string | null
          sender_email: string
          sender_name: string | null
          sent_at: string | null
          status: string | null
          subject: string
          template_id: string | null
          text_content: string | null
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          error_message?: string | null
          html_content: string
          id?: string
          max_attempts?: number | null
          recipient_email: string
          recipient_name?: string | null
          scheduled_at?: string | null
          sender_email: string
          sender_name?: string | null
          sent_at?: string | null
          status?: string | null
          subject: string
          template_id?: string | null
          text_content?: string | null
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          error_message?: string | null
          html_content?: string
          id?: string
          max_attempts?: number | null
          recipient_email?: string
          recipient_name?: string | null
          scheduled_at?: string | null
          sender_email?: string
          sender_name?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string
          template_id?: string | null
          text_content?: string | null
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "email_queue_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          html_content: string
          id: string
          is_active: boolean | null
          name: string
          subject: string
          text_content: string | null
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          html_content: string
          id?: string
          is_active?: boolean | null
          name: string
          subject: string
          text_content?: string | null
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          html_content?: string
          id?: string
          is_active?: boolean | null
          name?: string
          subject?: string
          text_content?: string | null
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: []
      }
      error_events: {
        Row: {
          component: string | null
          created_at: string
          error_type: string | null
          id: string
          message: string
          metadata: Json | null
          route: string | null
          session_id: string | null
          severity: string | null
          source: string
          stack: string | null
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          component?: string | null
          created_at?: string
          error_type?: string | null
          id?: string
          message: string
          metadata?: Json | null
          route?: string | null
          session_id?: string | null
          severity?: string | null
          source: string
          stack?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          component?: string | null
          created_at?: string
          error_type?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          route?: string | null
          session_id?: string | null
          severity?: string | null
          source?: string
          stack?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      export_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          file_url: string | null
          id: string
          request: Json
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          file_url?: string | null
          id?: string
          request: Json
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          file_url?: string | null
          id?: string
          request?: Json
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      feature_flag_audit: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          details: Json
          enabled: boolean | null
          flag_name: string
          id: string
          scope_id: string | null
          scope_type: string
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          details?: Json
          enabled?: boolean | null
          flag_name: string
          id?: string
          scope_id?: string | null
          scope_type: string
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          details?: Json
          enabled?: boolean | null
          flag_name?: string
          id?: string
          scope_id?: string | null
          scope_type?: string
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          created_at: string | null
          description: string | null
          flag_key: string | null
          flag_name: string
          id: string
          is_enabled: boolean | null
          metadata: Json | null
          project_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          flag_key?: string | null
          flag_name: string
          id?: string
          is_enabled?: boolean | null
          metadata?: Json | null
          project_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          flag_key?: string | null
          flag_name?: string
          id?: string
          is_enabled?: boolean | null
          metadata?: Json | null
          project_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feature_flags_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_collection: {
        Row: {
          created_at: string
          description: string | null
          feedback_data: Json
          feedback_type: string | null
          id: string
          metadata: Json | null
          priority: string | null
          project_id: string | null
          source_info: Json | null
          status: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          feedback_data?: Json
          feedback_type?: string | null
          id?: string
          metadata?: Json | null
          priority?: string | null
          project_id?: string | null
          source_info?: Json | null
          status?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          feedback_data?: Json
          feedback_type?: string | null
          id?: string
          metadata?: Json | null
          priority?: string | null
          project_id?: string | null
          source_info?: Json | null
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_collection_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "mvp_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      flow_definitions: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          name: string
          updated_at: string | null
        }
        Insert: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      flow_test_runs: {
        Row: {
          competitor: string | null
          created_at: string
          function_error: Json | null
          id: string
          prompt: string | null
          providers: Json
          report: Json | null
          run_type: string
          steps: Json
          success: boolean
          user_id: string
        }
        Insert: {
          competitor?: string | null
          created_at?: string
          function_error?: Json | null
          id?: string
          prompt?: string | null
          providers?: Json
          report?: Json | null
          run_type?: string
          steps?: Json
          success?: boolean
          user_id: string
        }
        Update: {
          competitor?: string | null
          created_at?: string
          function_error?: Json | null
          id?: string
          prompt?: string | null
          providers?: Json
          report?: Json | null
          run_type?: string
          steps?: Json
          success?: boolean
          user_id?: string
        }
        Relationships: []
      }
      import_jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          file_name: string
          file_size: number | null
          id: string
          import_type: string
          metadata: Json | null
          processed_rows: number | null
          started_at: string | null
          status: string | null
          total_rows: number | null
          user_id: string
          validation_errors: Json | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          file_name: string
          file_size?: number | null
          id?: string
          import_type: string
          metadata?: Json | null
          processed_rows?: number | null
          started_at?: string | null
          status?: string | null
          total_rows?: number | null
          user_id: string
          validation_errors?: Json | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          file_name?: string
          file_size?: number | null
          id?: string
          import_type?: string
          metadata?: Json | null
          processed_rows?: number | null
          started_at?: string | null
          status?: string | null
          total_rows?: number | null
          user_id?: string
          validation_errors?: Json | null
        }
        Relationships: []
      }
      integration_settings: {
        Row: {
          api_key_permissions: Json | null
          api_keys_enabled: boolean | null
          created_at: string | null
          figma_enabled: boolean | null
          figma_files: Json | null
          figma_token: string | null
          github_enabled: boolean | null
          github_repos: Json | null
          github_token: string | null
          google_calendar_enabled: boolean | null
          google_calendar_ids: Json | null
          google_calendar_token: string | null
          id: string
          slack_channels: Json | null
          slack_enabled: boolean | null
          slack_token: string | null
          updated_at: string | null
          user_id: string
          webhook_secret: string | null
          webhooks_enabled: boolean | null
          zapier_enabled: boolean | null
          zapier_webhook_url: string | null
        }
        Insert: {
          api_key_permissions?: Json | null
          api_keys_enabled?: boolean | null
          created_at?: string | null
          figma_enabled?: boolean | null
          figma_files?: Json | null
          figma_token?: string | null
          github_enabled?: boolean | null
          github_repos?: Json | null
          github_token?: string | null
          google_calendar_enabled?: boolean | null
          google_calendar_ids?: Json | null
          google_calendar_token?: string | null
          id?: string
          slack_channels?: Json | null
          slack_enabled?: boolean | null
          slack_token?: string | null
          updated_at?: string | null
          user_id: string
          webhook_secret?: string | null
          webhooks_enabled?: boolean | null
          zapier_enabled?: boolean | null
          zapier_webhook_url?: string | null
        }
        Update: {
          api_key_permissions?: Json | null
          api_keys_enabled?: boolean | null
          created_at?: string | null
          figma_enabled?: boolean | null
          figma_files?: Json | null
          figma_token?: string | null
          github_enabled?: boolean | null
          github_repos?: Json | null
          github_token?: string | null
          google_calendar_enabled?: boolean | null
          google_calendar_ids?: Json | null
          google_calendar_token?: string | null
          id?: string
          slack_channels?: Json | null
          slack_enabled?: boolean | null
          slack_token?: string | null
          updated_at?: string | null
          user_id?: string
          webhook_secret?: string | null
          webhooks_enabled?: boolean | null
          zapier_enabled?: boolean | null
          zapier_webhook_url?: string | null
        }
        Relationships: []
      }
      knowledge_base_articles: {
        Row: {
          category: string
          content: string
          created_at: string | null
          created_by: string
          helpful_count: number | null
          id: string
          is_published: boolean | null
          not_helpful_count: number | null
          tags: string[] | null
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          category: string
          content: string
          created_at?: string | null
          created_by: string
          helpful_count?: number | null
          id?: string
          is_published?: boolean | null
          not_helpful_count?: number | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string | null
          created_by?: string
          helpful_count?: number | null
          id?: string
          is_published?: boolean | null
          not_helpful_count?: number | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      knowledge_base_feedback: {
        Row: {
          article_id: string
          created_at: string
          feedback_text: string | null
          feedback_type: string
          id: string
          user_agent: string | null
          user_id: string | null
          user_ip: unknown | null
        }
        Insert: {
          article_id: string
          created_at?: string
          feedback_text?: string | null
          feedback_type: string
          id?: string
          user_agent?: string | null
          user_id?: string | null
          user_ip?: unknown | null
        }
        Update: {
          article_id?: string
          created_at?: string
          feedback_text?: string | null
          feedback_type?: string
          id?: string
          user_agent?: string | null
          user_id?: string | null
          user_ip?: unknown | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_base_feedback_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "knowledge_base_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_documents: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          document_type: string
          effective_date: string
          id: string
          is_active: boolean | null
          title: string
          updated_at: string | null
          version: string
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          document_type: string
          effective_date: string
          id?: string
          is_active?: boolean | null
          title: string
          updated_at?: string | null
          version: string
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          document_type?: string
          effective_date?: string
          id?: string
          is_active?: boolean | null
          title?: string
          updated_at?: string | null
          version?: string
        }
        Relationships: []
      }
      lists: {
        Row: {
          color: string | null
          created_at: string | null
          created_by: string
          id: string
          name: string
          position: number | null
          project_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          created_by: string
          id?: string
          name: string
          position?: number | null
          project_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          created_by?: string
          id?: string
          name?: string
          position?: number | null
          project_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lists_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      market_analysis_sessions: {
        Row: {
          ai_models_used: string[] | null
          analysis_result: Json | null
          company_name: string | null
          confidence_scores: Json | null
          consistency_score: number | null
          created_at: string
          data_quality_score: number | null
          id: string
          market_segment: string | null
          processing_time_ms: number | null
          query_text: string
          sentiment_score: number | null
          session_type: string
          source_citations: Json | null
          sources_checked: number | null
          ticker_symbol: string | null
          time_range: string | null
          updated_at: string
          user_id: string
          validation_status: string | null
        }
        Insert: {
          ai_models_used?: string[] | null
          analysis_result?: Json | null
          company_name?: string | null
          confidence_scores?: Json | null
          consistency_score?: number | null
          created_at?: string
          data_quality_score?: number | null
          id?: string
          market_segment?: string | null
          processing_time_ms?: number | null
          query_text: string
          sentiment_score?: number | null
          session_type: string
          source_citations?: Json | null
          sources_checked?: number | null
          ticker_symbol?: string | null
          time_range?: string | null
          updated_at?: string
          user_id: string
          validation_status?: string | null
        }
        Update: {
          ai_models_used?: string[] | null
          analysis_result?: Json | null
          company_name?: string | null
          confidence_scores?: Json | null
          consistency_score?: number | null
          created_at?: string
          data_quality_score?: number | null
          id?: string
          market_segment?: string | null
          processing_time_ms?: number | null
          query_text?: string
          sentiment_score?: number | null
          session_type?: string
          source_citations?: Json | null
          sources_checked?: number | null
          ticker_symbol?: string | null
          time_range?: string | null
          updated_at?: string
          user_id?: string
          validation_status?: string | null
        }
        Relationships: []
      }
      market_data_cache: {
        Row: {
          cached_data: Json
          created_at: string
          data_type: string
          expires_at: string
          id: string
          ticker_symbol: string
          time_range: string
        }
        Insert: {
          cached_data: Json
          created_at?: string
          data_type: string
          expires_at: string
          id?: string
          ticker_symbol: string
          time_range: string
        }
        Update: {
          cached_data?: Json
          created_at?: string
          data_type?: string
          expires_at?: string
          id?: string
          ticker_symbol?: string
          time_range?: string
        }
        Relationships: []
      }
      market_data_validation: {
        Row: {
          created_at: string
          cross_references: string[] | null
          data_identifier: string
          data_type: string
          discrepancies: Json | null
          expiry_timestamp: string | null
          id: string
          metadata: Json | null
          validated_by: string
          validation_method: string
          validation_score: number
          validation_timestamp: string
        }
        Insert: {
          created_at?: string
          cross_references?: string[] | null
          data_identifier: string
          data_type: string
          discrepancies?: Json | null
          expiry_timestamp?: string | null
          id?: string
          metadata?: Json | null
          validated_by: string
          validation_method: string
          validation_score: number
          validation_timestamp?: string
        }
        Update: {
          created_at?: string
          cross_references?: string[] | null
          data_identifier?: string
          data_type?: string
          discrepancies?: Json | null
          expiry_timestamp?: string | null
          id?: string
          metadata?: Json | null
          validated_by?: string
          validation_method?: string
          validation_score?: number
          validation_timestamp?: string
        }
        Relationships: []
      }
      market_news: {
        Row: {
          bias_score: number | null
          company_name: string | null
          confidence_score: number | null
          content: string | null
          created_at: string
          fact_checked: boolean | null
          headline: string
          id: string
          metadata: Json | null
          published_at: string
          relevance_score: number | null
          sentiment_label: string | null
          sentiment_score: number | null
          source: string
          source_category: string | null
          source_reliability_score: number | null
          summary: string | null
          tags: string[] | null
          ticker_symbol: string | null
          url: string | null
          verification_timestamp: string | null
        }
        Insert: {
          bias_score?: number | null
          company_name?: string | null
          confidence_score?: number | null
          content?: string | null
          created_at?: string
          fact_checked?: boolean | null
          headline: string
          id?: string
          metadata?: Json | null
          published_at: string
          relevance_score?: number | null
          sentiment_label?: string | null
          sentiment_score?: number | null
          source: string
          source_category?: string | null
          source_reliability_score?: number | null
          summary?: string | null
          tags?: string[] | null
          ticker_symbol?: string | null
          url?: string | null
          verification_timestamp?: string | null
        }
        Update: {
          bias_score?: number | null
          company_name?: string | null
          confidence_score?: number | null
          content?: string | null
          created_at?: string
          fact_checked?: boolean | null
          headline?: string
          id?: string
          metadata?: Json | null
          published_at?: string
          relevance_score?: number | null
          sentiment_label?: string | null
          sentiment_score?: number | null
          source?: string
          source_category?: string | null
          source_reliability_score?: number | null
          summary?: string | null
          tags?: string[] | null
          ticker_symbol?: string | null
          url?: string | null
          verification_timestamp?: string | null
        }
        Relationships: []
      }
      market_queries: {
        Row: {
          ai_response: string | null
          confidence_score: number | null
          created_at: string
          id: string
          processing_time_ms: number | null
          query_text: string
          query_type: string
          related_analyses: string[] | null
          response_data: Json | null
          status: string | null
          ticker_symbols: string[] | null
          time_range: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_response?: string | null
          confidence_score?: number | null
          created_at?: string
          id?: string
          processing_time_ms?: number | null
          query_text: string
          query_type?: string
          related_analyses?: string[] | null
          response_data?: Json | null
          status?: string | null
          ticker_symbols?: string[] | null
          time_range?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_response?: string | null
          confidence_score?: number | null
          created_at?: string
          id?: string
          processing_time_ms?: number | null
          query_text?: string
          query_type?: string
          related_analyses?: string[] | null
          response_data?: Json | null
          status?: string | null
          ticker_symbols?: string[] | null
          time_range?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      market_research: {
        Row: {
          ai_summary: string | null
          completed_at: string | null
          confidence_score: number | null
          created_at: string
          data_sources: Json | null
          description: string | null
          id: string
          metadata: Json | null
          query_type: string | null
          research_data: Json
          research_type: string
          sentiment_score: number | null
          status: string | null
          ticker_symbol: string | null
          time_range: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_summary?: string | null
          completed_at?: string | null
          confidence_score?: number | null
          created_at?: string
          data_sources?: Json | null
          description?: string | null
          id?: string
          metadata?: Json | null
          query_type?: string | null
          research_data?: Json
          research_type: string
          sentiment_score?: number | null
          status?: string | null
          ticker_symbol?: string | null
          time_range?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_summary?: string | null
          completed_at?: string | null
          confidence_score?: number | null
          created_at?: string
          data_sources?: Json | null
          description?: string | null
          id?: string
          metadata?: Json | null
          query_type?: string | null
          research_data?: Json
          research_type?: string
          sentiment_score?: number | null
          status?: string | null
          ticker_symbol?: string | null
          time_range?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      market_sentiment_scores: {
        Row: {
          calculated_at: string
          company_name: string | null
          confidence_score: number | null
          created_at: string
          cross_validation_score: number | null
          data_sources: string[]
          factors: Json | null
          id: string
          market_segment: string | null
          sentiment_label: string
          sentiment_score: number
          source_count: number | null
          ticker_symbol: string | null
          validation_method: string | null
        }
        Insert: {
          calculated_at?: string
          company_name?: string | null
          confidence_score?: number | null
          created_at?: string
          cross_validation_score?: number | null
          data_sources: string[]
          factors?: Json | null
          id?: string
          market_segment?: string | null
          sentiment_label: string
          sentiment_score: number
          source_count?: number | null
          ticker_symbol?: string | null
          validation_method?: string | null
        }
        Update: {
          calculated_at?: string
          company_name?: string | null
          confidence_score?: number | null
          created_at?: string
          cross_validation_score?: number | null
          data_sources?: string[]
          factors?: Json | null
          id?: string
          market_segment?: string | null
          sentiment_label?: string
          sentiment_score?: number
          source_count?: number | null
          ticker_symbol?: string | null
          validation_method?: string | null
        }
        Relationships: []
      }
      marketing_campaigns: {
        Row: {
          content: Json
          created_at: string | null
          created_by: string | null
          id: string
          metrics: Json | null
          name: string
          scheduled_at: string | null
          status: string | null
          target_segment_id: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          content: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          metrics?: Json | null
          name: string
          scheduled_at?: string | null
          status?: string | null
          target_segment_id?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          content?: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          metrics?: Json | null
          name?: string
          scheduled_at?: string | null
          status?: string | null
          target_segment_id?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_campaigns_target_segment_id_fkey"
            columns: ["target_segment_id"]
            isOneToOne: false
            referencedRelation: "user_segments"
            referencedColumns: ["id"]
          },
        ]
      }
      master_company_profiles: {
        Row: {
          business_model: string | null
          certifications: string[] | null
          company_name: string
          competitive_advantages: string[] | null
          created_at: string | null
          data_completeness_score: number | null
          data_quality_score: number | null
          data_sources: Json | null
          description: string | null
          employee_count: number | null
          financial_metrics: Json | null
          founded_year: number | null
          funding_rounds: Json | null
          headquarters: string | null
          id: string
          industry: string | null
          key_executives: Json | null
          key_products: string[] | null
          last_updated: string | null
          last_validation_date: string | null
          market_cap: number | null
          normalized_name: string | null
          overall_confidence_score: number | null
          partnerships: string[] | null
          revenue_estimate: number | null
          social_media_profiles: Json | null
          source_analyses: Json | null
          target_markets: string[] | null
          technology_stack: Json | null
          updated_at: string | null
          validation_status: string | null
          verification_status: string | null
          website_url: string | null
        }
        Insert: {
          business_model?: string | null
          certifications?: string[] | null
          company_name: string
          competitive_advantages?: string[] | null
          created_at?: string | null
          data_completeness_score?: number | null
          data_quality_score?: number | null
          data_sources?: Json | null
          description?: string | null
          employee_count?: number | null
          financial_metrics?: Json | null
          founded_year?: number | null
          funding_rounds?: Json | null
          headquarters?: string | null
          id?: string
          industry?: string | null
          key_executives?: Json | null
          key_products?: string[] | null
          last_updated?: string | null
          last_validation_date?: string | null
          market_cap?: number | null
          normalized_name?: string | null
          overall_confidence_score?: number | null
          partnerships?: string[] | null
          revenue_estimate?: number | null
          social_media_profiles?: Json | null
          source_analyses?: Json | null
          target_markets?: string[] | null
          technology_stack?: Json | null
          updated_at?: string | null
          validation_status?: string | null
          verification_status?: string | null
          website_url?: string | null
        }
        Update: {
          business_model?: string | null
          certifications?: string[] | null
          company_name?: string
          competitive_advantages?: string[] | null
          created_at?: string | null
          data_completeness_score?: number | null
          data_quality_score?: number | null
          data_sources?: Json | null
          description?: string | null
          employee_count?: number | null
          financial_metrics?: Json | null
          founded_year?: number | null
          funding_rounds?: Json | null
          headquarters?: string | null
          id?: string
          industry?: string | null
          key_executives?: Json | null
          key_products?: string[] | null
          last_updated?: string | null
          last_validation_date?: string | null
          market_cap?: number | null
          normalized_name?: string | null
          overall_confidence_score?: number | null
          partnerships?: string[] | null
          revenue_estimate?: number | null
          social_media_profiles?: Json | null
          source_analyses?: Json | null
          target_markets?: string[] | null
          technology_stack?: Json | null
          updated_at?: string | null
          validation_status?: string | null
          verification_status?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      master_profile_contributions: {
        Row: {
          company_name: string
          confidence_score: number | null
          created_at: string | null
          field_name: string
          field_value: Json
          id: string
          source_type: string | null
          updated_at: string | null
          user_id: string
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          company_name: string
          confidence_score?: number | null
          created_at?: string | null
          field_name: string
          field_value: Json
          id?: string
          source_type?: string | null
          updated_at?: string | null
          user_id: string
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          company_name?: string
          confidence_score?: number | null
          created_at?: string | null
          field_name?: string
          field_value?: Json
          id?: string
          source_type?: string | null
          updated_at?: string | null
          user_id?: string
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      master_profile_merges: {
        Row: {
          confidence_changes: Json | null
          conflicts_resolved: number | null
          data_quality_after: number | null
          data_quality_before: number | null
          fields_updated: string[]
          id: string
          master_profile_id: string
          merge_algorithm: string | null
          merge_notes: string | null
          merge_type: string
          performed_at: string
          performed_by: string | null
          rollback_data: Json | null
          source_analysis_id: string | null
        }
        Insert: {
          confidence_changes?: Json | null
          conflicts_resolved?: number | null
          data_quality_after?: number | null
          data_quality_before?: number | null
          fields_updated?: string[]
          id?: string
          master_profile_id: string
          merge_algorithm?: string | null
          merge_notes?: string | null
          merge_type: string
          performed_at?: string
          performed_by?: string | null
          rollback_data?: Json | null
          source_analysis_id?: string | null
        }
        Update: {
          confidence_changes?: Json | null
          conflicts_resolved?: number | null
          data_quality_after?: number | null
          data_quality_before?: number | null
          fields_updated?: string[]
          id?: string
          master_profile_id?: string
          merge_algorithm?: string | null
          merge_notes?: string | null
          merge_type?: string
          performed_at?: string
          performed_by?: string | null
          rollback_data?: Json | null
          source_analysis_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "master_profile_merges_master_profile_id_fkey"
            columns: ["master_profile_id"]
            isOneToOne: false
            referencedRelation: "master_company_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      memory_usage_logs: {
        Row: {
          active_connections: number | null
          active_subscriptions: number | null
          component: string
          garbage_collections: number | null
          id: string
          memory_leaks_detected: number | null
          memory_usage_mb: number
          metadata: Json | null
          peak_memory_mb: number | null
          recorded_at: string | null
        }
        Insert: {
          active_connections?: number | null
          active_subscriptions?: number | null
          component: string
          garbage_collections?: number | null
          id?: string
          memory_leaks_detected?: number | null
          memory_usage_mb: number
          metadata?: Json | null
          peak_memory_mb?: number | null
          recorded_at?: string | null
        }
        Update: {
          active_connections?: number | null
          active_subscriptions?: number | null
          component?: string
          garbage_collections?: number | null
          id?: string
          memory_leaks_detected?: number | null
          memory_usage_mb?: number
          metadata?: Json | null
          peak_memory_mb?: number | null
          recorded_at?: string | null
        }
        Relationships: []
      }
      microservices: {
        Row: {
          created_at: string | null
          description: string | null
          display_name: string
          endpoint_url: string | null
          environment: Json | null
          health_status: string | null
          id: string
          last_health_check: string | null
          name: string
          port: number | null
          resource_limits: Json | null
          status: string | null
          updated_at: string | null
          version: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_name: string
          endpoint_url?: string | null
          environment?: Json | null
          health_status?: string | null
          id?: string
          last_health_check?: string | null
          name: string
          port?: number | null
          resource_limits?: Json | null
          status?: string | null
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_name?: string
          endpoint_url?: string | null
          environment?: Json | null
          health_status?: string | null
          id?: string
          last_health_check?: string | null
          name?: string
          port?: number | null
          resource_limits?: Json | null
          status?: string | null
          updated_at?: string | null
          version?: string | null
        }
        Relationships: []
      }
      model_availability: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          is_available: boolean
          last_checked: string
          model_id: string
          provider: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          is_available?: boolean
          last_checked?: string
          model_id: string
          provider: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          is_available?: boolean
          last_checked?: string
          model_id?: string
          provider?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      model_versions: {
        Row: {
          capabilities: Json | null
          created_at: string
          id: string
          is_active: boolean | null
          metadata: Json | null
          model_name: string
          pricing: Json | null
          provider: string
          updated_at: string
          version: string
        }
        Insert: {
          capabilities?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          model_name: string
          pricing?: Json | null
          provider: string
          updated_at?: string
          version: string
        }
        Update: {
          capabilities?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          model_name?: string
          pricing?: Json | null
          provider?: string
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      mvp_projects: {
        Row: {
          budget_estimate: number | null
          created_at: string
          deployment_url: string | null
          description: string | null
          features: Json | null
          id: string
          metadata: Json | null
          name: string
          project_type: string | null
          repository_url: string | null
          status: string | null
          tech_stack: Json | null
          timeline: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          budget_estimate?: number | null
          created_at?: string
          deployment_url?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          metadata?: Json | null
          name: string
          project_type?: string | null
          repository_url?: string | null
          status?: string | null
          tech_stack?: Json | null
          timeline?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          budget_estimate?: number | null
          created_at?: string
          deployment_url?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          metadata?: Json | null
          name?: string
          project_type?: string | null
          repository_url?: string | null
          status?: string | null
          tech_stack?: Json | null
          timeline?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      news_articles: {
        Row: {
          api_cost: number | null
          article_content: string | null
          competitor_analysis_id: string
          created_at: string | null
          description: string | null
          id: string
          published_at: string | null
          relevance_score: number | null
          sentiment_score: number | null
          source: string | null
          title: string
          updated_at: string | null
          url: string | null
        }
        Insert: {
          api_cost?: number | null
          article_content?: string | null
          competitor_analysis_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          published_at?: string | null
          relevance_score?: number | null
          sentiment_score?: number | null
          source?: string | null
          title: string
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          api_cost?: number | null
          article_content?: string | null
          competitor_analysis_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          published_at?: string | null
          relevance_score?: number | null
          sentiment_score?: number | null
          source?: string | null
          title?: string
          updated_at?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "news_articles_competitor_analysis_id_fkey"
            columns: ["competitor_analysis_id"]
            isOneToOne: false
            referencedRelation: "competitor_analyses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_articles_competitor_analysis_id_fkey"
            columns: ["competitor_analysis_id"]
            isOneToOne: false
            referencedRelation: "v_competitor_analysis_full"
            referencedColumns: ["analysis_id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string | null
          deadline_reminders: boolean | null
          email_notifications: boolean | null
          id: string
          in_app_comments: boolean | null
          in_app_mentions: boolean | null
          in_app_notifications: boolean | null
          in_app_project_updates: boolean | null
          in_app_task_assignments: boolean | null
          marketing_emails: boolean | null
          notification_frequency: string | null
          product_updates: boolean | null
          project_updates: boolean | null
          push_deadline_reminders: boolean | null
          push_notifications: boolean | null
          push_project_updates: boolean | null
          push_task_assignments: boolean | null
          push_team_activity: boolean | null
          quiet_hours_enabled: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          task_assignments: boolean | null
          team_invites: boolean | null
          updated_at: string | null
          user_id: string
          weekly_digest: boolean | null
        }
        Insert: {
          created_at?: string | null
          deadline_reminders?: boolean | null
          email_notifications?: boolean | null
          id?: string
          in_app_comments?: boolean | null
          in_app_mentions?: boolean | null
          in_app_notifications?: boolean | null
          in_app_project_updates?: boolean | null
          in_app_task_assignments?: boolean | null
          marketing_emails?: boolean | null
          notification_frequency?: string | null
          product_updates?: boolean | null
          project_updates?: boolean | null
          push_deadline_reminders?: boolean | null
          push_notifications?: boolean | null
          push_project_updates?: boolean | null
          push_task_assignments?: boolean | null
          push_team_activity?: boolean | null
          quiet_hours_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          task_assignments?: boolean | null
          team_invites?: boolean | null
          updated_at?: string | null
          user_id: string
          weekly_digest?: boolean | null
        }
        Update: {
          created_at?: string | null
          deadline_reminders?: boolean | null
          email_notifications?: boolean | null
          id?: string
          in_app_comments?: boolean | null
          in_app_mentions?: boolean | null
          in_app_notifications?: boolean | null
          in_app_project_updates?: boolean | null
          in_app_task_assignments?: boolean | null
          marketing_emails?: boolean | null
          notification_frequency?: string | null
          product_updates?: boolean | null
          project_updates?: boolean | null
          push_deadline_reminders?: boolean | null
          push_notifications?: boolean | null
          push_project_updates?: boolean | null
          push_task_assignments?: boolean | null
          push_team_activity?: boolean | null
          quiet_hours_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          task_assignments?: boolean | null
          team_invites?: boolean | null
          updated_at?: string | null
          user_id?: string
          weekly_digest?: boolean | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          metadata: Json | null
          read: boolean | null
          title: string
          type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          read?: boolean | null
          title: string
          type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          read?: boolean | null
          title?: string
          type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      organization_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          metadata: Json | null
          organization_id: string
          role: string
          status: string | null
          token: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          metadata?: Json | null
          organization_id: string
          role?: string
          status?: string | null
          token?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          metadata?: Json | null
          organization_id?: string
          role?: string
          status?: string | null
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          invited_at: string | null
          invited_by: string | null
          is_active: boolean | null
          joined_at: string | null
          metadata: Json | null
          organization_id: string
          permissions: Json | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean | null
          joined_at?: string | null
          metadata?: Json | null
          organization_id: string
          permissions?: Json | null
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean | null
          joined_at?: string | null
          metadata?: Json | null
          organization_id?: string
          permissions?: Json | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          industry: string | null
          is_active: boolean | null
          logo_url: string | null
          metadata: Json | null
          name: string
          settings: Json | null
          size_category: string | null
          slug: string | null
          subscription_tier: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          metadata?: Json | null
          name: string
          settings?: Json | null
          size_category?: string | null
          slug?: string | null
          subscription_tier?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          metadata?: Json | null
          name?: string
          settings?: Json | null
          size_category?: string | null
          slug?: string | null
          subscription_tier?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      package_dependencies: {
        Row: {
          created_at: string | null
          current_version: string
          description: string | null
          homepage: string | null
          id: string
          is_vulnerable: boolean | null
          last_checked: string | null
          latest_version: string | null
          name: string
          updated_at: string | null
          vulnerability_details: Json | null
        }
        Insert: {
          created_at?: string | null
          current_version: string
          description?: string | null
          homepage?: string | null
          id?: string
          is_vulnerable?: boolean | null
          last_checked?: string | null
          latest_version?: string | null
          name: string
          updated_at?: string | null
          vulnerability_details?: Json | null
        }
        Update: {
          created_at?: string | null
          current_version?: string
          description?: string | null
          homepage?: string | null
          id?: string
          is_vulnerable?: boolean | null
          last_checked?: string | null
          latest_version?: string | null
          name?: string
          updated_at?: string | null
          vulnerability_details?: Json | null
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          card_brand: string | null
          card_exp_month: number | null
          card_exp_year: number | null
          card_last4: string | null
          created_at: string
          id: string
          is_default: boolean
          stripe_payment_method_id: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          card_brand?: string | null
          card_exp_month?: number | null
          card_exp_year?: number | null
          card_last4?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          stripe_payment_method_id: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          card_brand?: string | null
          card_exp_month?: number | null
          card_exp_year?: number | null
          card_last4?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          stripe_payment_method_id?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string
          id: string
          status: string
          stripe_payment_intent_id: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string
          id?: string
          status: string
          stripe_payment_intent_id: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string
          id?: string
          status?: string
          stripe_payment_intent_id?: string
          user_id?: string
        }
        Relationships: []
      }
      performance_logs: {
        Row: {
          component: string
          created_at: string | null
          error_details: Json | null
          execution_time_ms: number
          id: string
          metadata: Json | null
          operation_name: string
          request_id: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          component: string
          created_at?: string | null
          error_details?: Json | null
          execution_time_ms: number
          id?: string
          metadata?: Json | null
          operation_name: string
          request_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          component?: string
          created_at?: string | null
          error_details?: Json | null
          execution_time_ms?: number
          id?: string
          metadata?: Json | null
          operation_name?: string
          request_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      performance_metrics: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          metric_name: string
          metric_value: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          metric_name: string
          metric_value: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          metric_name?: string
          metric_value?: number
          user_id?: string
        }
        Relationships: []
      }
      platform_roles: {
        Row: {
          created_at: string | null
          expires_at: string | null
          granted_at: string | null
          granted_by: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          role: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      prds: {
        Row: {
          ai_generated: boolean | null
          content: string | null
          created_at: string | null
          id: string
          project_id: string
          status: string | null
          template_used: string | null
          title: string
          updated_at: string | null
          user_id: string
          version: number | null
          word_count: number | null
        }
        Insert: {
          ai_generated?: boolean | null
          content?: string | null
          created_at?: string | null
          id?: string
          project_id: string
          status?: string | null
          template_used?: string | null
          title: string
          updated_at?: string | null
          user_id: string
          version?: number | null
          word_count?: number | null
        }
        Update: {
          ai_generated?: boolean | null
          content?: string | null
          created_at?: string | null
          id?: string
          project_id?: string
          status?: string | null
          template_used?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          version?: number | null
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "prds_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      privacy_settings: {
        Row: {
          ai_training_consent: boolean | null
          allow_direct_messages: boolean | null
          allow_mentions: boolean | null
          crash_reporting: boolean | null
          created_at: string | null
          data_analytics: boolean | null
          id: string
          location_tracking: boolean | null
          marketing_analytics: boolean | null
          performance_analytics: boolean | null
          profile_visibility: string | null
          searchable_by_email: boolean | null
          searchable_by_name: boolean | null
          show_activity_status: boolean | null
          show_email: boolean | null
          show_location: boolean | null
          show_phone: boolean | null
          third_party_integrations: boolean | null
          updated_at: string | null
          usage_statistics: boolean | null
          user_id: string
        }
        Insert: {
          ai_training_consent?: boolean | null
          allow_direct_messages?: boolean | null
          allow_mentions?: boolean | null
          crash_reporting?: boolean | null
          created_at?: string | null
          data_analytics?: boolean | null
          id?: string
          location_tracking?: boolean | null
          marketing_analytics?: boolean | null
          performance_analytics?: boolean | null
          profile_visibility?: string | null
          searchable_by_email?: boolean | null
          searchable_by_name?: boolean | null
          show_activity_status?: boolean | null
          show_email?: boolean | null
          show_location?: boolean | null
          show_phone?: boolean | null
          third_party_integrations?: boolean | null
          updated_at?: string | null
          usage_statistics?: boolean | null
          user_id: string
        }
        Update: {
          ai_training_consent?: boolean | null
          allow_direct_messages?: boolean | null
          allow_mentions?: boolean | null
          crash_reporting?: boolean | null
          created_at?: string | null
          data_analytics?: boolean | null
          id?: string
          location_tracking?: boolean | null
          marketing_analytics?: boolean | null
          performance_analytics?: boolean | null
          profile_visibility?: string | null
          searchable_by_email?: boolean | null
          searchable_by_name?: boolean | null
          show_activity_status?: boolean | null
          show_email?: boolean | null
          show_location?: boolean | null
          show_phone?: boolean | null
          third_party_integrations?: boolean | null
          updated_at?: string | null
          usage_statistics?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      profile_field_contributions: {
        Row: {
          analysis_id: string | null
          confidence_score: number | null
          created_at: string
          field_name: string
          id: string
          is_verified: boolean | null
          new_value: Json | null
          old_value: Json | null
          profile_id: string
          provider: string | null
          user_id: string
          verification_date: string | null
          verification_method: string | null
        }
        Insert: {
          analysis_id?: string | null
          confidence_score?: number | null
          created_at?: string
          field_name: string
          id?: string
          is_verified?: boolean | null
          new_value?: Json | null
          old_value?: Json | null
          profile_id: string
          provider?: string | null
          user_id: string
          verification_date?: string | null
          verification_method?: string | null
        }
        Update: {
          analysis_id?: string | null
          confidence_score?: number | null
          created_at?: string
          field_name?: string
          id?: string
          is_verified?: boolean | null
          new_value?: Json | null
          old_value?: Json | null
          profile_id?: string
          provider?: string | null
          user_id?: string
          verification_date?: string | null
          verification_method?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_field_contributions_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "competitor_analyses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_field_contributions_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "v_competitor_analysis_full"
            referencedColumns: ["analysis_id"]
          },
          {
            foreignKeyName: "profile_field_contributions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "master_company_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_quality_metrics: {
        Row: {
          accuracy_score: number
          ai_improvement_score: number | null
          ai_suggestions: Json | null
          calculated_at: string
          calculation_version: string | null
          completeness_score: number
          consensus_score: number
          field_confidence_scores: Json | null
          field_last_updated: Json | null
          field_quality_scores: Json | null
          freshness_score: number
          id: string
          profile_id: string
          source_diversity_score: number | null
          temporal_consistency_score: number | null
        }
        Insert: {
          accuracy_score: number
          ai_improvement_score?: number | null
          ai_suggestions?: Json | null
          calculated_at?: string
          calculation_version?: string | null
          completeness_score: number
          consensus_score: number
          field_confidence_scores?: Json | null
          field_last_updated?: Json | null
          field_quality_scores?: Json | null
          freshness_score: number
          id?: string
          profile_id: string
          source_diversity_score?: number | null
          temporal_consistency_score?: number | null
        }
        Update: {
          accuracy_score?: number
          ai_improvement_score?: number | null
          ai_suggestions?: Json | null
          calculated_at?: string
          calculation_version?: string | null
          completeness_score?: number
          consensus_score?: number
          field_confidence_scores?: Json | null
          field_last_updated?: Json | null
          field_quality_scores?: Json | null
          freshness_score?: number
          id?: string
          profile_id?: string
          source_diversity_score?: number | null
          temporal_consistency_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_quality_metrics_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "master_company_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          current_organization_id: string | null
          department: string | null
          email: string | null
          email_encrypted: string | null
          full_name: string | null
          id: string
          job_title: string | null
          last_active_at: string | null
          onboarding_completed: boolean | null
          phone_encrypted: string | null
          phone_number: string | null
          preferences: Json | null
          role: string | null
          timezone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          current_organization_id?: string | null
          department?: string | null
          email?: string | null
          email_encrypted?: string | null
          full_name?: string | null
          id?: string
          job_title?: string | null
          last_active_at?: string | null
          onboarding_completed?: boolean | null
          phone_encrypted?: string | null
          phone_number?: string | null
          preferences?: Json | null
          role?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          current_organization_id?: string | null
          department?: string | null
          email?: string | null
          email_encrypted?: string | null
          full_name?: string | null
          id?: string
          job_title?: string | null
          last_active_at?: string | null
          onboarding_completed?: boolean | null
          phone_encrypted?: string | null
          phone_number?: string | null
          preferences?: Json | null
          role?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_current_organization_id_fkey"
            columns: ["current_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          last_activity_at: string | null
          metadata: Json | null
          name: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          last_activity_at?: string | null
          metadata?: Json | null
          name: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          last_activity_at?: string | null
          metadata?: Json | null
          name?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      prompt_flows: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          created_at: string | null
          flow_id: string
          id: string
          is_active_in_flow: boolean | null
          metadata: Json | null
          priority: number | null
          prompt_id: string
          updated_at: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string | null
          flow_id: string
          id?: string
          is_active_in_flow?: boolean | null
          metadata?: Json | null
          priority?: number | null
          prompt_id: string
          updated_at?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string | null
          flow_id?: string
          id?: string
          is_active_in_flow?: boolean | null
          metadata?: Json | null
          priority?: number | null
          prompt_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prompt_flows_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "flow_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompt_flows_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_versions: {
        Row: {
          content: string
          created_at: string
          created_by: string
          id: string
          is_rollback: boolean
          metadata: Json
          prompt_id: string
          version: number
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          id?: string
          is_rollback?: boolean
          metadata?: Json
          prompt_id: string
          version: number
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          is_rollback?: boolean
          metadata?: Json
          prompt_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "prompt_versions_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      prompts: {
        Row: {
          active_flow_assignments: number | null
          created_at: string
          current_version_id: string | null
          description: string | null
          domain: string
          flow_status: Json | null
          id: string
          is_active: boolean
          key: string
          provider: string
          total_flow_assignments: number | null
          updated_at: string
        }
        Insert: {
          active_flow_assignments?: number | null
          created_at?: string
          current_version_id?: string | null
          description?: string | null
          domain: string
          flow_status?: Json | null
          id?: string
          is_active?: boolean
          key: string
          provider: string
          total_flow_assignments?: number | null
          updated_at?: string
        }
        Update: {
          active_flow_assignments?: number | null
          created_at?: string
          current_version_id?: string | null
          description?: string | null
          domain?: string
          flow_status?: Json | null
          id?: string
          is_active?: boolean
          key?: string
          provider?: string
          total_flow_assignments?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      prototypes: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          figma_prototype_id: string | null
          hotspots: Json | null
          id: string
          interactions: Json | null
          name: string
          project_id: string
          prototype_url: string | null
          settings: Json | null
          starting_page_id: string
          updated_at: string | null
          wireframe_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          figma_prototype_id?: string | null
          hotspots?: Json | null
          id?: string
          interactions?: Json | null
          name: string
          project_id: string
          prototype_url?: string | null
          settings?: Json | null
          starting_page_id: string
          updated_at?: string | null
          wireframe_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          figma_prototype_id?: string | null
          hotspots?: Json | null
          id?: string
          interactions?: Json | null
          name?: string
          project_id?: string
          prototype_url?: string | null
          settings?: Json | null
          starting_page_id?: string
          updated_at?: string | null
          wireframe_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_prototypes_project_id"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prototypes_wireframe_id_fkey"
            columns: ["wireframe_id"]
            isOneToOne: false
            referencedRelation: "wireframes"
            referencedColumns: ["id"]
          },
        ]
      }
      push_notifications: {
        Row: {
          body: string
          created_at: string | null
          data: Json | null
          delivered_at: string | null
          device_registration_id: string | null
          error_message: string | null
          id: string
          scheduled_at: string | null
          sent_at: string | null
          status: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          body: string
          created_at?: string | null
          data?: Json | null
          delivered_at?: string | null
          device_registration_id?: string | null
          error_message?: string | null
          id?: string
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string | null
          data?: Json | null
          delivered_at?: string | null
          device_registration_id?: string | null
          error_message?: string | null
          id?: string
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "push_notifications_device_registration_id_fkey"
            columns: ["device_registration_id"]
            isOneToOne: false
            referencedRelation: "device_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_tracking: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          request_count: number | null
          user_id: string | null
          window_end: string | null
          window_start: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          request_count?: number | null
          user_id?: string | null
          window_end?: string | null
          window_start?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          request_count?: number | null
          user_id?: string | null
          window_end?: string | null
          window_start?: string | null
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          created_at: string | null
          current_usage: Json | null
          endpoint: string
          id: string
          is_active: boolean | null
          limit_per_day: number
          limit_per_hour: number
          limit_per_minute: number
          reset_day: string | null
          reset_hour: string | null
          reset_minute: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          current_usage?: Json | null
          endpoint: string
          id?: string
          is_active?: boolean | null
          limit_per_day: number
          limit_per_hour: number
          limit_per_minute: number
          reset_day?: string | null
          reset_hour?: string | null
          reset_minute?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          current_usage?: Json | null
          endpoint?: string
          id?: string
          is_active?: boolean | null
          limit_per_day?: number
          limit_per_hour?: number
          limit_per_minute?: number
          reset_day?: string | null
          reset_hour?: string | null
          reset_minute?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      realtime_subscriptions: {
        Row: {
          channel_name: string
          connection_id: string | null
          created_at: string | null
          disconnected_at: string | null
          id: string
          is_active: boolean | null
          last_activity_at: string | null
          metadata: Json | null
          subscription_type: string
          user_id: string | null
        }
        Insert: {
          channel_name: string
          connection_id?: string | null
          created_at?: string | null
          disconnected_at?: string | null
          id?: string
          is_active?: boolean | null
          last_activity_at?: string | null
          metadata?: Json | null
          subscription_type: string
          user_id?: string | null
        }
        Update: {
          channel_name?: string
          connection_id?: string | null
          created_at?: string | null
          disconnected_at?: string | null
          id?: string
          is_active?: boolean | null
          last_activity_at?: string | null
          metadata?: Json | null
          subscription_type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      report_schedules: {
        Row: {
          created_at: string | null
          frequency: string
          id: string
          is_active: boolean | null
          last_sent_at: string | null
          next_send_at: string | null
          recipients: string[]
          report_id: string
        }
        Insert: {
          created_at?: string | null
          frequency: string
          id?: string
          is_active?: boolean | null
          last_sent_at?: string | null
          next_send_at?: string | null
          recipients: string[]
          report_id: string
        }
        Update: {
          created_at?: string | null
          frequency?: string
          id?: string
          is_active?: boolean | null
          last_sent_at?: string | null
          next_send_at?: string | null
          recipients?: string[]
          report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_schedules_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "custom_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_searches: {
        Row: {
          created_at: string | null
          filters: Json | null
          id: string
          is_public: boolean | null
          name: string
          query: string
          sort_order: Json | null
          updated_at: string | null
          usage_count: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          filters?: Json | null
          id?: string
          is_public?: boolean | null
          name: string
          query: string
          sort_order?: Json | null
          updated_at?: string | null
          usage_count?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          filters?: Json | null
          id?: string
          is_public?: boolean | null
          name?: string
          query?: string
          sort_order?: Json | null
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      scale_metrics: {
        Row: {
          created_at: string | null
          id: string
          measurement_date: string | null
          metadata: Json | null
          metric_name: string
          metric_type: string
          metric_value: number
          project_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          measurement_date?: string | null
          metadata?: Json | null
          metric_name: string
          metric_type: string
          metric_value: number
          project_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          measurement_date?: string | null
          metadata?: Json | null
          metric_name?: string
          metric_type?: string
          metric_value?: number
          project_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      scheduled_exports: {
        Row: {
          created_at: string
          data_query: Json
          export_config: Json | null
          export_type: string
          id: string
          is_active: boolean | null
          last_run_at: string | null
          name: string
          next_run_at: string | null
          schedule_cron: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_query?: Json
          export_config?: Json | null
          export_type: string
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          name: string
          next_run_at?: string | null
          schedule_cron: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_query?: Json
          export_config?: Json | null
          export_type?: string
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          name?: string
          next_run_at?: string | null
          schedule_cron?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      search_indexes: {
        Row: {
          columns: string[]
          created_at: string | null
          id: string
          index_name: string
          is_active: boolean | null
          last_updated: string | null
          search_config: string | null
          table_name: string
        }
        Insert: {
          columns: string[]
          created_at?: string | null
          id?: string
          index_name: string
          is_active?: boolean | null
          last_updated?: string | null
          search_config?: string | null
          table_name: string
        }
        Update: {
          columns?: string[]
          created_at?: string | null
          id?: string
          index_name?: string
          is_active?: boolean | null
          last_updated?: string | null
          search_config?: string | null
          table_name?: string
        }
        Relationships: []
      }
      sensitive_data_access_log: {
        Row: {
          access_type: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          record_id: string
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          access_type: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          record_id: string
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          access_type?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          record_id?: string
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      sentiment_analysis: {
        Row: {
          analyst_sentiment: number | null
          article_count: number | null
          confidence_score: number | null
          created_at: string
          id: string
          news_sentiment: number | null
          overall_sentiment: number | null
          sentiment_sources: Json | null
          social_sentiment: number | null
          ticker_symbol: string
          time_period: string
        }
        Insert: {
          analyst_sentiment?: number | null
          article_count?: number | null
          confidence_score?: number | null
          created_at?: string
          id?: string
          news_sentiment?: number | null
          overall_sentiment?: number | null
          sentiment_sources?: Json | null
          social_sentiment?: number | null
          ticker_symbol: string
          time_period: string
        }
        Update: {
          analyst_sentiment?: number | null
          article_count?: number | null
          confidence_score?: number | null
          created_at?: string
          id?: string
          news_sentiment?: number | null
          overall_sentiment?: number | null
          sentiment_sources?: Json | null
          social_sentiment?: number | null
          ticker_symbol?: string
          time_period?: string
        }
        Relationships: []
      }
      shared_workspaces: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          settings: Json | null
          team_id: string
          updated_at: string
          workspace_type: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          settings?: Json | null
          team_id: string
          updated_at?: string
          workspace_type?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          settings?: Json | null
          team_id?: string
          updated_at?: string
          workspace_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shared_workspaces_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      source_authority_weights: {
        Row: {
          authority_weight: number
          created_at: string
          data_category: string
          id: string
          source_name: string
          updated_at: string
        }
        Insert: {
          authority_weight?: number
          created_at?: string
          data_category: string
          id?: string
          source_name: string
          updated_at?: string
        }
        Update: {
          authority_weight?: number
          created_at?: string
          data_category?: string
          id?: string
          source_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      sso_configurations: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          metadata: Json
          organization_id: string | null
          provider: string
          provider_config: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          metadata: Json
          organization_id?: string | null
          provider: string
          provider_config?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json
          organization_id?: string | null
          provider?: string
          provider_config?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      stock_analysis: {
        Row: {
          ai_insights: Json | null
          ai_summary: string | null
          analysis_type: string
          company_name: string | null
          confidence_score: number | null
          created_at: string
          data_sources: Json | null
          end_date: string | null
          financial_metrics: Json | null
          id: string
          opportunities: Json | null
          risk_factors: Json | null
          sentiment_score: number | null
          start_date: string | null
          status: string | null
          stock_data: Json
          ticker_symbol: string
          time_range: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_insights?: Json | null
          ai_summary?: string | null
          analysis_type?: string
          company_name?: string | null
          confidence_score?: number | null
          created_at?: string
          data_sources?: Json | null
          end_date?: string | null
          financial_metrics?: Json | null
          id?: string
          opportunities?: Json | null
          risk_factors?: Json | null
          sentiment_score?: number | null
          start_date?: string | null
          status?: string | null
          stock_data?: Json
          ticker_symbol: string
          time_range?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_insights?: Json | null
          ai_summary?: string | null
          analysis_type?: string
          company_name?: string | null
          confidence_score?: number | null
          created_at?: string
          data_sources?: Json | null
          end_date?: string | null
          financial_metrics?: Json | null
          id?: string
          opportunities?: Json | null
          risk_factors?: Json | null
          sentiment_score?: number | null
          start_date?: string | null
          status?: string | null
          stock_data?: Json
          ticker_symbol?: string
          time_range?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string
          description: string | null
          features: Json
          id: string
          is_active: boolean
          limits: Json
          name: string
          price_monthly: number | null
          price_yearly: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          limits?: Json
          name: string
          price_monthly?: number | null
          price_yearly?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          limits?: Json
          name?: string
          price_monthly?: number | null
          price_yearly?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string | null
          current_period_end: string
          current_period_start: string
          id: string
          plan_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_period_end: string
          current_period_start: string
          id?: string
          plan_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_period_end?: string
          current_period_start?: string
          id?: string
          plan_id?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      support_metrics: {
        Row: {
          agent_performance: Json | null
          avg_resolution_time: unknown | null
          created_at: string
          customer_satisfaction_score: number | null
          first_response_time: unknown | null
          id: string
          knowledge_base_helpfulness: number | null
          knowledge_base_views: number | null
          metric_date: string
          open_tickets: number | null
          resolved_tickets: number | null
          ticket_volume_by_category: Json | null
          total_tickets: number | null
        }
        Insert: {
          agent_performance?: Json | null
          avg_resolution_time?: unknown | null
          created_at?: string
          customer_satisfaction_score?: number | null
          first_response_time?: unknown | null
          id?: string
          knowledge_base_helpfulness?: number | null
          knowledge_base_views?: number | null
          metric_date: string
          open_tickets?: number | null
          resolved_tickets?: number | null
          ticket_volume_by_category?: Json | null
          total_tickets?: number | null
        }
        Update: {
          agent_performance?: Json | null
          avg_resolution_time?: unknown | null
          created_at?: string
          customer_satisfaction_score?: number | null
          first_response_time?: unknown | null
          id?: string
          knowledge_base_helpfulness?: number | null
          knowledge_base_views?: number | null
          metric_date?: string
          open_tickets?: number | null
          resolved_tickets?: number | null
          ticket_volume_by_category?: Json | null
          total_tickets?: number | null
        }
        Relationships: []
      }
      support_team_members: {
        Row: {
          created_at: string
          department: string
          id: string
          is_active: boolean | null
          languages: string[] | null
          max_concurrent_tickets: number | null
          performance_metrics: Json | null
          role: string
          skills: string[] | null
          timezone: string | null
          updated_at: string
          user_id: string
          working_hours: Json | null
        }
        Insert: {
          created_at?: string
          department: string
          id?: string
          is_active?: boolean | null
          languages?: string[] | null
          max_concurrent_tickets?: number | null
          performance_metrics?: Json | null
          role: string
          skills?: string[] | null
          timezone?: string | null
          updated_at?: string
          user_id: string
          working_hours?: Json | null
        }
        Update: {
          created_at?: string
          department?: string
          id?: string
          is_active?: boolean | null
          languages?: string[] | null
          max_concurrent_tickets?: number | null
          performance_metrics?: Json | null
          role?: string
          skills?: string[] | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
          working_hours?: Json | null
        }
        Relationships: []
      }
      support_ticket_messages: {
        Row: {
          attachments: Json | null
          created_at: string | null
          id: string
          is_internal: boolean | null
          message: string
          message_type: string | null
          metadata: Json | null
          ticket_id: string
          user_id: string
        }
        Insert: {
          attachments?: Json | null
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          message: string
          message_type?: string | null
          metadata?: Json | null
          ticket_id: string
          user_id: string
        }
        Update: {
          attachments?: Json | null
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          message?: string
          message_type?: string | null
          metadata?: Json | null
          ticket_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string | null
          created_at: string | null
          description: string
          id: string
          metadata: Json | null
          priority: string | null
          resolution: string | null
          resolved_at: string | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string | null
          description: string
          id?: string
          metadata?: Json | null
          priority?: string | null
          resolution?: string | null
          resolved_at?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string | null
          description?: string
          id?: string
          metadata?: Json | null
          priority?: string | null
          resolution?: string | null
          resolved_at?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      system_alerts: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          severity: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          severity?: string
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          severity?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      system_components: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          last_checked: string | null
          name: string
          response_time: number | null
          status: string | null
          updated_at: string | null
          uptime_percentage: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          last_checked?: string | null
          name: string
          response_time?: number | null
          status?: string | null
          updated_at?: string | null
          uptime_percentage?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          last_checked?: string | null
          name?: string
          response_time?: number | null
          status?: string | null
          updated_at?: string | null
          uptime_percentage?: number | null
        }
        Relationships: []
      }
      system_health_metrics: {
        Row: {
          component: string
          created_at: string | null
          id: string
          metadata: Json | null
          metric_name: string
          metric_unit: string | null
          metric_value: number
          recorded_at: string | null
          severity: string | null
        }
        Insert: {
          component: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          metric_name: string
          metric_unit?: string | null
          metric_value: number
          recorded_at?: string | null
          severity?: string | null
        }
        Update: {
          component?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          metric_name?: string
          metric_unit?: string | null
          metric_value?: number
          recorded_at?: string | null
          severity?: string | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          setting_key: string
          setting_value: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          setting_key: string
          setting_value: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          setting_key?: string
          setting_value?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      team_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          expires_at: string
          id: string
          invited_by: string
          permissions: Json | null
          role: string
          status: string | null
          team_id: string
          token: string
          updated_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          invited_by: string
          permissions?: Json | null
          role?: string
          status?: string | null
          team_id: string
          token: string
          updated_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          permissions?: Json | null
          role?: string
          status?: string | null
          team_id?: string
          token?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          id: string
          invited_at: string | null
          invited_by: string | null
          joined_at: string | null
          permissions: Json | null
          role: string
          status: string | null
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          permissions?: Json | null
          role?: string
          status?: string | null
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          permissions?: Json | null
          role?: string
          status?: string | null
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          owner_id: string
          settings: Json | null
          subscription_tier: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          owner_id: string
          settings?: Json | null
          subscription_tier?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          owner_id?: string
          settings?: Json | null
          subscription_tier?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tenant_configurations: {
        Row: {
          billing_plan: string | null
          created_at: string | null
          domain: string | null
          id: string
          is_active: boolean | null
          resource_limits: Json | null
          settings: Json | null
          tenant_id: string
          tenant_name: string
          updated_at: string | null
        }
        Insert: {
          billing_plan?: string | null
          created_at?: string | null
          domain?: string | null
          id?: string
          is_active?: boolean | null
          resource_limits?: Json | null
          settings?: Json | null
          tenant_id: string
          tenant_name: string
          updated_at?: string | null
        }
        Update: {
          billing_plan?: string | null
          created_at?: string | null
          domain?: string | null
          id?: string
          is_active?: boolean | null
          resource_limits?: Json | null
          settings?: Json | null
          tenant_id?: string
          tenant_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tenant_users: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          joined_at: string | null
          permissions: Json | null
          role: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          permissions?: Json | null
          role?: string
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          permissions?: Json | null
          role?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_configurations"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      test_results: {
        Row: {
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          id: string
          metadata: Json | null
          project_id: string | null
          status: string
          test_name: string
          test_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          project_id?: string | null
          status: string
          test_name: string
          test_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          project_id?: string | null
          status?: string
          test_name?: string
          test_type?: string
          user_id?: string
        }
        Relationships: []
      }
      tickets: {
        Row: {
          assigned_to: string | null
          card_type: string | null
          confidence_score: number | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          is_ai_suggested: boolean | null
          labels: string[] | null
          list_id: string | null
          position: number | null
          priority: string | null
          project_id: string
          status: string | null
          time_spent: number | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          card_type?: string | null
          confidence_score?: number | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_ai_suggested?: boolean | null
          labels?: string[] | null
          list_id?: string | null
          position?: number | null
          priority?: string | null
          project_id: string
          status?: string | null
          time_spent?: number | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          card_type?: string | null
          confidence_score?: number | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_ai_suggested?: boolean | null
          labels?: string[] | null
          list_id?: string | null
          position?: number | null
          priority?: string | null
          project_id?: string
          status?: string | null
          time_spent?: number | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_logs: {
        Row: {
          completed_at: string | null
          current_step: number | null
          error_message: string | null
          id: string
          operation_type: string
          rollback_data: Json | null
          started_at: string | null
          status: string | null
          steps_completed: Json | null
          total_steps: number
          transaction_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          current_step?: number | null
          error_message?: string | null
          id?: string
          operation_type: string
          rollback_data?: Json | null
          started_at?: string | null
          status?: string | null
          steps_completed?: Json | null
          total_steps: number
          transaction_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          current_step?: number | null
          error_message?: string | null
          id?: string
          operation_type?: string
          rollback_data?: Json | null
          started_at?: string | null
          status?: string | null
          steps_completed?: Json | null
          total_steps?: number
          transaction_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      translations: {
        Row: {
          created_at: string | null
          id: string
          key: string
          locale: string
          namespace: string | null
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          locale: string
          namespace?: string | null
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          locale?: string
          namespace?: string | null
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      trend_analysis: {
        Row: {
          ai_analysis: string | null
          analysis_scope: string
          created_at: string
          id: string
          indicators: Json | null
          key_metrics: Json | null
          predictions: Json | null
          price_data: Json | null
          scope_identifier: string
          time_range: string
          trend_direction: string | null
          trend_strength: number | null
          updated_at: string
          user_id: string
          volume_data: Json | null
        }
        Insert: {
          ai_analysis?: string | null
          analysis_scope: string
          created_at?: string
          id?: string
          indicators?: Json | null
          key_metrics?: Json | null
          predictions?: Json | null
          price_data?: Json | null
          scope_identifier: string
          time_range?: string
          trend_direction?: string | null
          trend_strength?: number | null
          updated_at?: string
          user_id: string
          volume_data?: Json | null
        }
        Update: {
          ai_analysis?: string | null
          analysis_scope?: string
          created_at?: string
          id?: string
          indicators?: Json | null
          key_metrics?: Json | null
          predictions?: Json | null
          price_data?: Json | null
          scope_identifier?: string
          time_range?: string
          trend_direction?: string | null
          trend_strength?: number | null
          updated_at?: string
          user_id?: string
          volume_data?: Json | null
        }
        Relationships: []
      }
      trusted_data_sources: {
        Row: {
          api_endpoint: string | null
          api_key_required: boolean | null
          cost_per_request: number | null
          created_at: string
          data_freshness_hours: number | null
          id: string
          is_active: boolean | null
          last_validation: string | null
          metadata: Json | null
          rate_limit_per_hour: number | null
          reliability_score: number
          source_name: string
          source_type: string
          supported_regions: string[] | null
          updated_at: string
          validation_frequency_hours: number | null
        }
        Insert: {
          api_endpoint?: string | null
          api_key_required?: boolean | null
          cost_per_request?: number | null
          created_at?: string
          data_freshness_hours?: number | null
          id?: string
          is_active?: boolean | null
          last_validation?: string | null
          metadata?: Json | null
          rate_limit_per_hour?: number | null
          reliability_score: number
          source_name: string
          source_type: string
          supported_regions?: string[] | null
          updated_at?: string
          validation_frequency_hours?: number | null
        }
        Update: {
          api_endpoint?: string | null
          api_key_required?: boolean | null
          cost_per_request?: number | null
          created_at?: string
          data_freshness_hours?: number | null
          id?: string
          is_active?: boolean | null
          last_validation?: string | null
          metadata?: Json | null
          rate_limit_per_hour?: number | null
          reliability_score?: number
          source_name?: string
          source_type?: string
          supported_regions?: string[] | null
          updated_at?: string
          validation_frequency_hours?: number | null
        }
        Relationships: []
      }
      usage_quotas: {
        Row: {
          billing_period_end: string
          billing_period_start: string
          created_at: string | null
          current_usage: number | null
          id: string
          overage_allowed: boolean | null
          overage_rate: number | null
          quota_limit: number
          service_type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          billing_period_end: string
          billing_period_start: string
          created_at?: string | null
          current_usage?: number | null
          id?: string
          overage_allowed?: boolean | null
          overage_rate?: number | null
          quota_limit: number
          service_type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          billing_period_end?: string
          billing_period_start?: string
          created_at?: string | null
          current_usage?: number | null
          id?: string
          overage_allowed?: boolean | null
          overage_rate?: number | null
          quota_limit?: number
          service_type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      usage_tracking: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          period_end: string
          period_start: string
          resource_type: string
          subscription_id: string | null
          updated_at: string
          usage_count: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          period_end: string
          period_start: string
          resource_type: string
          subscription_id?: string | null
          updated_at?: string
          usage_count?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          period_end?: string
          period_start?: string
          resource_type?: string
          subscription_id?: string | null
          updated_at?: string
          usage_count?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_tracking_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_chatbot_configs: {
        Row: {
          assigned_model: string | null
          assigned_provider: string | null
          created_at: string | null
          fallback_providers: string[] | null
          id: string
          is_active: boolean | null
          max_tokens: number | null
          system_prompt: string | null
          temperature: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_model?: string | null
          assigned_provider?: string | null
          created_at?: string | null
          fallback_providers?: string[] | null
          id?: string
          is_active?: boolean | null
          max_tokens?: number | null
          system_prompt?: string | null
          temperature?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_model?: string | null
          assigned_provider?: string | null
          created_at?: string | null
          fallback_providers?: string[] | null
          id?: string
          is_active?: boolean | null
          max_tokens?: number | null
          system_prompt?: string | null
          temperature?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_consents: {
        Row: {
          consent_date: string | null
          consent_given: boolean
          consent_type: string
          document_id: string
          id: string
          ip_address: unknown | null
          metadata: Json | null
          user_agent: string | null
          user_id: string
          withdrawal_date: string | null
        }
        Insert: {
          consent_date?: string | null
          consent_given: boolean
          consent_type: string
          document_id: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          user_agent?: string | null
          user_id: string
          withdrawal_date?: string | null
        }
        Update: {
          consent_date?: string | null
          consent_given?: boolean
          consent_type?: string
          document_id?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string
          withdrawal_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_consents_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "legal_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      user_cost_limits: {
        Row: {
          alert_threshold: number
          created_at: string
          is_active: boolean
          monthly_cost_limit: number
          updated_at: string
          user_id: string
        }
        Insert: {
          alert_threshold?: number
          created_at?: string
          is_active?: boolean
          monthly_cost_limit?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          alert_threshold?: number
          created_at?: string
          is_active?: boolean
          monthly_cost_limit?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_feature_gates: {
        Row: {
          created_at: string
          enabled: boolean
          flag_key: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          flag_key: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          flag_key?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_model_configs: {
        Row: {
          config: Json | null
          created_at: string | null
          id: string
          is_default: boolean | null
          model_name: string
          provider: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          model_name: string
          provider: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          model_name?: string
          provider?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          created_at: string | null
          expires_at: string | null
          granted_at: string | null
          granted_by: string | null
          id: string
          metadata: Json | null
          permission_name: string
          resource_id: string | null
          resource_type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          metadata?: Json | null
          permission_name: string
          resource_id?: string | null
          resource_type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          metadata?: Json | null
          permission_name?: string
          resource_id?: string | null
          resource_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string | null
          id: string
          notification_settings: Json | null
          privacy_settings: Json | null
          ui_preferences: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          notification_settings?: Json | null
          privacy_settings?: Json | null
          ui_preferences?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          notification_settings?: Json | null
          privacy_settings?: Json | null
          ui_preferences?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_provider_costs: {
        Row: {
          cost_per_1k_tokens: number
          created_at: string
          id: string
          monthly_cost_limit: number | null
          monthly_token_allotment: number | null
          provider: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cost_per_1k_tokens?: number
          created_at?: string
          id?: string
          monthly_cost_limit?: number | null
          monthly_token_allotment?: number | null
          provider: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cost_per_1k_tokens?: number
          created_at?: string
          id?: string
          monthly_cost_limit?: number | null
          monthly_token_allotment?: number | null
          provider?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          role?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_segments: {
        Row: {
          created_at: string | null
          created_by: string | null
          criteria: Json
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
          user_count: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          criteria: Json
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
          user_count?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          criteria?: Json
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
          user_count?: number | null
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          cancelled_at: string | null
          created_at: string
          current_period_end: string
          current_period_start: string
          id: string
          plan_id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          current_period_end: string
          current_period_start: string
          id?: string
          plan_id: string
          status: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          plan_id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          created_at: string | null
          events: Json | null
          failure_count: number | null
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          name: string
          secret: string | null
          updated_at: string | null
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          events?: Json | null
          failure_count?: number | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          name: string
          secret?: string | null
          updated_at?: string | null
          url: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          events?: Json | null
          failure_count?: number | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          name?: string
          secret?: string | null
          updated_at?: string | null
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      website_analytics: {
        Row: {
          bounce_rate: number | null
          conversion_rate: number | null
          created_at: string | null
          date: string
          device_types: Json | null
          geographic_data: Json | null
          id: string
          pageviews: number | null
          session_duration: number | null
          top_pages: Json | null
          traffic_sources: Json | null
          unique_visitors: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bounce_rate?: number | null
          conversion_rate?: number | null
          created_at?: string | null
          date: string
          device_types?: Json | null
          geographic_data?: Json | null
          id?: string
          pageviews?: number | null
          session_duration?: number | null
          top_pages?: Json | null
          traffic_sources?: Json | null
          unique_visitors?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bounce_rate?: number | null
          conversion_rate?: number | null
          created_at?: string | null
          date?: string
          device_types?: Json | null
          geographic_data?: Json | null
          id?: string
          pageviews?: number | null
          session_duration?: number | null
          top_pages?: Json | null
          traffic_sources?: Json | null
          unique_visitors?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      wireframe_collaborators: {
        Row: {
          accepted_at: string | null
          id: string
          invited_at: string | null
          invited_by: string
          permission: string | null
          user_id: string
          wireframe_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by: string
          permission?: string | null
          user_id: string
          wireframe_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string
          permission?: string | null
          user_id?: string
          wireframe_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wireframe_collaborators_wireframe_id_fkey"
            columns: ["wireframe_id"]
            isOneToOne: false
            referencedRelation: "wireframes"
            referencedColumns: ["id"]
          },
        ]
      }
      wireframe_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          id: string
          page_id: string
          parent_comment_id: string | null
          resolved: boolean | null
          updated_at: string | null
          wireframe_id: string | null
          x: number
          y: number
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          id?: string
          page_id: string
          parent_comment_id?: string | null
          resolved?: boolean | null
          updated_at?: string | null
          wireframe_id?: string | null
          x: number
          y: number
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          id?: string
          page_id?: string
          parent_comment_id?: string | null
          resolved?: boolean | null
          updated_at?: string | null
          wireframe_id?: string | null
          x?: number
          y?: number
        }
        Relationships: [
          {
            foreignKeyName: "wireframe_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "wireframe_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wireframe_comments_wireframe_id_fkey"
            columns: ["wireframe_id"]
            isOneToOne: false
            referencedRelation: "wireframes"
            referencedColumns: ["id"]
          },
        ]
      }
      wireframe_versions: {
        Row: {
          changes_summary: string | null
          created_at: string | null
          created_by: string
          id: string
          pages_snapshot: Json
          version_number: number
          wireframe_id: string | null
        }
        Insert: {
          changes_summary?: string | null
          created_at?: string | null
          created_by: string
          id?: string
          pages_snapshot: Json
          version_number: number
          wireframe_id?: string | null
        }
        Update: {
          changes_summary?: string | null
          created_at?: string | null
          created_by?: string
          id?: string
          pages_snapshot?: Json
          version_number?: number
          wireframe_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wireframe_versions_wireframe_id_fkey"
            columns: ["wireframe_id"]
            isOneToOne: false
            referencedRelation: "wireframes"
            referencedColumns: ["id"]
          },
        ]
      }
      wireframes: {
        Row: {
          canvas_data: Json | null
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          is_template: boolean | null
          name: string
          pages: Json
          project_id: string | null
          status: string | null
          tags: string[] | null
          thumbnail_url: string | null
          type: string | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          canvas_data?: Json | null
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          is_template?: boolean | null
          name: string
          pages?: Json
          project_id?: string | null
          status?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          type?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          canvas_data?: Json | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          is_template?: boolean | null
          name?: string
          pages?: Json
          project_id?: string | null
          status?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          type?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "wireframes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_executions: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          execution_log: Json | null
          id: string
          started_at: string | null
          status: string | null
          trigger_data: Json | null
          workflow_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          execution_log?: Json | null
          id?: string
          started_at?: string | null
          status?: string | null
          trigger_data?: Json | null
          workflow_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          execution_log?: Json | null
          id?: string
          started_at?: string | null
          status?: string | null
          trigger_data?: Json | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_executions_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "automation_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_competitor_analysis_full: {
        Row: {
          aggregated_result: Json | null
          analysis_data: Json | null
          analysis_id: string | null
          created_at: string | null
          field_scores: Json | null
          filled_from_master: Json | null
          name: string | null
          overall_confidence: number | null
          provenance_map: Json | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      anonymize_user_data: {
        Args: { target_user_id: string }
        Returns: Json
      }
      assign_prompt_to_flow: {
        Args: {
          flow_id_param: string
          is_active_param?: boolean
          priority_param?: number
          prompt_id_param: string
        }
        Returns: boolean
      }
      audit_rls_policies: {
        Args: Record<PropertyKey, never>
        Returns: {
          has_delete_policy: boolean
          has_insert_policy: boolean
          has_select_policy: boolean
          has_update_policy: boolean
          policy_count: number
          table_name: string
        }[]
      }
      automated_data_retention: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      can_access_api_key: {
        Args: { key_user_id: string; requesting_user_id: string }
        Returns: boolean
      }
      check_api_key_status: {
        Args: { provider_param: string }
        Returns: {
          error_message: string
          is_active: boolean
          last_validated: string
          provider: string
          status: string
        }[]
      }
      check_organization_permission: {
        Args: {
          org_id_param: string
          required_role: string
          user_id_param: string
        }
        Returns: boolean
      }
      check_public_extensions: {
        Args: Record<PropertyKey, never>
        Returns: {
          extension_name: string
          schema_name: string
        }[]
      }
      check_rate_limit: {
        Args: {
          action_type: string
          limit_per_hour?: number
          user_id_param: string
        }
        Returns: boolean
      }
      check_user_cost_allowed: {
        Args: { projected_cost_param?: number; user_id_param?: string }
        Returns: Json
      }
      cleanup_old_audit_logs: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_sessions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      complete_transaction: {
        Args: { success?: boolean; transaction_id_param: string }
        Returns: boolean
      }
      debug_auth_context: {
        Args: Record<PropertyKey, never>
        Returns: {
          current_role_name: string
          current_user_id: string
          is_authenticated: boolean
        }[]
      }
      decrypt_sensitive_data_secure: {
        Args: { ciphertext: string; key_context?: string }
        Returns: string
      }
      detect_security_anomalies: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      dmetaphone: {
        Args: { "": string }
        Returns: string
      }
      dmetaphone_alt: {
        Args: { "": string }
        Returns: string
      }
      emergency_revoke_all_user_keys: {
        Args: { target_user_id: string }
        Returns: number
      }
      exec_sql: {
        Args: { sql: string }
        Returns: {
          result: Json
        }[]
      }
      find_master_profile_match: {
        Args: { company_name_param: string; website_url_param?: string }
        Returns: string
      }
      get_api_key_from_vault: {
        Args: { provider_param: string; user_id_param: string }
        Returns: {
          api_key: string
          id: string
          masked_key: string
          status: string
        }[]
      }
      get_competitor_analysis_progress: {
        Args: { session_id_param: string; user_id_param?: string }
        Returns: {
          completed_competitors: number
          created_at: string
          current_competitor: string
          error_message: string
          id: string
          metadata: Json
          progress_percentage: number
          session_id: string
          status: string
          total_competitors: number
          updated_at: string
          user_id: string
        }[]
      }
      get_effective_feature_flag: {
        Args: { flag_key_param: string; user_id_param?: string }
        Returns: {
          enabled: boolean
          source: string
        }[]
      }
      get_flow_health_metrics: {
        Args: Record<PropertyKey, never>
        Returns: {
          active_prompts: number
          flow_category: string
          flow_id: string
          flow_name: string
          health_score: number
          inactive_prompts: number
          last_activity: string
          total_prompts: number
        }[]
      }
      get_last_flow_test_runs: {
        Args: { limit_param?: number; run_type_param?: string }
        Returns: {
          competitor: string | null
          created_at: string
          function_error: Json | null
          id: string
          prompt: string | null
          providers: Json
          report: Json | null
          run_type: string
          steps: Json
          success: boolean
          user_id: string
        }[]
      }
      get_prompt_flow_status: {
        Args: { prompt_id_param: string }
        Returns: {
          active_assignments: number
          flows: Json
          status: string
          total_assignments: number
        }[]
      }
      get_prompts_with_flow_status: {
        Args: Record<PropertyKey, never>
        Returns: {
          active_flow_assignments: number
          created_at: string
          description: string
          domain: string
          flow_status: Json
          id: string
          is_active: boolean
          key: string
          provider: string
          total_flow_assignments: number
          updated_at: string
        }[]
      }
      get_schema_overview: {
        Args: { schema_name?: string }
        Returns: Json
      }
      get_security_status: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_system_health: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_system_health_overview: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_system_health_safe: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_tables: {
        Args: { schema_name: string }
        Returns: Json
      }
      get_user_api_key_for_validation: {
        Args: { provider_param: string }
        Returns: {
          api_key: string
          id: string
          status: string
        }[]
      }
      get_user_api_keys_safe: {
        Args: { user_id_param?: string }
        Returns: {
          error_message: string
          id: string
          is_active: boolean
          last_validated: string
          masked_key: string
          provider: string
          status: string
          updated_at: string
        }[]
      }
      get_user_competitor_analyses: {
        Args: { user_id_param?: string }
        Returns: {
          actual_cost: number
          analysis_data: Json
          analysis_id: string
          brand_strength_score: number
          business_model: string
          company_profile_id: string
          completed_at: string
          confidence_scores: Json
          created_at: string
          data_completeness_score: number
          data_quality_score: number
          description: string
          employee_count: number
          employee_count_verified: boolean
          founded_year: number
          funding_info: Json
          headquarters: string
          id: string
          industry: string
          innovation_score: number
          last_news_update: string
          market_position: string
          market_sentiment_score: number
          name: string
          normalized_scores: Json
          operational_efficiency_score: number
          opportunities: string[]
          organization_id: string
          patent_count: number
          pricing_strategy: Json
          session_id: string
          social_media_presence: Json
          status: string
          strengths: string[]
          target_market: string[]
          threats: string[]
          updated_at: string
          user_id: string
          weaknesses: string[]
          website_url: string
          website_verified: boolean
        }[]
      }
      get_user_monthly_spend: {
        Args: { user_id_param: string }
        Returns: number
      }
      get_user_organizations: {
        Args: { user_id_param: string }
        Returns: {
          id: string
          is_active: boolean
          name: string
          role: string
        }[]
      }
      get_user_provider_costs: {
        Args: { user_id_param?: string }
        Returns: {
          cost_per_1k_tokens: number
          monthly_cost_limit: number
          monthly_token_allotment: number
          provider: string
          updated_at: string
          user_id: string
        }[]
      }
      get_user_role: {
        Args: { user_id_param: string }
        Returns: string
      }
      handle_system_operation: {
        Args: { operation_type: string; user_id_param?: string }
        Returns: boolean
      }
      increment_admin_key_usage: {
        Args: { key_id: string; tokens_to_add: number }
        Returns: undefined
      }
      increment_helpful_count: {
        Args: { article_id_param: string }
        Returns: undefined
      }
      increment_not_helpful_count: {
        Args: { article_id_param: string }
        Returns: undefined
      }
      insert_analysis_run: {
        Args: {
          input_data_param?: Json
          run_type_param: string
          session_id_param: string
          user_id_param: string
        }
        Returns: string
      }
      insert_competitor_analysis_progress: {
        Args: {
          metadata_param?: Json
          session_id_param: string
          total_competitors_param: number
          user_id_param: string
        }
        Returns: string
      }
      insert_flow_test_run: {
        Args: {
          competitor_param?: string
          function_error_param?: Json
          prompt_param?: string
          providers_param?: Json
          report_param?: Json
          run_type_param?: string
          steps_param?: Json
          success_param?: boolean
        }
        Returns: string
      }
      insert_master_profile_contribution: {
        Args: {
          company_name_param: string
          confidence_score_param?: number
          field_name_param: string
          field_value_param: Json
        }
        Returns: string
      }
      is_admin_user: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      is_authorized_admin: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      is_member_of_team: {
        Args: { team_id_param: string; user_id_param: string }
        Returns: boolean
      }
      is_super_admin: {
        Args: { email_to_check: string }
        Returns: boolean
      }
      is_user_admin: {
        Args: { check_user_id: string }
        Returns: boolean
      }
      link_analysis_to_company: {
        Args: {
          analysis_id_param: string
          company_profile_id_param: string
          user_id_param: string
        }
        Returns: boolean
      }
      list_functions: {
        Args: { schema_name?: string }
        Returns: Json
      }
      log_admin_operation: {
        Args: {
          details?: Json
          operation_type: string
          resource_id: string
          resource_type: string
        }
        Returns: undefined
      }
      log_ai_prompt: {
        Args: {
          analysis_id_param?: string
          error_param?: string
          metadata_param?: Json
          model_param: string
          prompt_length_param: number
          prompt_param: string
          provider_param: string
          session_id_param?: string
          status_param?: string
          temperature_param?: number
        }
        Returns: string
      }
      log_api_key_access_comprehensive: {
        Args: {
          key_id_param?: string
          metadata_param?: Json
          operation_type: string
          provider_name: string
          success_param?: boolean
        }
        Returns: undefined
      }
      log_api_key_operation: {
        Args: {
          error_message?: string
          operation_type: string
          provider_param: string
          success?: boolean
          user_id_param: string
        }
        Returns: undefined
      }
      log_application_error: {
        Args:
          | {
              error_context?: Json
              error_message: string
              error_type: string
              user_id_param?: string
            }
          | { error_message: string; error_type: string; metadata_param?: Json }
        Returns: undefined
      }
      log_performance_metric: {
        Args: {
          component_param?: string
          execution_time_ms_param: number
          metadata_param?: Json
          operation_name_param: string
          status_param?: string
          user_id_param?: string
        }
        Returns: undefined
      }
      log_security_event: {
        Args:
          | { details?: Json; event_type: string; severity?: string }
          | {
              event_type: string
              metadata_param?: Json
              resource_id?: string
              resource_type: string
              user_id_param: string
            }
        Returns: undefined
      }
      log_security_event_enhanced: {
        Args: {
          event_type: string
          ip_address_param?: unknown
          metadata_param?: Json
          resource_id?: string
          resource_type: string
          user_agent_param?: string
          user_id_param: string
        }
        Returns: undefined
      }
      log_sensitive_access: {
        Args: {
          access_type_param: string
          record_id_param: string
          table_name_param: string
        }
        Returns: undefined
      }
      manage_api_key: {
        Args: {
          api_key_id_param?: string
          api_key_param?: string
          key_hash_param?: string
          key_prefix_param?: string
          masked_key_param?: string
          operation: string
          provider_param?: string
          user_id_param?: string
        }
        Returns: Json
      }
      manage_api_key_vault: {
        Args:
          | {
              api_key_param: string
              key_name_param: string
              operation: string
              provider_param: string
              user_id_param: string
            }
          | {
              encrypted_key_param?: string
              operation: string
              provider_param: string
              user_id_param: string
              vault_secret_id_param?: string
            }
        Returns: Json
      }
      match_code_embeddings: {
        Args: {
          match_count?: number
          query_embedding: string
          similarity_threshold?: number
          user_id_param?: string
        }
        Returns: {
          content: string
          file_path: string
          id: string
          language: string
          similarity: number
        }[]
      }
      migrate_to_vault: {
        Args: Record<PropertyKey, never>
        Returns: {
          failed_count: number
          migrated_count: number
        }[]
      }
      monitor_database_performance: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      reset_user_password: {
        Args: { user_email: string }
        Returns: Json
      }
      rollback_transaction: {
        Args: { error_message_param?: string; transaction_id_param: string }
        Returns: Json
      }
      run_security_audit: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      run_security_scan: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      safe_uuid_cast: {
        Args: { input_text: string }
        Returns: string
      }
      sanitize_api_key_for_prompt: {
        Args: { api_key_text: string }
        Returns: string
      }
      secure_api_key_access: {
        Args: { operation_type: string; target_user_id: string }
        Returns: boolean
      }
      set_feature_flag: {
        Args: {
          enabled_param: boolean
          flag_key_param: string
          scope_id_param: string
          scope_type_param: string
        }
        Returns: boolean
      }
      set_user_cost_limit: {
        Args: {
          alert_threshold_param?: number
          monthly_limit_param: number
          user_id_param: string
        }
        Returns: boolean
      }
      set_user_provider_cost: {
        Args: {
          cost_per_1k_tokens_param: number
          monthly_token_allotment_param?: number
          provider_param: string
          user_id_param: string
        }
        Returns: boolean
      }
      set_user_provider_monthly_limit: {
        Args: {
          monthly_cost_limit_param: number
          provider_param: string
          user_id_param: string
        }
        Returns: boolean
      }
      soundex: {
        Args: { "": string }
        Returns: string
      }
      start_transaction_log: {
        Args: {
          metadata_param?: Json
          operation_type_param: string
          total_steps_param: number
          user_id_param: string
        }
        Returns: string
      }
      test_auth_and_permissions: {
        Args: Record<PropertyKey, never>
        Returns: {
          api_key_count: number
          auth_role: string
          auth_user_id: string
          can_read_api_keys: boolean
        }[]
      }
      test_policy_access: {
        Args: { test_user_id: string }
        Returns: {
          can_access_api_keys: boolean
          can_access_competitor_analyses: boolean
          user_exists: boolean
        }[]
      }
      test_rls_security: {
        Args: Record<PropertyKey, never>
        Returns: {
          details: string
          passed: boolean
          test_name: string
        }[]
      }
      text_soundex: {
        Args: { "": string }
        Returns: string
      }
      track_api_performance: {
        Args: {
          endpoint_name: string
          error_details?: string
          execution_time_ms: number
          metadata?: Json
          success?: boolean
        }
        Returns: undefined
      }
      track_api_performance_comprehensive: {
        Args: {
          endpoint_name: string
          error_details?: string
          execution_time_ms: number
          metadata?: Json
          success?: boolean
        }
        Returns: undefined
      }
      track_realtime_subscription: {
        Args: {
          action_param: string
          channel_name_param: string
          metadata_param?: Json
          subscription_type_param: string
          user_id_param: string
        }
        Returns: undefined
      }
      update_api_key_status: {
        Args: {
          error_message_param?: string
          provider_param: string
          status_param: string
        }
        Returns: boolean
      }
      update_api_key_validation: {
        Args: {
          is_valid_param: boolean
          key_id_param: string
          validated_at_param: string
        }
        Returns: boolean
      }
      update_competitor_analysis_progress: {
        Args: {
          completed_competitors_param?: number
          current_competitor_param?: string
          error_message_param?: string
          metadata_param?: Json
          progress_percentage_param?: number
          session_id_param: string
          status_param?: string
        }
        Returns: boolean
      }
      update_transaction_step: {
        Args: {
          rollback_data_param?: Json
          step_data?: Json
          step_number: number
          transaction_id_param: string
        }
        Returns: boolean
      }
      upsert_company_profile: {
        Args: {
          name_param: string
          profile_data_param: Json
          user_id_param: string
          website_url_param: string
        }
        Returns: string
      }
      validate_api_key_integrity: {
        Args: { user_id_param?: string }
        Returns: Json
      }
      validate_edge_function_security: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      validate_user_api_key: {
        Args:
          | { provider_param: string; test_call?: boolean }
          | { provider_param: string; user_id_param: string }
        Returns: Json
      }
      vault_delete_secret: {
        Args: { secret_name: string }
        Returns: boolean
      }
      vault_retrieve_api_key: {
        Args:
          | { p_provider: string; p_user_id: string }
          | { p_user_id: string; p_vault_secret_id: string }
        Returns: string
      }
      vault_store_api_key: {
        Args: {
          p_api_key: string
          p_key_name: string
          p_provider: string
          p_user_id: string
        }
        Returns: string
      }
      vault_store_secret: {
        Args: { secret_name: string; secret_value: string }
        Returns: string
      }
      verify_backup_integrity: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
    }
    Enums: {
      provenance_source: "api" | "master_profile" | "user_input" | "inferred"
      provider_status: "pending" | "running" | "completed" | "failed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      provenance_source: ["api", "master_profile", "user_input", "inferred"],
      provider_status: ["pending", "running", "completed", "failed"],
    },
  },
} as const
