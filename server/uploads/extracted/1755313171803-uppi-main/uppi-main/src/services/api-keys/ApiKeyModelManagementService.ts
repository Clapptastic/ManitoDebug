import { supabase } from '@/integrations/supabase/client';
import { ModelVersion, DeprecationWarning, ModelSettings } from '@/types/model-management';
import { ApiKeyType } from '@/types/api-keys/unified';

export class ApiKeyModelManagementService {
  
  /**
   * Get available models based on user's active API keys
   */
  async getAvailableModels(): Promise<ModelVersion[]> {
    try {
      // First, get user's active API keys via RPC
      const { data: userRes } = await supabase.auth.getUser();
      const userId = userRes?.user?.id;
      const { data: rpcKeys, error: apiKeysError } = await supabase
        .rpc('manage_api_key', { operation: 'select', user_id_param: userId });

      if (apiKeysError) {
        console.error('Error fetching API keys:', apiKeysError);
        throw apiKeysError;
      }

      const apiKeys = Array.isArray(rpcKeys) ? rpcKeys : [];
      const activeProviders = apiKeys
        .filter((k: any) => k.is_active && k.status === 'active')
        .map((k: any) => k.provider);
      
      // Get model versions for active providers from database
      const { data: models, error: modelsError } = await supabase
        .from('model_versions')
        .select('*')
        .in('provider', activeProviders)
        .order('provider', { ascending: true });

      if (modelsError) {
        console.error('Error fetching model versions:', modelsError);
        // Fallback to mock data if database query fails
        return this.getMockModels(activeProviders);
      }

      // If no models in database or database is empty, return mock data
      if (!models || models.length === 0) {
        console.log('No models found in database, using mock data');
        return this.getMockModels(activeProviders);
      }

      return models.map(this.transformDatabaseModel);
    } catch (error) {
      const { data: userRes2 } = await supabase.auth.getUser();
      const fallbackUserId = userRes2?.user?.id;
      const { data: apiKeysRpc } = await supabase
        .rpc('manage_api_key', { operation: 'select', user_id_param: fallbackUserId });
      const providers = (Array.isArray(apiKeysRpc) ? apiKeysRpc : []).map((k: any) => k.provider) || [];
      return this.getMockModels(providers);
    }
  }

  /**
   * Get deprecation warnings for user's models
   */
  async getDeprecationWarnings(): Promise<DeprecationWarning[]> {
    // For now, return empty array - this would be populated from a warnings table
    return [];
  }

  /**
   * Get model settings for user
   */
  async getModelSettings(): Promise<Record<string, ModelSettings>> {
    // Return default settings for now
    return {};
  }

  /**
   * Save model settings for user
   */
  async saveModelSettings(settings: ModelSettings[]): Promise<void> {
    // Implementation would save to user_model_settings table
    console.log('Saving model settings:', settings);
  }

  /**
   * Transform database model to ModelVersion interface
   */
  private transformDatabaseModel(dbModel: any): ModelVersion {
    const metadata = typeof dbModel.metadata === 'object' ? dbModel.metadata : {};
    
    // Transform capabilities from metadata
    const capabilities = [];
    if (metadata.capabilities) {
      Object.entries(metadata.capabilities).forEach(([type, supported]) => {
        capabilities.push({ type, supported: !!supported });
      });
    }

    // Extract pricing info from metadata
    const pricing = {
      inputTokenPrice: metadata.pricing?.input || 0,
      outputTokenPrice: metadata.pricing?.output || 0,
      currency: 'USD' as const,
      per1kTokens: true
    };

    // Extract limits from metadata
    const limits = {
      maxTokens: metadata.limits?.max_tokens || 4096,
      contextWindow: metadata.limits?.context_window || 128000,
      requestsPerMinute: metadata.limits?.requests_per_minute,
      tokensPerMinute: metadata.limits?.tokens_per_minute
    };

    return {
      id: dbModel.id,
      provider: dbModel.provider,
      modelName: dbModel.model_name,
      currentVersion: dbModel.version,
      latestVersion: dbModel.version,
      status: dbModel.is_active ? 'current' : 'deprecated',
      capabilities,
      pricing,
      limits,
      lastChecked: dbModel.updated_at || new Date().toISOString(),
      metadata: {
        description: metadata.description,
        use_cases: metadata.use_cases,
        deprecation_date: metadata.deprecation_date,
        replacement_model: metadata.replacement_model,
        ...metadata
      }
    };
  }

  /**
   * Update model availability by checking with providers
   */
  async updateModelAvailability(): Promise<void> {
    console.log('Updating model availability...');
    try {
      const { data, error } = await supabase.functions.invoke('update-model-availability');
      if (error) {
        console.error('Error updating model availability:', error);
        throw error;
      } else {
        console.log('Model availability updated:', data);
      }
    } catch (error) {
      console.error('Error calling update-model-availability function:', error);
      throw error;
    }
  }

  /**
   * Get mock model data for testing
   */
  private getMockModels(providers: string[]): ModelVersion[] {
    const mockModels: ModelVersion[] = [];

    providers.forEach(provider => {
      switch (provider) {
        case 'openai':
          mockModels.push({
            id: `${provider}-gpt-4`,
            provider,
            modelName: 'gpt-4.1-2025-04-14',
            currentVersion: '2025-04-14',
            latestVersion: '2025-04-14',
            status: 'current',
            capabilities: [
              { type: 'text', supported: true },
              { type: 'vision', supported: true },
              { type: 'function_calling', supported: true },
              { type: 'streaming', supported: true }
            ],
            pricing: {
              inputTokenPrice: 0.03,
              outputTokenPrice: 0.06,
              currency: 'USD',
              per1kTokens: true
            },
            limits: {
              maxTokens: 4096,
              contextWindow: 128000,
              requestsPerMinute: 500,
              tokensPerMinute: 160000
            },
            lastChecked: new Date().toISOString(),
            metadata: {
              description: 'Most capable OpenAI model',
              use_cases: ['reasoning', 'code generation', 'analysis']
            }
          });
          break;

        case 'anthropic':
          mockModels.push({
            id: `${provider}-claude-4`,
            provider,
            modelName: 'claude-sonnet-4-20250514',
            currentVersion: '20250514',
            latestVersion: '20250514',
            status: 'current',
            capabilities: [
              { type: 'text', supported: true },
              { type: 'vision', supported: true },
              { type: 'function_calling', supported: true },
              { type: 'streaming', supported: true }
            ],
            pricing: {
              inputTokenPrice: 0.003,
              outputTokenPrice: 0.015,
              currency: 'USD',
              per1kTokens: true
            },
            limits: {
              maxTokens: 4096,
              contextWindow: 200000,
              requestsPerMinute: 400,
              tokensPerMinute: 120000
            },
            lastChecked: new Date().toISOString(),
            metadata: {
              description: 'High-performance Claude model',
              use_cases: ['reasoning', 'analysis', 'writing']
            }
          });
          break;

        case 'google':
        case 'gemini':
          mockModels.push({
            id: `${provider}-gemini-pro`,
            provider,
            modelName: 'gemini-pro',
            currentVersion: '1.0',
            latestVersion: '1.0',
            status: 'current',
            capabilities: [
              { type: 'text', supported: true },
              { type: 'vision', supported: true },
              { type: 'function_calling', supported: true },
              { type: 'streaming', supported: true }
            ],
            pricing: {
              inputTokenPrice: 0.001,
              outputTokenPrice: 0.002,
              currency: 'USD',
              per1kTokens: true
            },
            limits: {
              maxTokens: 2048,
              contextWindow: 32768,
              requestsPerMinute: 300,
              tokensPerMinute: 100000
            },
            lastChecked: new Date().toISOString(),
            metadata: {
              description: 'Google Gemini Pro model',
              use_cases: ['text generation', 'analysis', 'reasoning']
            }
          });
          break;

        case 'perplexity':
          mockModels.push({
            id: `${provider}-sonar`,
            provider,
            modelName: 'llama-3.1-sonar-large-128k-online',
            currentVersion: '3.1',
            latestVersion: '3.1',
            status: 'current',
            capabilities: [
              { type: 'text', supported: true },
              { type: 'streaming', supported: true }
            ],
            pricing: {
              inputTokenPrice: 0.002,
              outputTokenPrice: 0.004,
              currency: 'USD',
              per1kTokens: true
            },
            limits: {
              maxTokens: 1000,
              contextWindow: 128000,
              requestsPerMinute: 200,
              tokensPerMinute: 80000
            },
            lastChecked: new Date().toISOString(),
            metadata: {
              description: 'Perplexity Sonar model with web search',
              use_cases: ['research', 'current information', 'analysis']
            }
          });
          break;
      }
    });

    return mockModels;
  }
}

// Export singleton instance
export const apiKeyModelManagementService = new ApiKeyModelManagementService();