import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AIModelRegistry } from '@/services/ai/modelRegistry';
import { useToast } from '@/hooks/use-toast';

interface ModelAvailabilityHook {
  checkModelAvailability: () => Promise<void>;
  isChecking: boolean;
  lastCheck: Date | null;
}

export const useModelTracking = (): ModelAvailabilityHook => {
  const { toast } = useToast();
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkModelAvailability = async () => {
    setIsChecking(true);
    try {
      console.log('🔄 Starting model availability check...');
      
      const { data, error } = await supabase.functions.invoke('update-model-availability');
      
      if (error) {
        throw new Error(error.message);
      }

      const results = data.results;
      const deprecatedFound = data.summary.deprecatedModelsFound;

      // Check local registry against API results and warn about deprecated models
      results.forEach((result: any) => {
        result.unavailableModels.forEach((model: string) => {
          const deprecationCheck = AIModelRegistry.checkDeprecation(model);
          if (deprecationCheck.isDeprecated) {
            console.warn(`⚠️ ${deprecationCheck.warning}`);
          }
        });
      });

      setLastCheck(new Date());

      if (deprecatedFound > 0) {
        toast({
          title: 'Deprecated Models Detected',
          description: `Found ${deprecatedFound} deprecated models. Please update your configurations.`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Model Check Complete',
          description: `Checked ${data.summary.totalModelsChecked} models across ${data.summary.totalProviders} providers.`,
        });
      }

      console.log('✅ Model availability check completed');
    } catch (error) {
      console.error('❌ Model availability check failed:', error);
      toast({
        title: 'Model Check Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsChecking(false);
    }
  };

  return {
    checkModelAvailability,
    isChecking,
    lastCheck
  };
};