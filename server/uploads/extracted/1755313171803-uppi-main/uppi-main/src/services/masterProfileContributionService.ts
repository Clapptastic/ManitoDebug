/**
 * Master Profile Contribution Service
 * Manages contributions to master profiles from competitive analysis
 */

import { supabase } from '@/integrations/supabase/client';
import { featureFlagService, FEATURE_FLAGS } from './featureFlagService';

export interface MasterProfileContribution {
  id: string;
  master_profile_id: string;
  contributor_user_id: string;
  source_analysis_id?: string;
  contribution_type: 'data_addition' | 'data_update' | 'data_correction' | 'verification';
  field_name: string;
  old_value?: string;
  new_value: string;
  confidence_score: number;
  is_verified: boolean;
  verified_by?: string;
  verified_at?: string;
  contribution_metadata: Record<string, any>;
  created_at: string;
}

class MasterProfileContributionService {
  
  async contributeFromAnalysis(
    analysisId: string,
    analysisData: any,
    userId: string
  ): Promise<boolean> {
    try {
      // Check if auto-contribution is enabled
      const autoContributionEnabled = await featureFlagService.isFeatureEnabled(
        FEATURE_FLAGS.MASTER_PROFILES_AUTO_CONTRIBUTION
      );

      if (!autoContributionEnabled) {
        console.log('Auto-contribution to master profiles is disabled');
        return false;
      }

      // Find or create master profile for the company
      const companyName = analysisData.name;
      if (!companyName) {
        console.warn('No company name found in analysis data');
        return false;
      }

      let masterProfile = await this.findMasterProfile(companyName);
      
      if (!masterProfile) {
        masterProfile = await this.createMasterProfile(companyName, analysisData, userId);
      }

      if (!masterProfile) {
        console.error('Failed to create or find master profile');
        return false;
      }

      // Create contributions for significant data points
      const contributions = this.extractContributions(
        masterProfile.id,
        analysisData,
        userId,
        analysisId
      );

      if (contributions.length === 0) {
        console.log('No significant contributions found');
        return true;
      }

      // Insert contributions
      const validContributions = contributions.filter(c => 
        c.contribution_type && c.field_name && c.master_profile_id && c.contributor_user_id
      );

      if (validContributions.length === 0) {
        console.log('No valid contributions found');
        return true;
      }

      // Use the new database table instead of console.log
      const { data: insertedContributions, error: insertError } = await supabase
        .rpc('insert_master_profile_contribution', {
          company_name_param: companyName,
          field_name_param: 'bulk_contributions',
          field_value_param: validContributions,
          confidence_score_param: 0.8
        });

      if (insertError) {
        console.error('Error inserting contributions:', insertError);
        throw insertError;
      }

      console.log('Successfully inserted contributions:', insertedContributions);

      // Update master profile data if contributions are high confidence
      await this.updateMasterProfileFromContributions(masterProfile.id, contributions);

      return true;
    } catch (error) {
      console.error('Error in contributeFromAnalysis:', error);
      return false;
    }
  }

  private async findMasterProfile(companyName: string) {
    try {
      const normalizedName = this.normalizeCompanyName(companyName);
      
      const { data, error } = await supabase
        .from('master_company_profiles')
        .select('*')
        .eq('normalized_name', normalizedName)
        .maybeSingle();

      if (error) {
        console.error('Error finding master profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in findMasterProfile:', error);
      return null;
    }
  }

  private async createMasterProfile(companyName: string, analysisData: any, userId: string) {
    try {
      const normalizedName = this.normalizeCompanyName(companyName);
      
      const profileData = {
        company_name: companyName,
        normalized_name: normalizedName,
        description: analysisData.description,
        industry: analysisData.industry,
        headquarters: analysisData.headquarters,
        founded_year: analysisData.founded_year,
        employee_count: analysisData.employee_count,
        revenue_estimate: analysisData.revenue_estimate,
        business_model: analysisData.business_model,
        website_url: analysisData.website_url,
        source_analyses: [analysisData.id],
        data_completeness_score: this.calculateCompletenessScore(analysisData),
        overall_confidence_score: 75 // Initial confidence for new profiles
      };

      const { data, error } = await supabase
        .from('master_company_profiles')
        .insert(profileData)
        .select()
        .single();

      if (error) {
        console.error('Error creating master profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in createMasterProfile:', error);
      return null;
    }
  }

  private extractContributions(
    masterProfileId: string,
    analysisData: any,
    userId: string,
    analysisId: string
  ): Partial<MasterProfileContribution>[] {
    const contributions: Partial<MasterProfileContribution>[] = [];

    // Define fields to track for contributions
    const fieldMappings = [
      { field: 'description', confidence: this.calculateFieldConfidence(analysisData.description) },
      { field: 'industry', confidence: this.calculateFieldConfidence(analysisData.industry) },
      { field: 'headquarters', confidence: this.calculateFieldConfidence(analysisData.headquarters) },
      { field: 'founded_year', confidence: this.calculateFieldConfidence(analysisData.founded_year) },
      { field: 'employee_count', confidence: this.calculateFieldConfidence(analysisData.employee_count) },
      { field: 'revenue_estimate', confidence: this.calculateFieldConfidence(analysisData.revenue_estimate) },
      { field: 'business_model', confidence: this.calculateFieldConfidence(analysisData.business_model) },
      { field: 'website_url', confidence: this.calculateFieldConfidence(analysisData.website_url) }
    ];

    fieldMappings.forEach(({ field, confidence }) => {
      const value = analysisData[field];
      
      if (value && confidence > 50) { // Only contribute high-confidence data
        contributions.push({
          master_profile_id: masterProfileId,
          contributor_user_id: userId,
          source_analysis_id: analysisId,
          contribution_type: 'data_addition',
          field_name: field,
          new_value: String(value),
          confidence_score: confidence,
          is_verified: false,
          contribution_metadata: {
            source: 'competitive_analysis',
            analysis_id: analysisId,
            extraction_method: 'automated'
          }
        });
      }
    });

    return contributions;
  }

  private async updateMasterProfileFromContributions(
    masterProfileId: string,
    contributions: Partial<MasterProfileContribution>[]
  ) {
    // Only update with high-confidence contributions
    const highConfidenceContributions = contributions.filter(c => 
      c.confidence_score && c.confidence_score > 80
    );

    if (highConfidenceContributions.length === 0) return;

    const updateData: Record<string, any> = {};
    
    highConfidenceContributions.forEach(contribution => {
      if (contribution.field_name && contribution.new_value) {
        updateData[contribution.field_name] = contribution.new_value;
      }
    });

    if (Object.keys(updateData).length === 0) return;

    try {
      const { error } = await supabase
        .from('master_company_profiles')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', masterProfileId);

      if (error) {
        console.error('Error updating master profile:', error);
      }
    } catch (error) {
      console.error('Error in updateMasterProfileFromContributions:', error);
    }
  }

  private normalizeCompanyName(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .replace(/\s+(inc|llc|ltd|corporation|corp|limited|co)$/, '');
  }

  private calculateCompletenessScore(data: any): number {
    const fields = [
      'company_name', 'description', 'industry', 'headquarters',
      'founded_year', 'employee_count', 'revenue_estimate', 'business_model'
    ];
    
    const filledFields = fields.filter(field => data[field]).length;
    return Math.round((filledFields / fields.length) * 100);
  }

  private calculateFieldConfidence(value: any): number {
    if (!value) return 0;
    
    if (typeof value === 'string') {
      if (value.length > 100) return 85;
      if (value.length > 50) return 75;
      if (value.length > 20) return 65;
      return 50;
    }
    
    if (typeof value === 'number') {
      return value > 0 ? 80 : 30;
    }
    
    return 60;
  }

  async getContributionsByUser(userId: string): Promise<MasterProfileContribution[]> {
    const { data, error } = await supabase
      .from('master_profile_contributions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching contributions for user:', userId, error);
      return [];
    }

    // Transform database records to match MasterProfileContribution interface
    return (data || []).map(record => ({
      id: record.id,
      master_profile_id: record.company_name, // Using company_name as fallback
      contributor_user_id: record.user_id,
      source_analysis_id: undefined,
      contribution_type: 'data_addition' as const,
      field_name: record.field_name,
      old_value: undefined,
      new_value: JSON.stringify(record.field_value),
      confidence_score: record.confidence_score || 0,
      is_verified: record.verified,
      verified_by: record.verified_by || undefined,
      verified_at: record.verified_at || undefined,
      contribution_metadata: {},
      created_at: record.created_at
    }));
  }

  async verifyContribution(contributionId: string, verifierId: string): Promise<boolean> {
    const { error } = await supabase
      .from('master_profile_contributions')
      .update({
        verified: true,
        verified_by: verifierId,
        verified_at: new Date().toISOString()
      })
      .eq('id', contributionId);

    if (error) {
      console.error('Error verifying contribution:', contributionId, error);
      return false;
    }

    console.log('Successfully verified contribution:', contributionId, 'by user:', verifierId);
    return true;
  }
}

export const masterProfileContributionService = new MasterProfileContributionService();