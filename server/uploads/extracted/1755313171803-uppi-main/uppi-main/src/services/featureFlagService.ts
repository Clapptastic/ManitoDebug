import { supabase } from '@/integrations/supabase/client';

export interface FeatureFlag {
  id: string;
  flag_name: string;
  is_enabled: boolean;
  description?: string;
  metadata?: any;
  user_id?: string;
  project_id?: string;
  target_audience?: string;
  created_at: string;
  updated_at: string;
}

export const FEATURE_FLAGS = {
  AI_COMPETITIVE_ANALYSIS: 'ai_competitive_analysis',
  AFFILIATE_LINK_TRACKING: 'affiliate_link_tracking',
  DOCUMENT_MANAGEMENT: 'document_management',
  ADVANCED_ANALYTICS: 'advanced_analytics',
  API_RATE_LIMITING: 'api_rate_limiting',
  BULK_ANALYSIS: 'bulk_analysis',
  REAL_TIME_MONITORING: 'real_time_monitoring',
  EXPORT_FUNCTIONALITY: 'export_functionality',
  COLLABORATION_TOOLS: 'collaboration_tools',
  CUSTOM_BRANDING: 'custom_branding',
  // Route-level feature flags (default OFF via RPC unless explicitly enabled)
  MARKET_RESEARCH_MARKET_SIZE: 'market_research_market_size',
  MARKET_RESEARCH_CUSTOMER_SURVEYS: 'market_research_customer_surveys',
  BUSINESS_PLAN: 'business_plan',
  TEAMS: 'teams',
  // Align with DB RPC default-on key 'master_profiles'
  MASTER_PROFILES_ENABLED: 'master_profiles',
  MASTER_PROFILES_ADMIN_DASHBOARD: 'master_profiles',
  MASTER_PROFILES_AUTO_CONTRIBUTION: 'master_profiles_auto_contribution'
} as const;

class FeatureFlagService {
  async getAllFeatureFlags(): Promise<FeatureFlag[]> {
    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .order('flag_name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching feature flags:', error);
      return [];
    }
  }

  async getFeatureFlag(flagName: string): Promise<FeatureFlag | null> {
    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .eq('flag_name', flagName)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching feature flag:', error);
      return null;
    }
  }

  async isFeatureEnabled(flagName: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('get_effective_feature_flag', {
        flag_key_param: flagName,
        user_id_param: undefined
      });
      if (error) throw error;
      const result = Array.isArray(data) ? data[0] : null;
      return !!result?.enabled;
    } catch (error) {
      console.error('Error checking feature flag via RPC:', error);
      // Fallback to direct read (best-effort)
      try {
        const flag = await this.getFeatureFlag(flagName);
        return flag?.is_enabled || false;
      } catch {}
      return false;
    }
  }

  async updateFeatureFlag(
    flagName: string,
    updates: Partial<FeatureFlag>,
    options?: { scopeType?: 'global' | 'organization' | 'user'; scopeId?: string | null }
  ): Promise<FeatureFlag> {
    try {
      // Prefer secure RPC which handles scope and auditing
      const enabled = updates.is_enabled ?? false;
      const scopeType = options?.scopeType ?? 'global';
      const scopeId = options?.scopeId ?? null;
      const { error: rpcError } = await supabase.rpc('set_feature_flag', {
        flag_key_param: flagName,
        scope_type_param: scopeType,
        scope_id_param: scopeId,
        enabled_param: enabled
      });
      if (rpcError) throw rpcError;

      // Return the latest row for compatibility
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .eq('flag_name', flagName)
        .order('updated_at', { ascending: false })
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        // Synthesize a minimal object if no row exists yet for this scope
        return {
          id: 'unknown',
          flag_name: flagName,
          is_enabled: enabled,
          description: updates.description,
          metadata: updates.metadata,
          user_id: options?.scopeType === 'user' ? scopeId ?? undefined : undefined,
          project_id: options?.scopeType === 'organization' ? scopeId ?? undefined : undefined,
          target_audience: updates.target_audience,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as FeatureFlag;
      }
      return data;
    } catch (error) {
      console.error('Error updating feature flag via RPC:', error);
      throw error;
    }
  }

  clearCache(): void {
    // Simple cache clear implementation
    console.log('Feature flag cache cleared');
  }
}

export const featureFlagService = new FeatureFlagService();