import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ValidationRequest {
  content: string;
  contentType: 'competitor_analysis' | 'market_research' | 'pricing_data' | 'general';
  sources?: string[];
  context?: any;
}

interface ValidationResult {
  confidence_score: number;
  validation_flags: string[];
  risk_level: 'low' | 'medium' | 'high';
  accuracy_indicators: {
    source_reliability: number;
    data_consistency: number;
    logical_coherence: number;
    factual_verification: number;
  };
  recommendations: string[];
  disclaimer_required: boolean;
}

interface ValidationResponse {
  success: boolean;
  validation: ValidationResult;
  disclaimer: string;
  metadata: {
    models_used: number;
    processing_time: number;
    recommendation_count: number;
  };
}

export const useAIValidation = () => {
  const [isValidating, setIsValidating] = useState(false);

  const validateContent = async (request: ValidationRequest): Promise<ValidationResponse | null> => {
    setIsValidating(true);
    
    try {
      console.log('🔍 Starting AI validation for content type:', request.contentType);
      
      const { data, error } = await supabase.functions.invoke('ai-validation-engine', {
        body: request
      });

      if (error) {
        console.error('AI validation error:', error);
        toast({
          title: "Validation Failed",
          description: "Could not validate content. Please try again.",
          variant: "destructive",
        });
        return null;
      }

      console.log('✅ AI validation completed:', data);
      
      // Show validation results to user
      const riskColor = data.validation.risk_level === 'high' ? 'destructive' : 
                       data.validation.risk_level === 'medium' ? 'default' : 'default';
      
      toast({
        title: `Validation Complete (${data.validation.confidence_score}%)`,
        description: `Risk Level: ${data.validation.risk_level.toUpperCase()} - ${data.validation.recommendations.length} recommendations`,
        variant: riskColor as any,
      });

      return data;
    } catch (error) {
      console.error('Error in AI validation:', error);
      toast({
        title: "Validation Error",
        description: "An unexpected error occurred during validation.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsValidating(false);
    }
  };

  const validateCompetitorAnalysis = async (analysisData: any, sources: string[] = []) => {
    return validateContent({
      content: JSON.stringify(analysisData),
      contentType: 'competitor_analysis',
      sources,
      context: { type: 'competitor_analysis' }
    });
  };

  const validateMarketResearch = async (researchData: any, sources: string[] = []) => {
    return validateContent({
      content: JSON.stringify(researchData),
      contentType: 'market_research',
      sources,
      context: { type: 'market_research' }
    });
  };

  const validatePricingData = async (pricingData: any, sources: string[] = []) => {
    return validateContent({
      content: JSON.stringify(pricingData),
      contentType: 'pricing_data',
      sources,
      context: { type: 'pricing_data' }
    });
  };

  return {
    validateContent,
    validateCompetitorAnalysis,
    validateMarketResearch,
    validatePricingData,
    isValidating
  };
};