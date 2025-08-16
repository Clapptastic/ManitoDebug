/**
 * Quick API Key Validation Fix
 * Validates API keys and provides immediate feedback
 */

import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export async function validateUserApiKeys() {
  try {
    console.log('🔄 Starting API key validation...');
    
    // Call the validation edge function
    const { data, error } = await supabase.functions.invoke('check-api-keys');
    
    if (error) {
      console.error('❌ API key validation failed:', error);
      toast({
        title: 'Validation Error',
        description: 'Failed to validate API keys. Please try again.',
        variant: 'destructive'
      });
      return { success: false, error: error.message };
    }
    
    const { keys, success, working_keys } = data;
    
    console.log('📊 Validation results:', { success, working_keys, keys });
    
    const failedProviders: string[] = [];
    const successfulProviders: string[] = [];
    
    Object.entries(keys || {}).forEach(([provider, status]: [string, any]) => {
      if (status.working) {
        successfulProviders.push(provider);
      } else {
        failedProviders.push(provider);
        console.error(`❌ ${provider} API key failed:`, status.error);
      }
    });
    
    // Provide specific feedback
    if (failedProviders.length > 0) {
      const issues = failedProviders.map(provider => {
        const status = keys[provider];
        if (status.error?.includes('401') || status.error?.includes('unauthorized')) {
          return `${provider}: Invalid API key`;
        } else if (status.error?.includes('400')) {
          return `${provider}: Bad request - check key format`;  
        } else {
          return `${provider}: ${status.error || 'Unknown error'}`;
        }
      }).join('\n');
      
      toast({
        title: `${failedProviders.length} API Key Issues Found`,
        description: `Please fix these issues in Settings:\n${issues}`,
        variant: 'destructive'
      });
    }
    
    if (successfulProviders.length > 0) {
      toast({
        title: 'API Keys Validated',
        description: `${successfulProviders.length} API key(s) are working: ${successfulProviders.join(', ')}`,
        variant: 'default'
      });
    }
    
    return { 
      success: successfulProviders.length > 0, 
      working: successfulProviders, 
      failed: failedProviders,
      details: keys
    };
    
  } catch (error) {
    console.error('💥 API key validation error:', error);
    toast({
      title: 'Validation Failed',
      description: 'Network error during validation. Please check your connection.',
      variant: 'destructive'
    });
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Auto-run validation for debugging
if (typeof window !== 'undefined') {
  console.log('🔍 API Key validation utility loaded');
}