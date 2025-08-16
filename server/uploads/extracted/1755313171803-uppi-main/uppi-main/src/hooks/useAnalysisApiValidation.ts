/**
 * Enhanced API Key Validation for Analysis Components
 * Ensures proper error handling and user feedback for API key issues
 */

import { useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { ApiKeyErrorHandler } from '@/utils/apiKeyErrorHandler';

export const useAnalysisApiValidation = (analysisId?: string) => {
  const [validationResults, setValidationResults] = useState<Record<string, boolean>>({});
  const [isValidating, setIsValidating] = useState(false);
  const [lastValidation, setLastValidation] = useState<string | null>(null);

  const validateAllKeys = async () => {
    setIsValidating(true);
    try {
      // Call the check-api-keys edge function to validate all keys
      const response = await fetch('/functions/v1/check-api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await import('@/integrations/supabase/client')).supabase.auth.getSession().then(s => s.data.session?.access_token)}`
        }
      });

      if (!response.ok) {
        throw new Error(`Validation failed: ${response.statusText}`);
      }

      const data = await response.json();
      const results: Record<string, boolean> = {};
      
      // Process validation results and provide user feedback
      const criticalProviders = ['openai', 'anthropic', 'perplexity', 'gemini'];
      const actualIssues: string[] = [];
      
      Object.entries(data.keys || {}).forEach(([provider, status]: [string, any]) => {
        results[provider] = status.working;
        
        // Only show individual toasts for critical providers or configured keys that are failing
        if (!status.working && status.error && (criticalProviders.includes(provider) || status.configured)) {
          const errorInfo = ApiKeyErrorHandler.handleApiKeyError(
            new Error(status.error), 
            provider
          );
          
          actualIssues.push(provider);
          
          // Show toast for failed validations only for important providers
          toast({
            title: `${provider.charAt(0).toUpperCase() + provider.slice(1)} API Key Issue`,
            description: errorInfo.message + (errorInfo.action ? ` ${errorInfo.action}` : ''),
            variant: 'destructive'
          });
        }
      });

      setValidationResults(results);
      setLastValidation(new Date().toISOString());
      
      // Show summary only if critical keys or configured keys failed
      if (actualIssues.length > 1) {
        toast({
          title: 'Multiple API Key Issues',
          description: `${actualIssues.length} important API keys need attention. Please check your Settings.`,
          variant: 'destructive'
        });
      }

    } catch (error) {
      console.error('API validation error:', error);
      const errorInfo = ApiKeyErrorHandler.handleApiKeyError(error);
      
      toast({
        title: errorInfo.title,
        description: errorInfo.message,
        variant: errorInfo.variant
      });
    } finally {
      setIsValidating(false);
    }
  };

  // Auto-validate when analysis starts or when requested
  useEffect(() => {
    if (analysisId && !lastValidation) {
      validateAllKeys();
    }
  }, [analysisId]);

  return {
    validationResults,
    isValidating,
    lastValidation,
    validateAllKeys,
    hasValidKeys: Object.values(validationResults).some(Boolean),
    failedProviders: Object.entries(validationResults)
      .filter(([_, isValid]) => !isValid)
      .map(([provider]) => provider)
  };
};