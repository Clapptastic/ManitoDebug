export interface ModelVersion {
  id: string;
  provider: string;
  modelName: string;
  currentVersion: string;
  latestVersion?: string;
  status: 'current' | 'outdated' | 'deprecated' | 'discontinued';
  deprecationDate?: string;
  replacementModel?: string;
  capabilities: ModelCapability[];
  pricing: ModelPricing;
  limits: ModelLimits;
  lastChecked: string;
  metadata?: {
    description?: string;
    use_cases?: string[];
    [key: string]: any;
  };
}

export interface ModelCapability {
  type: 'text' | 'vision' | 'function_calling' | 'streaming' | 'embeddings';
  supported: boolean;
  notes?: string;
}

export interface ModelPricing {
  inputTokenPrice: number;
  outputTokenPrice: number;
  currency: 'USD';
  per1kTokens: boolean;
}

export interface ModelLimits {
  maxTokens: number;
  contextWindow: number;
  requestsPerMinute?: number;
  tokensPerMinute?: number;
}

export interface ModelSettings {
  provider: string;
  selectedModel: string;
  enabled: boolean;
  priority: number;
  customSettings?: Record<string, any>;
}

export interface DeprecationWarning {
  id: string;
  provider: string;
  modelName: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  deprecationDate: string;
  replacementModel?: string;
  actionRequired: boolean;
  dismissed: boolean;
}

export type ModelProvider = 'openai' | 'anthropic' | 'gemini' | 'perplexity' | 'cohere' | 'huggingface';

export interface ModelManagementState {
  models: ModelVersion[];
  settings: Record<string, ModelSettings>;
  warnings: DeprecationWarning[];
  loading: boolean;
  lastUpdated: string;
}