/**
 * Real-time Analysis Status Monitor
 * Provides live feedback for analysis progress and API key issues
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ApiKeyErrorHandler } from '@/utils/apiKeyErrorHandler';

interface AnalysisStatus {
  id: string;
  status: string;
  progress?: number;
  currentProvider?: string;
  errors?: Record<string, string>;
  apiKeyIssues?: string[];
}

export const useAnalysisStatusMonitor = (analysisId?: string) => {
  const [status, setStatus] = useState<AnalysisStatus | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [apiKeyValidation, setApiKeyValidation] = useState<Record<string, boolean>>({});

  const checkApiKeyStatus = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('check-api-keys');
      
      if (error) {
        console.error('API key check failed:', error);
        return;
      }

      const validation: Record<string, boolean> = {};
      const issues: string[] = [];
      
      // Only report issues for providers that actually have API keys configured
      // or are critical for competitor analysis
      const criticalProviders = ['openai', 'anthropic', 'perplexity', 'gemini'];

      Object.entries(data.keys || {}).forEach(([provider, status]: [string, any]) => {
        validation[provider] = status.working;
        
        // Only report as an issue if:
        // 1. It's a critical provider, OR
        // 2. The provider has a configured key that isn't working
        if (!status.working && (criticalProviders.includes(provider) || status.configured)) {
          const errorInfo = ApiKeyErrorHandler.handleApiKeyError(
            new Error(status.error || 'Validation failed'), 
            provider
          );
          issues.push(`${provider}: ${errorInfo.message}`);
        }
      });

      setApiKeyValidation(validation);
      
      // Update status with API key issues
      if (issues.length > 0) {
        setStatus(prev => prev ? { ...prev, apiKeyIssues: issues } : null);
        
        toast({
          title: 'API Key Issues Detected',
          description: `${issues.length} API key(s) need attention. Check Settings for details.`,
          variant: 'destructive'
        });
      }

    } catch (error) {
      console.error('Error checking API keys:', error);
    }
  }, []);

  const startMonitoring = useCallback(async (id: string) => {
    setIsMonitoring(true);
    setStatus({ id, status: 'starting', progress: 0 });
    
    // Check API keys before starting
    await checkApiKeyStatus();
    
    // Monitor analysis progress (simplified)
    const interval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('competitor_analyses')
          .select('id, status, analysis_data')
          .eq('id', id)
          .maybeSingle();

        if (error) {
          console.error('Error monitoring analysis:', error);
          return;
        }

        if (data) {
          setStatus(prev => ({
            ...prev!,
            id: data.id,
            status: data.status,
            progress: data.status === 'completed' ? 100 : prev?.progress || 50
          }));

          if (data.status === 'completed' || data.status === 'failed') {
            clearInterval(interval);
            setIsMonitoring(false);
            
            if (data.status === 'failed') {
              toast({
                title: 'Analysis Failed',
                description: 'The analysis could not be completed. Please check your API keys and try again.',
                variant: 'destructive'
              });
            }
          }
        }
      } catch (error) {
        console.error('Monitoring error:', error);
      }
    }, 2000);

    return () => {
      clearInterval(interval);
      setIsMonitoring(false);
    };
  }, [checkApiKeyStatus]);

  useEffect(() => {
    if (analysisId && !isMonitoring) {
      let cleanup: (() => void) | undefined;
      
      const initMonitoring = async () => {
        cleanup = await startMonitoring(analysisId);
      };
      
      initMonitoring();
      
      return cleanup;
    }
  }, [analysisId, isMonitoring, startMonitoring]);

  return {
    status,
    isMonitoring,
    apiKeyValidation,
    checkApiKeyStatus,
    hasValidApiKeys: Object.values(apiKeyValidation).some(Boolean),
    invalidProviders: Object.entries(apiKeyValidation)
      .filter(([_, isValid]) => !isValid)
      .map(([provider]) => provider)
  };
};