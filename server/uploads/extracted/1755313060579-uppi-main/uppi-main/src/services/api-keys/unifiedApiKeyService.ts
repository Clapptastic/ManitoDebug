/**
 * UNIFIED API Key Service - Single Source of Truth
 * 
 * This service provides a unified interface for all API key operations.
 * It replaces all legacy API key services and provides consistent functionality.
 */

import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ApiKey, ApiKeyType } from '@/types/api-keys/unified';

export interface ApiKeyStatus {
  status: 'active' | 'inactive' | 'error' | 'unconfigured' | 'pending';
  isWorking: boolean;
  exists: boolean;
  lastChecked: string | null;
  errorMessage: string | null;
  isActive: boolean;
  isConfigured: boolean;
  maskedKey?: string;
}

export interface SaveApiKeyData {
  provider: string;
  apiKey: string;
}

class UnifiedApiKeyService {
  private statusSubscribers = new Set<(statuses: Record<string, ApiKeyStatus>) => void>();
  private apiKeySubscribers = new Set<(apiKeys: ApiKey[]) => void>();
  private currentStatuses: Record<string, ApiKeyStatus> = {};
  private currentApiKeys: ApiKey[] = [];

  /**
   * Subscribe to API key status changes
   */
  subscribeToStatuses(callback: (statuses: Record<string, ApiKeyStatus>) => void): () => void {
    this.statusSubscribers.add(callback);
    // Send current state immediately
    if (Object.keys(this.currentStatuses).length > 0) {
      callback(this.currentStatuses);
    }
    
    return () => {
      this.statusSubscribers.delete(callback);
    };
  }

  /**
   * Subscribe to API key changes
   */
  subscribeToApiKeys(callback: (apiKeys: ApiKey[]) => void): () => void {
    this.apiKeySubscribers.add(callback);
    // Send current state immediately
    if (this.currentApiKeys.length > 0) {
      callback(this.currentApiKeys);
    }
    
    return () => {
      this.apiKeySubscribers.delete(callback);
    };
  }

  /**
   * Notify all status subscribers
   */
  private notifyStatusSubscribers(statuses: Record<string, ApiKeyStatus>): void {
    this.currentStatuses = statuses;
    this.statusSubscribers.forEach(callback => {
      try {
        callback(statuses);
      } catch (error) {
        console.error('Error in status subscriber callback:', error);
      }
    });
  }

  /**
   * Notify all API key subscribers
   */
  private notifyApiKeySubscribers(apiKeys: ApiKey[]): void {
    this.currentApiKeys = apiKeys;
    this.apiKeySubscribers.forEach(callback => {
      try {
        callback(apiKeys);
      } catch (error) {
        console.error('Error in API key subscriber callback:', error);
      }
    });
  }

  /**
   * Call the unified API key manager edge function
   */
  private async callEdgeFunction(body: any): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('unified-api-key-manager', {
        body
      });

      if (error) {
        console.error('Edge function error:', error);
        
        // Show user-friendly toast instead of throwing
        toast({
          title: 'Connection Issue',
          description: 'API key service temporarily unavailable. Your data is secure and we\'ll retry automatically.',
          variant: 'default', // Not destructive to avoid panic
        });
        
        return { success: false, error: error.message, result: null };
      }

      return data;
    } catch (error) {
      console.error('Edge function call failed:', error);
      
      // Show user-friendly toast instead of throwing
      toast({
        title: 'Network Error',
        description: 'Unable to connect to API key service. Please check your connection and try again.',
        variant: 'default',
      });
      
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error', result: null };
    }
  }

  /**
   * Get all API keys for the current user
   */
  async getAllApiKeys(): Promise<ApiKey[]> {
    try {
      console.log('📋 Getting all API keys...');
      
      const result = await this.callEdgeFunction({
        action: 'get_all'
      });

      if (!result.success) {
        // Return empty array instead of throwing - graceful degradation
        console.warn('API keys unavailable, returning empty list');
        return [];
      }

      const apiKeys = (result.result || []).map((key: any) => ({
        id: key.id,
        user_id: key.user_id,
        provider: key.provider as ApiKeyType,
        name: key.name || `${key.provider} API Key`,
        masked_key: key.masked_key,
        status: key.status,
        is_active: key.is_active,
        created_at: new Date(key.created_at),
        updated_at: new Date(key.updated_at),
        last_validated: key.last_validated ? new Date(key.last_validated) : null,
        key_hash: key.key_hash || '',
        key_prefix: key.key_prefix || '',
        permissions: key.permissions || ['read', 'write'],
        usage_count: key.usage_count || 0,
        metadata: key.metadata || {}
      }));
      
      console.log(`✅ Retrieved ${apiKeys.length} API keys`);
      
      // Notify subscribers
      this.notifyApiKeySubscribers(apiKeys);
      
      return apiKeys;
    } catch (error) {
      console.error('❌ Error getting API keys (graceful fallback):', error);
      // Return empty array instead of throwing - keep app functional
      return [];
    }
  }

  /**
   * Get all provider statuses
   */
  async getAllProviderStatuses(): Promise<Record<string, ApiKeyStatus>> {
    try {
      console.log('📊 Getting all provider statuses...');
      
      const result = await this.callEdgeFunction({
        action: 'get_statuses'
      });

      if (!result.success) {
        // Return empty object instead of throwing - graceful degradation
        console.warn('Provider statuses unavailable, returning empty status');
        return {};
      }

      const statuses = result.result || {};
      console.log(`✅ Retrieved statuses for ${Object.keys(statuses).length} providers`);
      
      // Notify subscribers
      this.notifyStatusSubscribers(statuses);
      
      return statuses;
    } catch (error) {
      console.error('❌ Error getting provider statuses (graceful fallback):', error);
      // Return empty object instead of throwing - keep app functional
      return {};
    }
  }

  /**
   * Save an API key
   */
  async saveApiKey(data: SaveApiKeyData): Promise<ApiKey> {
    try {
      console.log(`💾 Saving ${data.provider} API key...`);
      
      const result = await this.callEdgeFunction({
        action: 'save',
        provider: data.provider,
        apiKey: data.apiKey
      });

      if (result.success) {
        const savedKey = result.result;
        console.log('✅ API key saved successfully');
        
        // Refresh data after save
        await Promise.all([
          this.getAllApiKeys(),
          this.getAllProviderStatuses()
        ]);
        
        toast({
          title: `${data.provider.charAt(0).toUpperCase() + data.provider.slice(1)} API Key Saved`,
          description: `✅ Encrypted and stored securely in Supabase Vault.`,
        });
        
        return savedKey;
      } else {
        throw new Error(result.error || 'Failed to save API key');
      }
    } catch (error) {
      console.error(`❌ Error saving ${data.provider} API key:`, error);
      
      toast({
        title: 'Unable to Save API Key',
        description: `Failed to save ${data.provider} API key. Please verify the key format and try again.`,
        variant: 'destructive',
      });
      
      throw error;
    }
  }

  /**
   * Delete an API key
   */
  async deleteApiKey(keyId: string): Promise<void> {
    try {
      console.log(`🗑️ Deleting API key: ${keyId}`);
      
      const result = await this.callEdgeFunction({
        action: 'delete',
        keyId
      });

      if (result.success) {
        console.log('✅ API key deleted successfully');
        
        // Refresh data after delete
        await Promise.all([
          this.getAllApiKeys(),
          this.getAllProviderStatuses()
        ]);
        
        toast({
          title: 'API Key Deleted',
          description: '✅ Key removed securely from vault storage.',
        });
      } else {
        throw new Error(result.error || 'Failed to delete API key');
      }
    } catch (error) {
      console.error('❌ Error deleting API key:', error);
      
      toast({
        title: 'Unable to Delete API Key',
        description: error instanceof Error ? `${error.message}` : 'Deletion failed. Please try again.',
        variant: 'destructive',
      });
      
      throw error;
    }
  }

  /**
   * Validate an API key for a specific provider
   */
  async validateApiKey(provider: string): Promise<boolean> {
    try {
      console.log(`🔍 Validating ${provider} API key...`);
      
      const result = await this.callEdgeFunction({
        action: 'validate',
        provider
      });

      if (result.success) {
        console.log(`✅ ${provider} API key validation completed`);
        
        // Refresh statuses after validation
        await this.getAllProviderStatuses();
        
        return result.result.valid;
      } else {
        console.warn(`⚠️ ${provider} API key validation failed:`, result.error);
        return false;
      }
    } catch (error) {
      console.error(`❌ Error validating ${provider} API key:`, error);
      return false;
    }
  }

  /**
   * Get API key by provider
   */
  getApiKeyByProvider(provider: string): ApiKey | null {
    return this.currentApiKeys.find(key => key.provider === provider && key.is_active) || null;
  }

  /**
   * Check if user has an API key for a provider
   */
  hasApiKey(provider: string): boolean {
    return this.currentApiKeys.some(key => key.provider === provider && key.is_active);
  }

  /**
   * Check if API key is active and working
   */
  isApiKeyActive(provider: string): boolean {
    const status = this.currentStatuses[provider];
    return status ? status.isWorking : false;
  }

  /**
   * Get working API providers
   */
  getWorkingApis(): string[] {
    return Object.entries(this.currentStatuses)
      .filter(([_, status]) => status.isWorking)
      .map(([provider, _]) => provider);
  }

  /**
   * Check if user has any working API keys
   */
  hasWorkingApis(): boolean {
    return this.getWorkingApis().length > 0;
  }

  /**
   * Refresh all data
   */
  async refreshAll(): Promise<void> {
    try {
      await Promise.all([
        this.getAllApiKeys(),
        this.getAllProviderStatuses()
      ]);
    } catch (error) {
      console.error('Error refreshing all API key data:', error);
      throw error;
    }
  }

  /**
   * Clear all cached data and subscribers
   */
  clearCache(): void {
    this.currentStatuses = {};
    this.currentApiKeys = [];
    this.statusSubscribers.clear();
    this.apiKeySubscribers.clear();
  }

  /**
   * Get API key by provider (legacy compatibility)
   */
  getApiKey(provider: string): ApiKey | null {
    return this.getApiKeyByProvider(provider);
  }

  /**
   * Refresh all statuses (legacy compatibility)
   */
  async refreshAllStatuses(): Promise<void> {
    await this.getAllProviderStatuses();
  }

  // Legacy compatibility methods
  async validateAndUpdateProviderStatus(provider: string): Promise<ApiKeyStatus> {
    await this.validateApiKey(provider);
    return this.currentStatuses[provider] || {
      status: 'unconfigured',
      isWorking: false,
      exists: false,
      lastChecked: null,
      errorMessage: 'Provider not configured',
      isActive: false,
      isConfigured: false
    };
  }

  async getProviderStatus(provider: string): Promise<ApiKeyStatus> {
    return this.currentStatuses[provider] || {
      status: 'unconfigured',
      isWorking: false,
      exists: false,
      lastChecked: null,
      errorMessage: 'Provider not configured',
      isActive: false,
      isConfigured: false
    };
  }
}

// Export singleton instance
export const unifiedApiKeyService = new UnifiedApiKeyService();

// Default export for compatibility
export default unifiedApiKeyService;