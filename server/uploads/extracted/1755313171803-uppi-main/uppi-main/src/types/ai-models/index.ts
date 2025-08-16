
import { LucideIcon } from 'lucide-react';

export interface AIModelCapability {
  name: string;
  description: string;
  details?: string;
}

export interface AIModelConfig {
  name: string;
  title: string;
  description: string;
  icon: LucideIcon;
  apiKeyType: string;
  capabilities: string[];
  apiDocumentation?: string;
  costPerToken?: number;
  maxTokens?: number;
  averageResponseTime?: number;
  contextWindow?: number;
  embeddingsSupport?: boolean;
  streamingSupport?: boolean;
  systemPromptSupport?: boolean;
  availableModels?: string[];
  defaultModel?: string;
}

export interface AIModelUsage {
  provider: string;
  model: string;
  tokensUsed: number;
  cost: number;
  timestamp: string;
}

export interface AIModelStatus {
  provider: string;
  isAvailable: boolean;
  latency?: number;
  lastChecked: string;
  error?: string;
}
