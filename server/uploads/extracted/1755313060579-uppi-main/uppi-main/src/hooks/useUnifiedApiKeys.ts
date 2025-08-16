/**
 * Refactored Unified API Keys Hook - v2.0
 * Clean interface using the new service
 */

import { useState, useEffect, useCallback } from 'react';
import { unifiedApiKeyService, type ApiKeyStatus } from '@/services/api-keys/unifiedApiKeyService';
import { ApiKey, ApiKeyType } from '@/types/api-keys/unified';
import { toast } from '@/hooks/use-toast';

// For backward compatibility with existing imports
type UnifiedApiKeyStatus = ApiKeyStatus;

interface UseUnifiedApiKeysReturn {
  // API Keys Management
  apiKeys: ApiKey[];
  isLoading: boolean;
  error: string | null;
  saveApiKey: (provider: ApiKeyType, apiKey: string) => Promise<void>;
  deleteApiKey: (id: string) => Promise<void>;
  validateApiKey: (provider: ApiKeyType) => Promise<boolean>;
  refreshApiKeys: () => Promise<void>;
  
  // Status Management
  statuses: Record<string, ApiKeyStatus>;
  refreshStatuses: () => Promise<void>;
  validateProvider: (provider: string) => Promise<void>;
  hasWorkingApis: boolean;
  workingApis: string[];
  
  // Utility functions
  getApiKeyByProvider: (provider: ApiKeyType) => ApiKey | undefined;
  hasApiKey: (provider: ApiKeyType) => boolean;
  isApiKeyActive: (provider: ApiKeyType) => boolean;
}

/**
 * Unified hook for API key management
 */
export const useUnifiedApiKeys = (): UseUnifiedApiKeysReturn => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [statuses, setStatuses] = useState<Record<string, ApiKeyStatus>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to changes from the service
  useEffect(() => {
    let isMounted = true;
    
    // Initialize the service first
    const initializeService = async () => {
      try {
        await Promise.all([
          unifiedApiKeyService.getAllApiKeys(),
          unifiedApiKeyService.getAllProviderStatuses()
        ]);
      } catch (error) {
        console.error('Failed to initialize API key service:', error);
        setError(error instanceof Error ? error.message : 'Failed to initialize');
        setIsLoading(false);
      }
    };

    const unsubscribeKeys = unifiedApiKeyService.subscribeToApiKeys((updatedKeys) => {
      if (isMounted) {
        setApiKeys(updatedKeys);
        setIsLoading(false);
      }
    });

    const unsubscribeStatus = unifiedApiKeyService.subscribeToStatuses((updatedStatuses) => {
      if (isMounted) {
        setStatuses(updatedStatuses);
        setIsLoading(false);
      }
    });

    // Initialize data
    initializeService();

    return () => {
      isMounted = false;
      unsubscribeKeys();
      unsubscribeStatus();
    };
  }, []);

  // API Key Operations
  const saveApiKey = useCallback(async (provider: ApiKeyType, apiKey: string) => {
    try {
      setError(null);
      setIsLoading(true);
      
      await unifiedApiKeyService.saveApiKey({ provider, apiKey });
      
      toast({
        title: `${provider.charAt(0).toUpperCase() + provider.slice(1)} Connected`,
        description: `✅ API key encrypted and ready for use.`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unable to save API key';
      setError(errorMessage);
      toast({
        title: 'Save Failed',
        description: `${errorMessage}. Please verify your key and connection.`,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteApiKey = useCallback(async (id: string) => {
    try {
      setError(null);
      await unifiedApiKeyService.deleteApiKey(id);
      toast({
        title: 'Key Removed',
        description: '✅ API key securely deleted from encrypted storage.',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unable to delete API key';
      setError(errorMessage);
      toast({
        title: 'Delete Failed', 
        description: `${errorMessage}. Please try again.`,
        variant: 'destructive',
      });
      throw err;
    }
  }, []);

  const validateApiKey = useCallback(async (provider: ApiKeyType): Promise<boolean> => {
    try {
      setError(null);
      const isValid = await unifiedApiKeyService.validateApiKey(provider);
      
      if (isValid) {
        toast({
          title: `${provider.charAt(0).toUpperCase() + provider.slice(1)} Validated`,
          description: `✅ API key is working and ready for analysis.`,
        });
      } else {
        toast({
          title: `${provider.charAt(0).toUpperCase() + provider.slice(1)} Validation Failed`,
          description: `❌ API key is invalid or service unreachable. Please check your key.`,
          variant: 'destructive',
        });
      }
      
      return isValid;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unable to validate API key';
      setError(errorMessage);
      toast({
        title: 'Validation Error',
        description: `${errorMessage}. Check your connection and key validity.`,
        variant: 'destructive',
      });
      return false;
    }
  }, []);

  const refreshApiKeys = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await unifiedApiKeyService.getAllApiKeys();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh API keys';
      setError(errorMessage);
      console.error('Error refreshing API keys:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshStatuses = useCallback(async () => {
    try {
      setIsLoading(true);
      await unifiedApiKeyService.getAllProviderStatuses();
    } catch (error) {
      console.error('Error refreshing API key statuses:', error);
      toast({
        title: 'Refresh Failed',
        description: 'Unable to refresh API key statuses. Check your connection.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const validateProvider = useCallback(async (provider: string) => {
    try {
      await unifiedApiKeyService.validateApiKey(provider as ApiKeyType);
      toast({
        title: 'Validation Complete',
        description: `✅ ${provider} API key validated successfully.`,
      });
    } catch (error) {
      console.error(`Error validating ${provider}:`, error);
      toast({
        title: 'Validation Failed',
        description: `❌ Unable to validate ${provider} API key.`,
        variant: 'destructive',
      });
    }
  }, []);

  // Utility functions
  const getApiKeyByProvider = useCallback((provider: ApiKeyType): ApiKey | undefined => {
    return apiKeys.find(key => key.provider === provider && key.is_active);
  }, [apiKeys]);

  const hasApiKey = useCallback((provider: ApiKeyType): boolean => {
    return !!getApiKeyByProvider(provider);
  }, [getApiKeyByProvider]);

  const isApiKeyActive = useCallback((provider: ApiKeyType): boolean => {
    const key = getApiKeyByProvider(provider);
    return key?.is_active === true;
  }, [getApiKeyByProvider]);

  // Calculate working APIs
  const workingApis = Object.keys(statuses).filter(api => statuses[api]?.isWorking);
  const hasWorkingApis = workingApis.length > 0;

  return {
    // API Keys Management
    apiKeys,
    isLoading,
    error,
    saveApiKey,
    deleteApiKey,
    validateApiKey,
    refreshApiKeys,
    
    // Status Management 
    statuses,
    refreshStatuses,
    validateProvider,
    hasWorkingApis,
    workingApis,
    
    // Utility functions
    getApiKeyByProvider,
    hasApiKey,
    isApiKeyActive
  };
};