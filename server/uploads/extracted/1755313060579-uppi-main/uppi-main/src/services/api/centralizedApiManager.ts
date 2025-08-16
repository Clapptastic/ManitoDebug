/**
 * Centralized API Manager
 * Coordinates all API services and manages failover logic
 */

import { unifiedApiKeyService } from '@/services/api-keys/unifiedApiKeyService';
import { standardErrorHandler } from '@/utils/errorHandling/standardErrorHandler';
import { ApiKeyType } from '@/types/api-keys/unified';

export interface ApiProviderConfig {
  type: ApiKeyType;
  priority: number;
  isEnabled: boolean;
  fallbackOptions?: ApiKeyType[];
}

export class CentralizedApiManager {
  private static instance: CentralizedApiManager;
  private providerConfigs: Map<ApiKeyType, ApiProviderConfig> = new Map();

  private constructor() {
    this.initializeProviderConfigs();
  }

  public static getInstance(): CentralizedApiManager {
    if (!CentralizedApiManager.instance) {
      CentralizedApiManager.instance = new CentralizedApiManager();
    }
    return CentralizedApiManager.instance;
  }

  private initializeProviderConfigs(): void {
    const configs: ApiProviderConfig[] = [
      { type: 'openai', priority: 1, isEnabled: true, fallbackOptions: ['anthropic'] },
      { type: 'anthropic', priority: 2, isEnabled: true, fallbackOptions: ['openai'] },
      { type: 'perplexity', priority: 4, isEnabled: true, fallbackOptions: ['serpapi'] },
      { type: 'serpapi', priority: 5, isEnabled: true },
      
      { type: 'cohere', priority: 7, isEnabled: true }
    ];

    configs.forEach(config => {
      this.providerConfigs.set(config.type, config);
    });
  }

  async getAvailableProviders(): Promise<ApiKeyType[]> {
    try {
      const allKeys = await unifiedApiKeyService.getAllApiKeys();
      const activeProviders = allKeys
        .filter(key => key.is_active)
        .map(key => key.provider as ApiKeyType)
        .sort((a, b) => {
          const priorityA = this.providerConfigs.get(a)?.priority || 999;
          const priorityB = this.providerConfigs.get(b)?.priority || 999;
          return priorityA - priorityB;
        });

      return activeProviders;
    } catch (error) {
      standardErrorHandler.handleError(error, 'Failed to get available providers');
      return [];
    }
  }

  async getProviderWithFallback(preferredProvider: ApiKeyType): Promise<ApiKeyType | null> {
    try {
      // Check if preferred provider is available
      const apiKey = await unifiedApiKeyService.getApiKey(preferredProvider);
      if (apiKey?.is_active) {
        return preferredProvider;
      }

      // Try fallback options
      const config = this.providerConfigs.get(preferredProvider);
      if (config?.fallbackOptions) {
        for (const fallback of config.fallbackOptions) {
          const fallbackKey = await unifiedApiKeyService.getApiKey(fallback);
          if (fallbackKey?.is_active) {
            return fallback;
          }
        }
      }

      // Last resort: get any available provider
      const availableProviders = await this.getAvailableProviders();
      return availableProviders[0] || null;
    } catch (error) {
      standardErrorHandler.handleError(error, 'Failed to get provider with fallback');
      return null;
    }
  }

  async validateAllProviders(): Promise<Map<ApiKeyType, boolean>> {
    const validationResults = new Map<ApiKeyType, boolean>();
    
    try {
      const allKeys = await unifiedApiKeyService.getAllApiKeys();
      
      for (const key of allKeys) {
        const isValid = await unifiedApiKeyService.validateApiKey(
          key.provider as ApiKeyType
        );
        validationResults.set(key.provider as ApiKeyType, isValid);
      }
    } catch (error) {
      standardErrorHandler.handleError(error, 'Failed to validate providers');
    }

    return validationResults;
  }

  updateProviderConfig(type: ApiKeyType, config: Partial<ApiProviderConfig>): void {
    const existingConfig = this.providerConfigs.get(type);
    if (existingConfig) {
      this.providerConfigs.set(type, { ...existingConfig, ...config });
    }
  }
}

export const centralizedApiManager = CentralizedApiManager.getInstance();