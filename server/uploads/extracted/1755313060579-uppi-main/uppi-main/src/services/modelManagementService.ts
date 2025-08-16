import { supabase } from '@/integrations/supabase/client';
import { ModelVersion, DeprecationWarning, ModelSettings, ModelProvider } from '@/types/model-management';

class ModelManagementService {
  async getAvailableModels(): Promise<ModelVersion[]> {
    try {
      const { data, error } = await supabase
        .from('model_versions')
        .select('*')
        .order('provider', { ascending: true });

      if (error) throw error;

      return data?.map(this.transformToModelVersion) || [];
    } catch (error) {
      console.error('Error fetching available models:', error);
      return this.getFallbackModels();
    }
  }

  async updateModelAvailability(): Promise<void> {
    try {
      const { error } = await supabase.functions.invoke('update-model-availability');
      if (error) throw error;
    } catch (error) {
      console.error('Error updating model availability:', error);
      throw error;
    }
  }

  async getDeprecationWarnings(): Promise<DeprecationWarning[]> {
    const models = await this.getAvailableModels();
    const warnings: DeprecationWarning[] = [];

    models.forEach(model => {
      if (model.status === 'deprecated' && model.deprecationDate) {
        warnings.push({
          id: `${model.provider}-${model.modelName}`,
          provider: model.provider,
          modelName: model.modelName,
          severity: this.getSeverityByDate(model.deprecationDate),
          message: this.getDeprecationMessage(model),
          deprecationDate: model.deprecationDate,
          replacementModel: model.replacementModel,
          actionRequired: new Date(model.deprecationDate) <= new Date(),
          dismissed: false
        });
      }
    });

    return warnings;
  }

  async saveModelSettings(settings: ModelSettings[]): Promise<void> {
    try {
      // Save to localStorage for now, could be moved to database later
      localStorage.setItem('model-settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving model settings:', error);
      throw error;
    }
  }

  async getModelSettings(): Promise<Record<string, ModelSettings>> {
    try {
      const saved = localStorage.getItem('model-settings');
      if (saved) {
        const settings = JSON.parse(saved) as ModelSettings[];
        return settings.reduce((acc, setting) => {
          acc[`${setting.provider}-${setting.selectedModel}`] = setting;
          return acc;
        }, {} as Record<string, ModelSettings>);
      }
      return this.getDefaultModelSettings();
    } catch (error) {
      console.error('Error loading model settings:', error);
      return this.getDefaultModelSettings();
    }
  }

  private transformToModelVersion(data: any): ModelVersion {
    return {
      id: data.id,
      provider: data.provider,
      modelName: data.model_name,
      currentVersion: data.current_version || 'unknown',
      latestVersion: data.latest_version,
      status: data.status,
      deprecationDate: data.metadata?.deprecation_date,
      replacementModel: data.metadata?.replacement_model,
      capabilities: this.parseCapabilities(data.metadata?.capabilities),
      pricing: this.parsePricing(data.metadata?.pricing),
      limits: this.parseLimits(data.metadata?.limits),
      lastChecked: data.last_checked || data.updated_at,
      metadata: {
        description: data.metadata?.description,
        use_cases: data.metadata?.use_cases || [],
        parameters_count: data.metadata?.parameters_count,
        training_data_cutoff: data.metadata?.training_data_cutoff,
        release_date: data.metadata?.release_date,
        context_window: data.metadata?.context_window,
        supports_web_search: data.metadata?.supports_web_search || false,
        supports_vision: data.metadata?.supports_vision || false,
        supports_function_calling: data.metadata?.supports_function_calling || false
      }
    };
  }

  private parseCapabilities(capabilities: any): any[] {
    if (!capabilities) return [];
    return Object.entries(capabilities).map(([type, supported]) => ({
      type,
      supported: Boolean(supported)
    }));
  }

  private parsePricing(pricing: any): any {
    return {
      inputTokenPrice: pricing?.input || 0,
      outputTokenPrice: pricing?.output || 0,
      currency: 'USD',
      per1kTokens: true
    };
  }

  private parseLimits(limits: any): any {
    return {
      maxTokens: limits?.max_tokens || 4096,
      contextWindow: limits?.context_window || 4096,
      requestsPerMinute: limits?.requests_per_minute,
      tokensPerMinute: limits?.tokens_per_minute
    };
  }

  private getSeverityByDate(deprecationDate: string): 'info' | 'warning' | 'critical' {
    const depDate = new Date(deprecationDate);
    const now = new Date();
    const daysUntil = Math.ceil((depDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil <= 0) return 'critical';
    if (daysUntil <= 30) return 'warning';
    return 'info';
  }

  private getDeprecationMessage(model: ModelVersion): string {
    const date = new Date(model.deprecationDate!).toLocaleDateString();
    const replacement = model.replacementModel ? ` Consider migrating to ${model.replacementModel}.` : '';
    return `${model.modelName} will be deprecated on ${date}.${replacement}`;
  }

  private getFallbackModels(): ModelVersion[] {
    return [
      {
        id: 'openai-gpt-4',
        provider: 'openai',
        modelName: 'gpt-4.1-2025-04-14',
        currentVersion: '2025-04-14',
        status: 'current',
        capabilities: [
          { type: 'text', supported: true },
          { type: 'vision', supported: true },
          { type: 'function_calling', supported: true }
        ],
        pricing: { inputTokenPrice: 0.005, outputTokenPrice: 0.015, currency: 'USD', per1kTokens: true },
        limits: { maxTokens: 4096, contextWindow: 128000 },
        lastChecked: new Date().toISOString()
      },
      {
        id: 'anthropic-claude-4',
        provider: 'anthropic',
        modelName: 'claude-sonnet-4-20250514',
        currentVersion: '20250514',
        status: 'current',
        capabilities: [
          { type: 'text', supported: true },
          { type: 'vision', supported: true }
        ],
        pricing: { inputTokenPrice: 0.003, outputTokenPrice: 0.015, currency: 'USD', per1kTokens: true },
        limits: { maxTokens: 4096, contextWindow: 200000 },
        lastChecked: new Date().toISOString()
      },
      {
        id: 'perplexity-sonar',
        provider: 'perplexity',
        modelName: 'llama-3.1-sonar-small-128k-online',
        currentVersion: '3.1',
        status: 'current',
        capabilities: [
          { type: 'text', supported: true }
        ],
        pricing: { inputTokenPrice: 0.0002, outputTokenPrice: 0.0002, currency: 'USD', per1kTokens: true },
        limits: { maxTokens: 4096, contextWindow: 127072 },
        lastChecked: new Date().toISOString()
      },
      {
        id: 'gemini-pro',
        provider: 'gemini',
        modelName: 'gemini-1.5-pro',
        currentVersion: '1.5',
        status: 'current',
        capabilities: [
          { type: 'text', supported: true },
          { type: 'vision', supported: true },
          { type: 'function_calling', supported: true }
        ],
        pricing: { inputTokenPrice: 0.00125, outputTokenPrice: 0.005, currency: 'USD', per1kTokens: true },
        limits: { maxTokens: 8192, contextWindow: 2000000 },
        lastChecked: new Date().toISOString()
      }
    ];
  }

  private getDefaultModelSettings(): Record<string, ModelSettings> {
    return {
      'openai-gpt-4': {
        provider: 'openai',
        selectedModel: 'gpt-4',
        enabled: true,
        priority: 1
      },
      'anthropic-claude-3-sonnet': {
        provider: 'anthropic',
        selectedModel: 'claude-3-sonnet',
        enabled: true,
        priority: 2
      }
    };
  }
}

export const modelManagementService = new ModelManagementService();