import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface MasterCompanyProfile {
  id: string;
  company_name: string;
  normalized_name?: string;
  website_url?: string;
  industry?: string;
  headquarters?: string;
  founded_year?: number;
  employee_count?: number;
  revenue_estimate?: number;
  business_model?: string;
  description?: string;
  overall_confidence_score: number;
  data_completeness_score: number;
  data_quality_score: number;
  validation_status: string;
  last_validation_date?: string;
  source_analyses: any;
  technology_stack: any;
  key_executives: any;
  financial_metrics: any;
  funding_rounds: any;
  competitive_advantages: string[];
  target_markets: string[];
  key_products: string[];
  partnerships: string[];
  certifications: string[];
  social_media_profiles: any;
  data_sources: any;
  market_cap?: number;
  verification_status: string;
  last_updated: string;
  created_at: string;
  updated_at: string;
}

export interface ValidationLog {
  id: string;
  master_profile_id: string;
  data_field: string;
  original_value?: string;
  validated_value?: string;
  validation_source: string;
  validation_method: string;
  is_valid?: boolean;
  confidence_score?: number;
  discrepancy_reason?: string;
  correction_applied: boolean;
  validated_at: string;
  validation_duration_ms?: number;
  external_source_response?: any;
}

export interface ProfileMerge {
  id: string;
  master_profile_id: string;
  source_analysis_id?: string;
  merge_type: string;
  fields_updated: string[];
  confidence_changes: any;
  merge_algorithm: string;
  data_quality_before?: number;
  data_quality_after?: number;
  conflicts_resolved: number;
  performed_at: string;
  performed_by?: string;
  merge_notes?: string;
  rollback_data?: any;
}

export interface ConfidenceHistory {
  id: string;
  master_profile_id: string;
  data_field: string;
  confidence_score: number;
  contributing_sources: any;
  score_calculation_method?: string;
  recorded_at: string;
  triggered_by?: string;
}

export interface TrustedDataSource {
  id: string;
  source_name: string;
  source_type: string;
  authority_weight: number;
  api_endpoint?: string;
  api_key_required: boolean;
  rate_limit_per_hour?: number;
  data_categories: string[];
  is_active: boolean;
  last_successful_call?: string;
  error_rate: number;
  avg_response_time_ms?: number;
  request_config: any;
  response_mapping: any;
  created_at: string;
  updated_at: string;
}

export class MasterCompanyProfileService {
  /**
   * Get all master company profiles with optional filtering
   */
  static async getProfiles(filters?: {
    industry?: string;
    validationStatus?: string;
    confidenceThreshold?: number;
    search?: string;
  }): Promise<MasterCompanyProfile[]> {
    try {
      let query = supabase
        .from('master_company_profiles')
        .select('*')
        .order('updated_at', { ascending: false });

      if (filters?.industry) {
        query = query.eq('industry', filters.industry);
      }

      if (filters?.validationStatus) {
        query = query.eq('validation_status', filters.validationStatus);
      }

      if (filters?.confidenceThreshold) {
        query = query.gte('overall_confidence_score', filters.confidenceThreshold);
      }

      if (filters?.search) {
        query = query.or(`company_name.ilike.%${filters.search}%,website_url.ilike.%${filters.search}%,industry.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching master profiles:', error);
      toast({
        title: "Error",
        description: "Failed to fetch company profiles",
        variant: "destructive"
      });
      return [];
    }
  }

  /**
   * Get a single master company profile by ID
   */
  static async getProfileById(id: string): Promise<MasterCompanyProfile | null> {
    try {
      const { data, error } = await supabase
        .from('master_company_profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to fetch company profile",
        variant: "destructive"
      });
      return null;
    }
  }

  /**
   * Trigger consolidation for a competitor analysis
   */
  static async consolidateAnalysis(analysisId: string): Promise<{ success: boolean; masterProfileId?: string }> {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('Authentication required');
      }

      const { data, error } = await supabase.functions.invoke('consolidate-company-data', {
        body: {
          analysisId,
          userId: session.session.user.id
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Consolidation Complete",
          description: data.isNewProfile 
            ? "Created new master company profile" 
            : "Updated existing master company profile"
        });
      }

      return {
        success: data.success,
        masterProfileId: data.masterProfileId
      };
    } catch (error) {
      console.error('Error consolidating analysis:', error);
      toast({
        title: "Consolidation Error",
        description: error instanceof Error ? error.message : "Failed to consolidate analysis",
        variant: "destructive"
      });
      return { success: false };
    }
  }

  /**
   * Trigger enhanced validation for a master profile
   */
  static async validateProfile(
    profileId: string, 
    categories: string[] = ['basic_info', 'financial', 'personnel']
  ): Promise<boolean> {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('Authentication required');
      }

      const { data, error } = await supabase.functions.invoke('enhanced-ai-validation', {
        body: {
          masterProfileId: profileId,
          validationCategories: categories,
          userId: session.session.user.id
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Validation Complete",
          description: `Completed ${data.totalValidations} validations with ${data.averageConfidence.toFixed(1)}% average confidence`
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error validating profile:', error);
      toast({
        title: "Validation Error",
        description: error instanceof Error ? error.message : "Failed to validate profile",
        variant: "destructive"
      });
      return false;
    }
  }

  /**
   * Get validation logs for a profile
   */
  static async getValidationLogs(profileId: string): Promise<ValidationLog[]> {
    try {
      const { data, error } = await supabase
        .from('data_validation_logs')
        .select('id, master_profile_id, data_field, original_value, validated_value, validation_source, validation_method, is_valid, confidence_score, discrepancy_reason, external_source_response, validated_at')
        .eq('master_profile_id', profileId)
        .order('validated_at', { ascending: false });

      if (error) throw error;
      // Map to interface; correction_applied and validation_duration_ms not tracked currently
      return (data || []).map((d: any) => ({
        id: d.id,
        master_profile_id: d.master_profile_id,
        data_field: d.data_field,
        original_value: d.original_value ?? undefined,
        validated_value: d.validated_value ?? undefined,
        validation_source: d.validation_source,
        validation_method: d.validation_method,
        is_valid: d.is_valid ?? undefined,
        confidence_score: d.confidence_score ?? undefined,
        discrepancy_reason: d.discrepancy_reason ?? undefined,
        correction_applied: false,
        validated_at: d.validated_at,
        external_source_response: d.external_source_response ?? undefined,
      }));
    } catch (error) {
      console.error('Error fetching validation logs:', error);
      return [];
    }
  }

  /**
   * Get merge history for a profile
   */
  static async getMergeHistory(profileId: string): Promise<ProfileMerge[]> {
    try {
      const { data, error } = await supabase
        .from('master_profile_merges')
        .select('id, master_profile_id, source_analysis_id, merge_type, fields_updated, confidence_changes, merge_algorithm, data_quality_before, data_quality_after, conflicts_resolved, performed_at, performed_by, merge_notes, rollback_data')
        .eq('master_profile_id', profileId)
        .order('performed_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as ProfileMerge[];
    } catch (error) {
      console.error('Error fetching merge history:', error);
      return [];
    }
  }

  /**
   * Get confidence history for a profile
   */
  static async getConfidenceHistory(profileId: string): Promise<ConfidenceHistory[]> {
    try {
      const { data, error } = await supabase
        .from('confidence_history')
        .select('id, master_profile_id, data_field, confidence_score, contributing_sources, score_calculation_method, recorded_at, triggered_by')
        .eq('master_profile_id', profileId)
        .order('recorded_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as ConfidenceHistory[];
    } catch (error) {
      console.error('Error fetching confidence history:', error);
      return [];
    }
  }

  /**
   * Get trusted data sources
   */
  static async getTrustedDataSources(): Promise<TrustedDataSource[]> {
    try {
      const { data, error } = await supabase
        .from('trusted_data_sources')
        .select('*')
        .eq('is_active', true)
        .order('reliability_score', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as TrustedDataSource[];
    } catch (error) {
      console.error('Error fetching data sources:', error);
      return [];
    }
  }

  /**
   * Update master profile manually
   */
  static async updateProfile(profileId: string, updates: Partial<MasterCompanyProfile>): Promise<boolean> {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('Authentication required');
      }

      const { error } = await supabase
        .from('master_company_profiles')
        .update({
          ...updates,
        })
        .eq('id', profileId);

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Master company profile has been updated successfully"
      });

      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update Error",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive"
      });
      return false;
    }
  }

  /**
   * Search for similar companies (duplicate detection)
   */
  static async findSimilarCompanies(companyName: string, domain?: string): Promise<MasterCompanyProfile[]> {
    try {
      // Normalize the company name for searching
      const normalizedName = companyName.toLowerCase()
        .replace(/\s+(inc\.?|llc|ltd\.?|corporation|corp\.?|limited|co\.?)$/i, '')
        .replace(/\s+/g, ' ')
        .replace(/[^\w\s]/g, '')
        .trim();

      let query = supabase
        .from('master_company_profiles')
        .select('*')
        .or(`normalized_name.ilike.%${normalizedName}%,company_name.ilike.%${companyName}%`);

      if (domain) {
        query = query.or(`website_url.eq.${domain}`);
      }

      const { data, error } = await query.limit(10);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error finding similar companies:', error);
      return [];
    }
  }

  /**
   * Export profiles to CSV
   */
  static async exportProfiles(profiles: MasterCompanyProfile[]): Promise<void> {
    try {
      const csvHeaders = [
        'Company Name',
        'Industry',
        'Headquarters',
        'Founded Year',
        'Employee Count',
        'Revenue Estimate',
        'Website',
        'Confidence Score',
        'Validation Status',
        'Last Updated',
        'Source Count'
      ];

      const csvRows = profiles.map(profile => [
        profile.company_name,
        profile.industry || '',
        profile.headquarters || '',
        profile.founded_year || '',
        profile.employee_count || '',
        profile.revenue_estimate || '',
        profile.website_url || '',
        profile.overall_confidence_score || 0,
        profile.validation_status,
        new Date(profile.updated_at).toLocaleDateString(),
        profile.source_analyses?.length || 0
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `master-company-profiles-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();

      toast({
        title: "Export Complete",
        description: `Exported ${profiles.length} company profiles`
      });
    } catch (error) {
      console.error('Error exporting profiles:', error);
      toast({
        title: "Export Error",
        description: "Failed to export company profiles",
        variant: "destructive"
      });
    }
  }

  /**
   * Get data quality metrics
   */
  static async getDataQualityMetrics(): Promise<{
    totalProfiles: number;
    averageConfidence: number;
    validatedProfiles: number;
    pendingValidation: number;
    highQualityProfiles: number;
    recentUpdates: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('master_company_profiles')
        .select('overall_confidence_score, validation_status, updated_at');

      if (error) throw error;

      const totalProfiles = data?.length || 0;
      const averageConfidence = data?.reduce((sum, p) => sum + (p.overall_confidence_score || 0), 0) / totalProfiles || 0;
      const validatedProfiles = data?.filter(p => p.validation_status === 'validated').length || 0;
      const pendingValidation = data?.filter(p => p.validation_status === 'pending').length || 0;
      const highQualityProfiles = data?.filter(p => (p.overall_confidence_score || 0) >= 80).length || 0;
      
      // Profiles updated in the last 7 days
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentUpdates = data?.filter(p => new Date(p.updated_at) > weekAgo).length || 0;

      return {
        totalProfiles,
        averageConfidence,
        validatedProfiles,
        pendingValidation,
        highQualityProfiles,
        recentUpdates
      };
    } catch (error) {
      console.error('Error fetching metrics:', error);
      return {
        totalProfiles: 0,
        averageConfidence: 0,
        validatedProfiles: 0,
        pendingValidation: 0,
        highQualityProfiles: 0,
        recentUpdates: 0
      };
    }
  }
}

export default MasterCompanyProfileService;