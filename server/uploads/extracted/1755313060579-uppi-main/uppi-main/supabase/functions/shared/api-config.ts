
export type ApiProvider = 'openai' | 'anthropic' | 'gemini' | 'perplexity';

interface ApiConfig {
  BASE_URL: string;
  DEFAULT_PARAMS: Record<string, any>;
}

export const API_CONFIG: Record<string, ApiConfig> = {
  OPENAI: {
    BASE_URL: 'https://api.openai.com/v1',
    DEFAULT_PARAMS: {
      model: 'gpt-4.1-2025-04-14',
      temperature: 0.7,
      max_tokens: 1000
    }
  },
  ANTHROPIC: {
    BASE_URL: 'https://api.anthropic.com/v1',
    DEFAULT_PARAMS: {
      model: 'claude-sonnet-4-20250514',
      temperature: 0.7,
      max_tokens: 1000
    }
  },
  PERPLEXITY: {
    BASE_URL: 'https://api.perplexity.ai',
    DEFAULT_PARAMS: {
      model: 'llama-3.1-sonar-large-128k-online',
      temperature: 0.2,
      max_tokens: 1000
    }
  },
  GEMINI: {
    BASE_URL: 'https://generativelanguage.googleapis.com/v1beta',
    DEFAULT_PARAMS: {
      model: 'gemini-1.5-pro',
      temperature: 0.7,
      maxOutputTokens: 1000
    }
  }
};
