import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { MasterCompanyProfile } from '@/services/masterCompanyProfileService';
import { featureFlagService, FEATURE_FLAGS } from '../featureFlagService';
import { masterProfileContributionService } from '../masterProfileContributionService';

export interface ProfileMatchResult {
  masterProfileId: string;
  matchConfidence: number;
  matchCriteria: string[];
  existingProfile: MasterCompanyProfile;
}

export interface UserAnalysisEnrichment {
  masterProfileData: Partial<MasterCompanyProfile>;
  confidenceScore: number;
  dataFreshness: string;
  enrichmentSources: string[];
  suggestedUpdates?: string[];
}

/**
 * Service for integrating master profiles with user competitor analyses
 * Implements bidirectional data flow and AI-augmented intelligence
 */
export class MasterProfileIntegrationService {
  
  /**
   * Find matching master profile for a company during user analysis
   */
  static async findMasterProfileMatch(
    companyName: string,
    website?: string,
    industry?: string
  ): Promise<ProfileMatchResult | null> {
    try {
      // Check if master profiles feature is enabled
      const isEnabled = await featureFlagService.isFeatureEnabled(FEATURE_FLAGS.MASTER_PROFILES_ENABLED);
      if (!isEnabled) {
        console.log('Master profiles feature is disabled');
        return null;
      }
      const { data, error } = await supabase.functions.invoke('find-master-profile-match', {
        body: {
          companyName,
          website,
          industry,
          matchingAlgorithm: 'ai_enhanced' // Use AI for better matching
        }
      });

      if (error) throw error;
      return data.match || null;
    } catch (error) {
      console.error('Error finding master profile match:', error);
      return null;
    }
  }

  /**
   * Enrich user analysis with master profile data
   */
  static async enrichUserAnalysis(
    analysisId: string,
    masterProfileId: string
  ): Promise<UserAnalysisEnrichment | null> {
    try {
      const { data, error } = await supabase.functions.invoke('enrich-analysis-with-master-profile', {
        body: {
          analysisId,
          masterProfileId,
          enrichmentLevel: 'comprehensive' // full, selective, comprehensive
        }
      });

      if (error) throw error;
      return data.enrichment || null;
    } catch (error) {
      console.error('Error enriching user analysis:', error);
      return null;
    }
  }

  /**
   * Contribute user analysis data back to master profile
   */
  static async contributeToMasterProfile(
    analysisId: string,
    masterProfileId: string,
    contributionType: 'full' | 'selective' | 'validation_only' = 'selective'
  ): Promise<{ success: boolean; contributionsApplied: number }> {
    try {
      const { data, error } = await supabase.functions.invoke('contribute-to-master-profile', {
        body: {
          analysisId,
          masterProfileId,
          contributionType,
          aiValidation: true, // Use AI to validate contributions
          conflictResolution: 'ai_mediated' // How to handle conflicts
        }
      });

      if (error) throw error;
      
      if (data.success) {
        toast({
          title: "Data Contributed",
          description: `Applied ${data.contributionsApplied} updates to master profile`,
        });
      }

      return data;
    } catch (error) {
      console.error('Error contributing to master profile:', error);
      return { success: false, contributionsApplied: 0 };
    }
  }

  /**
   * Get real-time master profile insights for user analysis
   */
  static async getMasterProfileInsights(
    masterProfileId: string,
    analysisContext?: {
      focusAreas?: string[];
      competitorSet?: string[];
      analysisType?: string;
    }
  ): Promise<{
    insights: any[];
    recommendations: string[];
    dataGaps: string[];
    confidenceScores: Record<string, number>;
  } | null> {
    try {
      const { data, error } = await supabase.functions.invoke('generate-master-profile-insights', {
        body: {
          masterProfileId,
          analysisContext,
          insightTypes: ['competitive_positioning', 'market_trends', 'risk_factors', 'opportunities'],
          aiGeneration: true
        }
      });

      if (error) throw error;
      return data.insights || null;
    } catch (error) {
      console.error('Error getting master profile insights:', error);
      return null;
    }
  }

  /**
   * Trigger AI-powered profile enhancement
   */
  static async enhanceProfileWithAI(
    masterProfileId: string,
    enhancementTypes: string[] = ['data_validation', 'gap_filling', 'trend_analysis']
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('ai-enhance-master-profile', {
        body: {
          masterProfileId,
          enhancementTypes,
          aiProviders: ['openai', 'anthropic'], // Use multiple AI providers for validation
          realTimeData: true,
          webScraping: true
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "AI Enhancement Complete",
          description: `Enhanced profile with ${data.enhancementsApplied} improvements`,
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error enhancing profile with AI:', error);
      return false;
    }
  }

  /**
   * Subscribe to real-time master profile updates
   */
  static subscribeToProfileUpdates(
    masterProfileId: string,
    callback: (update: any) => void
  ): () => void {
    const channel = supabase
      .channel(`master-profile-${masterProfileId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'master_company_profiles',
          filter: `id=eq.${masterProfileId}`
        },
        callback
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  /**
   * Get profile data quality assessment
   */
  static async assessDataQuality(masterProfileId: string): Promise<{
    overallScore: number;
    categoryScores: Record<string, number>;
    recommendations: string[];
    missingFields: string[];
    confidenceDistribution: Record<string, number>;
  } | null> {
    try {
      const { data, error } = await supabase.functions.invoke('assess-profile-data-quality', {
        body: {
          masterProfileId,
          assessmentCriteria: 'comprehensive',
          benchmarkAgainstIndustry: true
        }
      });

      if (error) throw error;
      return data.assessment || null;
    } catch (error) {
      console.error('Error assessing data quality:', error);
      return null;
    }
  }

  /**
   * Batch process multiple analyses against master profiles
   */
  static async batchProcessAnalyses(
    analysisIds: string[],
    processingOptions: {
      autoMatch: boolean;
      autoEnrich: boolean;
      autoContribute: boolean;
      aiValidation: boolean;
    }
  ): Promise<{
    processed: number;
    matched: number;
    enriched: number;
    contributed: number;
    errors: string[];
  }> {
    try {
      const { data, error } = await supabase.functions.invoke('batch-process-master-profile-integration', {
        body: {
          analysisIds,
          processingOptions
        }
      });

      if (error) throw error;
      return data.results;
    } catch (error) {
      console.error('Error batch processing analyses:', error);
      return {
        processed: 0,
        matched: 0,
        enriched: 0,
        contributed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }
}