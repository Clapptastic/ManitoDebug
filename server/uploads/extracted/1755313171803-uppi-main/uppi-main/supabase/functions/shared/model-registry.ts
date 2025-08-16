export interface ModelInfo {
  name: string;
  provider: string;
  deprecated: boolean;
  replacement?: string;
  features: string[];
  costPer1K?: number;
}

export interface DeprecationCheck {
  isDeprecated: boolean;
  warning?: string;
  replacement?: string;
}

export class AIModelRegistry {
  private static models: Map<string, ModelInfo> = new Map([
    // OpenAI Models
    ['gpt-4.1-2025-04-14', {
      name: 'GPT-4.1',
      provider: 'openai',
      deprecated: false,
      features: ['chat', 'vision', 'function-calling'],
      costPer1K: 0.03
    }],
    ['o3-2025-04-16', {
      name: 'O3 Reasoning',
      provider: 'openai',
      deprecated: false,
      features: ['reasoning', 'complex-analysis'],
      costPer1K: 0.15
    }],
    ['o4-mini-2025-04-16', {
      name: 'O4 Mini',
      provider: 'openai',
      deprecated: false,
      features: ['fast-reasoning', 'lightweight'],
      costPer1K: 0.05
    }],
    ['gpt-4o', {
      name: 'GPT-4o',
      provider: 'openai',
      deprecated: false,
      features: ['chat', 'vision'],
      costPer1K: 0.025
    }],
    // Deprecated models
    ['gpt-4', {
      name: 'GPT-4 (Legacy)',
      provider: 'openai',
      deprecated: true,
      replacement: 'gpt-4.1-2025-04-14',
      features: ['chat'],
      costPer1K: 0.06
    }],
    ['gpt-4-vision-preview', {
      name: 'GPT-4 Vision Preview',
      provider: 'openai',
      deprecated: true,
      replacement: 'gpt-4.1-2025-04-14',
      features: ['chat', 'vision'],
      costPer1K: 0.06
    }],
    ['text-davinci-003', {
      name: 'Text Davinci 003',
      provider: 'openai',
      deprecated: true,
      replacement: 'gpt-4.1-2025-04-14',
      features: ['completion'],
      costPer1K: 0.02
    }]
  ]);

  static getModel(modelName: string): ModelInfo | undefined {
    return this.models.get(modelName);
  }

  static checkDeprecation(modelName: string): DeprecationCheck {
    const model = this.getModel(modelName);
    
    if (!model) {
      return {
        isDeprecated: false,
        warning: `Unknown model: ${modelName}. Consider using a recommended model.`
      };
    }

    if (model.deprecated) {
      return {
        isDeprecated: true,
        warning: `Model ${modelName} is deprecated. Please use ${model.replacement} instead.`,
        replacement: model.replacement
      };
    }

    return { isDeprecated: false };
  }

  static getRecommendedModels(provider: string = 'openai'): ModelInfo[] {
    return Array.from(this.models.values())
      .filter(model => model.provider === provider && !model.deprecated);
  }

  static estimateCost(modelName: string, tokens: number): number {
    const model = this.getModel(modelName);
    if (!model || !model.costPer1K) {
      return 0;
    }
    return (tokens / 1000) * model.costPer1K;
  }
}