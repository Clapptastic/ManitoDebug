/**
 * Centralized AI Model Registry with deprecation tracking and automatic fallbacks
 */

export interface ModelConfig {
  id: string;
  provider: 'openai' | 'anthropic' | 'perplexity' | 'gemini';
  displayName: string;
  status: 'current' | 'deprecated' | 'experimental' | 'beta';
  deprecationDate?: string;
  replacementModel?: string;
  capabilities: string[];
  contextWindow: number;
  maxTokens: number;
  costPer1kTokens: number;
  description: string;
}

export interface ProviderConfig {
  name: string;
  currentModels: string[];
  deprecatedModels: string[];
  defaultModel: string;
  fallbackModel: string;
}

export class AIModelRegistry {
  private static models: Record<string, ModelConfig> = {
    // OpenAI Models - Latest
    'gpt-4.1-2025-04-14': {
      id: 'gpt-4.1-2025-04-14',
      provider: 'openai',
      displayName: 'GPT-4.1 (2025-04-14)',
      status: 'current',
      capabilities: ['text', 'vision', 'reasoning'],
      contextWindow: 128000,
      maxTokens: 4096,
      costPer1kTokens: 0.03,
      description: 'Flagship model with superior reasoning and vision capabilities'
    },
    'o3-2025-04-16': {
      id: 'o3-2025-04-16',
      provider: 'openai',
      displayName: 'O3 Reasoning (2025-04-16)',
      status: 'current',
      capabilities: ['reasoning', 'analysis', 'problem-solving'],
      contextWindow: 128000,
      maxTokens: 4096,
      costPer1kTokens: 0.06,
      description: 'Powerful reasoning model for complex multi-step problems'
    },
    'o4-mini-2025-04-16': {
      id: 'o4-mini-2025-04-16',
      provider: 'openai',
      displayName: 'O4 Mini (2025-04-16)',
      status: 'current',
      capabilities: ['reasoning', 'coding', 'vision'],
      contextWindow: 128000,
      maxTokens: 4096,
      costPer1kTokens: 0.015,
      description: 'Fast reasoning model optimized for coding and visual tasks'
    },
    'gpt-4.1-mini-2025-04-14': {
      id: 'gpt-4.1-mini-2025-04-14',
      provider: 'openai',
      displayName: 'GPT-4.1 Mini (2025-04-14)',
      status: 'current',
      capabilities: ['text', 'vision'],
      contextWindow: 128000,
      maxTokens: 4096,
      costPer1kTokens: 0.01,
      description: 'Efficient model with vision capabilities'
    },
    
    // OpenAI Deprecated Models
    'gpt-4': {
      id: 'gpt-4',
      provider: 'openai',
      displayName: 'GPT-4 (Legacy)',
      status: 'deprecated',
      deprecationDate: '2024-06-13',
      replacementModel: 'gpt-4.1-2025-04-14',
      capabilities: ['text'],
      contextWindow: 8192,
      maxTokens: 4096,
      costPer1kTokens: 0.03,
      description: 'Legacy GPT-4 model - use GPT-4.1 instead'
    },
    'gpt-4-vision-preview': {
      id: 'gpt-4-vision-preview',
      provider: 'openai',
      displayName: 'GPT-4 Vision Preview (Legacy)',
      status: 'deprecated',
      deprecationDate: '2024-06-13',
      replacementModel: 'gpt-4.1-2025-04-14',
      capabilities: ['text', 'vision'],
      contextWindow: 128000,
      maxTokens: 4096,
      costPer1kTokens: 0.03,
      description: 'Legacy vision model - use GPT-4.1 instead'
    },
    'text-davinci-003': {
      id: 'text-davinci-003',
      provider: 'openai',
      displayName: 'Text Davinci 003 (Discontinued)',
      status: 'deprecated',
      deprecationDate: '2024-01-04',
      replacementModel: 'gpt-4.1-2025-04-14',
      capabilities: ['text'],
      contextWindow: 4097,
      maxTokens: 4096,
      costPer1kTokens: 0.02,
      description: 'Discontinued completion model'
    },

    // Anthropic Models - Latest
    'claude-opus-4-20250514': {
      id: 'claude-opus-4-20250514',
      provider: 'anthropic',
      displayName: 'Claude Opus 4 (2025-05-14)',
      status: 'current',
      capabilities: ['text', 'vision', 'reasoning', 'analysis'],
      contextWindow: 200000,
      maxTokens: 8192,
      costPer1kTokens: 0.075,
      description: 'Most capable and intelligent Claude model with superior reasoning'
    },
    'claude-sonnet-4-20250514': {
      id: 'claude-sonnet-4-20250514',
      provider: 'anthropic',
      displayName: 'Claude Sonnet 4 (2025-05-14)',
      status: 'current',
      capabilities: ['text', 'vision', 'reasoning'],
      contextWindow: 200000,
      maxTokens: 8192,
      costPer1kTokens: 0.015,
      description: 'High-performance model with exceptional reasoning and efficiency'
    },
    'claude-3-5-haiku-20241022': {
      id: 'claude-3-5-haiku-20241022',
      provider: 'anthropic',
      displayName: 'Claude 3.5 Haiku (2024-10-22)',
      status: 'current',
      capabilities: ['text', 'vision'],
      contextWindow: 200000,
      maxTokens: 8192,
      costPer1kTokens: 0.0025,
      description: 'Fastest Claude model for quick responses'
    },
    
    // Anthropic Legacy Models
    'claude-3-opus-20240229': {
      id: 'claude-3-opus-20240229',
      provider: 'anthropic',
      displayName: 'Claude 3 Opus (Legacy)',
      status: 'deprecated',
      deprecationDate: '2025-05-14',
      replacementModel: 'claude-opus-4-20250514',
      capabilities: ['text', 'vision'],
      contextWindow: 200000,
      maxTokens: 4096,
      costPer1kTokens: 0.075,
      description: 'Legacy Claude 3 Opus - upgrade to Claude 4'
    },
    'claude-3-5-sonnet-20241022': {
      id: 'claude-3-5-sonnet-20241022',
      provider: 'anthropic',
      displayName: 'Claude 3.5 Sonnet (Legacy)',
      status: 'deprecated',
      deprecationDate: '2025-05-14',
      replacementModel: 'claude-sonnet-4-20250514',
      capabilities: ['text', 'vision'],
      contextWindow: 200000,
      maxTokens: 8192,
      costPer1kTokens: 0.015,
      description: 'Legacy Claude 3.5 Sonnet - upgrade to Sonnet 4'
    },

    // Perplexity Models
    'llama-3.1-sonar-small-128k-online': {
      id: 'llama-3.1-sonar-small-128k-online',
      provider: 'perplexity',
      displayName: 'Llama 3.1 Sonar Small (Online)',
      status: 'current',
      capabilities: ['text', 'web-search', 'real-time'],
      contextWindow: 127072,
      maxTokens: 4096,
      costPer1kTokens: 0.002,
      description: 'Fast online search model with real-time web access'
    },
    'llama-3.1-sonar-large-128k-online': {
      id: 'llama-3.1-sonar-large-128k-online',
      provider: 'perplexity',
      displayName: 'Llama 3.1 Sonar Large (Online)',
      status: 'current',
      capabilities: ['text', 'web-search', 'real-time'],
      contextWindow: 127072,
      maxTokens: 4096,
      costPer1kTokens: 0.006,
      description: 'Powerful online search model with comprehensive web access'
    },

    // Gemini Models
    'gemini-pro': {
      id: 'gemini-pro',
      provider: 'gemini',
      displayName: 'Gemini Pro',
      status: 'current',
      capabilities: ['text', 'vision'],
      contextWindow: 32768,
      maxTokens: 8192,
      costPer1kTokens: 0.005,
      description: 'Google\'s flagship multimodal model'
    }
  };

  private static providers: Record<string, ProviderConfig> = {
    openai: {
      name: 'OpenAI',
      currentModels: ['gpt-4.1-2025-04-14', 'o3-2025-04-16', 'o4-mini-2025-04-16', 'gpt-4.1-mini-2025-04-14'],
      deprecatedModels: ['gpt-4', 'gpt-4-vision-preview', 'text-davinci-003', 'text-davinci-002'],
      defaultModel: 'gpt-4.1-2025-04-14',
      fallbackModel: 'gpt-4.1-mini-2025-04-14'
    },
    anthropic: {
      name: 'Anthropic',
      currentModels: ['claude-opus-4-20250514', 'claude-sonnet-4-20250514', 'claude-3-5-haiku-20241022'],
      deprecatedModels: ['claude-3-opus-20240229', 'claude-3-5-sonnet-20241022', 'claude-2.1'],
      defaultModel: 'claude-sonnet-4-20250514',
      fallbackModel: 'claude-3-5-haiku-20241022'
    },
    perplexity: {
      name: 'Perplexity',
      currentModels: ['llama-3.1-sonar-small-128k-online', 'llama-3.1-sonar-large-128k-online'],
      deprecatedModels: [],
      defaultModel: 'llama-3.1-sonar-small-128k-online',
      fallbackModel: 'llama-3.1-sonar-small-128k-online'
    },
    gemini: {
      name: 'Google Gemini',
      currentModels: ['gemini-pro'],
      deprecatedModels: [],
      defaultModel: 'gemini-pro',
      fallbackModel: 'gemini-pro'
    }
  };

  /**
   * Get model configuration by ID
   */
  static getModel(modelId: string): ModelConfig | null {
    return this.models[modelId] || null;
  }

  /**
   * Get all models for a provider
   */
  static getProviderModels(provider: string): ModelConfig[] {
    return Object.values(this.models).filter(model => model.provider === provider);
  }

  /**
   * Get current (non-deprecated) models for a provider
   */
  static getCurrentModels(provider: string): ModelConfig[] {
    return this.getProviderModels(provider).filter(model => model.status === 'current');
  }

  /**
   * Get deprecated models for a provider
   */
  static getDeprecatedModels(provider: string): ModelConfig[] {
    return this.getProviderModels(provider).filter(model => model.status === 'deprecated');
  }

  /**
   * Check if a model is deprecated and get replacement
   */
  static checkDeprecation(modelId: string): { isDeprecated: boolean; replacement?: string; warning?: string } {
    const model = this.getModel(modelId);
    
    if (!model) {
      return { 
        isDeprecated: true, 
        replacement: this.providers[this.guessProvider(modelId)]?.defaultModel,
        warning: `Unknown model "${modelId}" - using default fallback`
      };
    }

    if (model.status === 'deprecated') {
      return {
        isDeprecated: true,
        replacement: model.replacementModel || this.providers[model.provider]?.fallbackModel,
        warning: `Model "${modelId}" is deprecated${model.deprecationDate ? ` (since ${model.deprecationDate})` : ''}. Using replacement: ${model.replacementModel || 'fallback model'}`
      };
    }

    return { isDeprecated: false };
  }

  /**
   * Get the best model for a provider with fallback
   */
  static getBestModel(provider: string, requestedModel?: string): string {
    const providerConfig = this.providers[provider];
    if (!providerConfig) {
      throw new Error(`Unknown provider: ${provider}`);
    }

    // If specific model requested, check deprecation
    if (requestedModel) {
      const deprecationCheck = this.checkDeprecation(requestedModel);
      if (deprecationCheck.isDeprecated && deprecationCheck.replacement) {
        console.warn(`⚠️ ${deprecationCheck.warning}`);
        return deprecationCheck.replacement;
      }
      
      // If model exists and is current, use it
      if (!deprecationCheck.isDeprecated) {
        return requestedModel;
      }
    }

    // Return default model for provider
    return providerConfig.defaultModel;
  }

  /**
   * Get provider configuration
   */
  static getProvider(provider: string): ProviderConfig | null {
    return this.providers[provider] || null;
  }

  /**
   * Guess provider from model name
   */
  private static guessProvider(modelId: string): string {
    if (modelId.includes('gpt') || modelId.includes('text-davinci') || modelId.includes('o3') || modelId.includes('o4')) {
      return 'openai';
    }
    if (modelId.includes('claude')) {
      return 'anthropic';
    }
    if (modelId.includes('llama') || modelId.includes('sonar')) {
      return 'perplexity';
    }
    if (modelId.includes('gemini')) {
      return 'gemini';
    }
    return 'openai'; // Default fallback
  }

  /**
   * Get model recommendations for different use cases
   */
  static getRecommendations() {
    return {
      general: {
        openai: 'gpt-4.1-2025-04-14',
        anthropic: 'claude-sonnet-4-20250514'
      },
      reasoning: {
        openai: 'o3-2025-04-16',
        anthropic: 'claude-opus-4-20250514'
      },
      fast: {
        openai: 'o4-mini-2025-04-16',
        anthropic: 'claude-3-5-haiku-20241022'
      },
      vision: {
        openai: 'gpt-4.1-2025-04-14',
        anthropic: 'claude-sonnet-4-20250514'
      },
      search: {
        perplexity: 'llama-3.1-sonar-large-128k-online'
      },
      costEffective: {
        openai: 'gpt-4.1-mini-2025-04-14',
        anthropic: 'claude-3-5-haiku-20241022'
      }
    };
  }

  /**
   * Update model status (for administrative updates)
   */
  static updateModelStatus(modelId: string, status: ModelConfig['status'], replacementModel?: string): void {
    if (this.models[modelId]) {
      this.models[modelId].status = status;
      if (status === 'deprecated' && replacementModel) {
        this.models[modelId].replacementModel = replacementModel;
        this.models[modelId].deprecationDate = new Date().toISOString().split('T')[0];
      }
    }
  }

  /**
   * Get all providers
   */
  static getAllProviders(): string[] {
    return Object.keys(this.providers);
  }

  /**
   * Validate model availability for provider
   */
  static isModelAvailable(provider: string, modelId: string): boolean {
    const model = this.getModel(modelId);
    return model?.provider === provider && model?.status === 'current';
  }
}