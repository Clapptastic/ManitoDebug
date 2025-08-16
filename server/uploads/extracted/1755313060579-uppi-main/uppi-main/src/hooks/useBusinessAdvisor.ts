import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BusinessAdvice {
  recommendations: string[];
  prioritizedActions: Array<{
    action: string;
    priority: 'high' | 'medium' | 'low';
    effort: 'low' | 'medium' | 'high';
    impact: 'low' | 'medium' | 'high';
  }>;
  marketInsights: string[];
  riskAssessment: string[];
}

export interface BusinessContext {
  industry: string;
  stage: 'idea' | 'validation' | 'mvp' | 'growth' | 'scale';
  targetMarket: string;
  businessModel: string;
  currentChallenges: string[];
}

export const useBusinessAdvisor = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [advice, setAdvice] = useState<BusinessAdvice | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getBusinessAdvice = useCallback(async (context: BusinessContext): Promise<BusinessAdvice> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data } = await supabase.functions.invoke('business-advisor', {
        body: { context }
      });

      const businessAdvice: BusinessAdvice = {
        recommendations: data?.recommendations || [],
        prioritizedActions: data?.actions || [],
        marketInsights: data?.insights || [],
        riskAssessment: data?.risks || []
      };

      setAdvice(businessAdvice);
      return businessAdvice;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get business advice';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const analyzeCompetitors = useCallback(async (industry: string, targetMarket: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data } = await supabase.functions.invoke('competitor-analyzer', {
        body: { industry, targetMarket }
      });

      return {
        competitors: data?.competitors || [],
        marketGaps: data?.gaps || [],
        opportunities: data?.opportunities || []
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze competitors';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const validateBusinessModel = useCallback(async (businessModel: string, targetMarket: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data } = await supabase.functions.invoke('business-model-validator', {
        body: { businessModel, targetMarket }
      });

      return {
        viabilityScore: data?.score || 0,
        strengths: data?.strengths || [],
        weaknesses: data?.weaknesses || [],
        recommendations: data?.recommendations || []
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to validate business model';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    advice,
    error,
    getBusinessAdvice,
    analyzeCompetitors,
    validateBusinessModel
  };
};