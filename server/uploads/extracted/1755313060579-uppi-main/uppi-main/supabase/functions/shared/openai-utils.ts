// OpenAI API utilities following latest documentation best practices
import { AIModelRegistry } from './model-registry.ts';

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAICompletionRequest {
  model: string;
  messages: OpenAIMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stream?: boolean;
}

export interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export const RECOMMENDED_MODELS = {
  FLAGSHIP: 'gpt-4.1-2025-04-14',
  REASONING: 'o3-2025-04-16',
  FAST_REASONING: 'o4-mini-2025-04-16',
  VISION: 'gpt-4.1-mini-2025-04-14',
  LEGACY_VISION: 'gpt-4o'
} as const;

export const DEPRECATED_MODELS = [
  'text-davinci-003',
  'text-davinci-002',
  'gpt-4',
  'gpt-4-vision-preview'
] as const;

export class OpenAIClient {
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1';

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }
    this.apiKey = apiKey;
  }

  async createChatCompletion(request: OpenAICompletionRequest): Promise<OpenAIResponse> {
    // Check for deprecated models and use replacement
    const deprecationCheck = AIModelRegistry.checkDeprecation(request.model);
    let modelToUse = request.model;
    
    if (deprecationCheck.isDeprecated && deprecationCheck.replacement) {
      console.warn(`⚠️ ${deprecationCheck.warning}`);
      modelToUse = deprecationCheck.replacement;
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Supabase-Edge-Function/1.0'
      },
      body: JSON.stringify({
        ...request,
        model: modelToUse || RECOMMENDED_MODELS.FLAGSHIP
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
      throw new Error(`OpenAI API error (${response.status}): ${error.error?.message || 'Request failed'}`);
    }

    return await response.json();
  }

  async validateApiKey(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async createEmbedding(input: string | string[], model = 'text-embedding-3-small'): Promise<any> {
    const response = await fetch(`${this.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        input,
        encoding_format: 'float'
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
      throw new Error(`OpenAI Embeddings API error: ${error.error?.message || 'Request failed'}`);
    }

    return await response.json();
  }
}