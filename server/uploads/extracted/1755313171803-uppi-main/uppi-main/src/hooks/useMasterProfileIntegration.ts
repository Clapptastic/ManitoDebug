import { useState, useEffect, useCallback } from 'react';
import { MasterProfileIntegrationService, ProfileMatchResult, UserAnalysisEnrichment } from '@/services/api/masterProfileIntegrationService';
import { MasterCompanyProfile } from '@/services/masterCompanyProfileService';

export interface MasterProfileIntegrationState {
  masterProfile: MasterCompanyProfile | null;
  matchResult: ProfileMatchResult | null;
  enrichmentData: UserAnalysisEnrichment | null;
  insights: any | null;
  dataQuality: any | null;
  isLoading: boolean;
  isEnriching: boolean;
  isContributing: boolean;
  error: string | null;
}

/**
 * Hook for managing master profile integration with user analyses
 * Provides real-time updates and AI-enhanced capabilities
 */
export const useMasterProfileIntegration = (
  analysisId?: string,
  companyName?: string,
  website?: string,
  industry?: string
) => {
  const [state, setState] = useState<MasterProfileIntegrationState>({
    masterProfile: null,
    matchResult: null,
    enrichmentData: null,
    insights: null,
    dataQuality: null,
    isLoading: false,
    isEnriching: false,
    isContributing: false,
    error: null
  });

  /**
   * Find matching master profile for the analysis
   */
  const findMasterProfileMatch = useCallback(async () => {
    if (!companyName) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const matchResult = await MasterProfileIntegrationService.findMasterProfileMatch(
        companyName,
        website,
        industry
      );

      setState(prev => ({
        ...prev,
        matchResult,
        masterProfile: matchResult?.existingProfile || null,
        isLoading: false
      }));

      return matchResult;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to find master profile match',
        isLoading: false
      }));
      return null;
    }
  }, [companyName, website, industry]);

  /**
   * Enrich current analysis with master profile data
   */
  const enrichAnalysis = useCallback(async (masterProfileId: string) => {
    if (!analysisId) return null;

    setState(prev => ({ ...prev, isEnriching: true, error: null }));

    try {
      const enrichmentData = await MasterProfileIntegrationService.enrichUserAnalysis(
        analysisId,
        masterProfileId
      );

      setState(prev => ({
        ...prev,
        enrichmentData,
        isEnriching: false
      }));

      return enrichmentData;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to enrich analysis',
        isEnriching: false
      }));
      return null;
    }
  }, [analysisId]);

  /**
   * Contribute analysis data back to master profile
   */
  const contributeToMasterProfile = useCallback(async (
    masterProfileId: string,
    contributionType: 'full' | 'selective' | 'validation_only' = 'selective'
  ) => {
    if (!analysisId) return { success: false, contributionsApplied: 0 };

    setState(prev => ({ ...prev, isContributing: true, error: null }));

    try {
      const result = await MasterProfileIntegrationService.contributeToMasterProfile(
        analysisId,
        masterProfileId,
        contributionType
      );

      setState(prev => ({ ...prev, isContributing: false }));
      return result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to contribute to master profile',
        isContributing: false
      }));
      return { success: false, contributionsApplied: 0 };
    }
  }, [analysisId]);

  /**
   * Get AI-generated insights from master profile
   */
  const getMasterProfileInsights = useCallback(async (
    masterProfileId: string,
    analysisContext?: any
  ) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const insights = await MasterProfileIntegrationService.getMasterProfileInsights(
        masterProfileId,
        analysisContext
      );

      setState(prev => ({
        ...prev,
        insights,
        isLoading: false
      }));

      return insights;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to get insights',
        isLoading: false
      }));
      return null;
    }
  }, []);

  /**
   * Enhance master profile with AI
   */
  const enhanceWithAI = useCallback(async (
    masterProfileId: string,
    enhancementTypes?: string[]
  ) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const success = await MasterProfileIntegrationService.enhanceProfileWithAI(
        masterProfileId,
        enhancementTypes
      );

      setState(prev => ({ ...prev, isLoading: false }));
      return success;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to enhance profile',
        isLoading: false
      }));
      return false;
    }
  }, []);

  /**
   * Assess data quality of master profile
   */
  const assessDataQuality = useCallback(async (masterProfileId: string) => {
    try {
      const dataQuality = await MasterProfileIntegrationService.assessDataQuality(masterProfileId);
      setState(prev => ({ ...prev, dataQuality }));
      return dataQuality;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to assess data quality'
      }));
      return null;
    }
  }, []);

  /**
   * Subscribe to real-time updates for master profile
   */
  const subscribeToUpdates = useCallback((masterProfileId: string) => {
    return MasterProfileIntegrationService.subscribeToProfileUpdates(
      masterProfileId,
      (update) => {
        setState(prev => ({
          ...prev,
          masterProfile: update.new || prev.masterProfile
        }));
      }
    );
  }, []);

  // Auto-find master profile match when component mounts
  useEffect(() => {
    if (companyName && !state.matchResult && !state.isLoading) {
      findMasterProfileMatch();
    }
  }, [companyName, findMasterProfileMatch, state.matchResult, state.isLoading]);

  return {
    ...state,
    // Actions
    findMasterProfileMatch,
    enrichAnalysis,
    contributeToMasterProfile,
    getMasterProfileInsights,
    enhanceWithAI,
    assessDataQuality,
    subscribeToUpdates,
    // Computed properties
    hasMatch: !!state.matchResult,
    isHighConfidenceMatch: (state.matchResult?.matchConfidence || 0) > 0.8,
    canEnrich: !!state.matchResult && !!analysisId,
    canContribute: !!state.matchResult && !!analysisId
  };
};

export default useMasterProfileIntegration;