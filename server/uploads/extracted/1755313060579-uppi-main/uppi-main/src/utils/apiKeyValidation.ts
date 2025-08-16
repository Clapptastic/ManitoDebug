/**
 * API Key Validation Utilities
 * Comprehensive validation for all supported API key formats
 */

export type ApiKeyProvider = 
  | 'openai' 
  | 'anthropic' 
  | 'gemini' 
  | 'perplexity' 
  | 'serpapi' 
  | 'mistral'
  | 'groq'
  | 'cohere'
  | 'huggingface'
  | 'newsapi'
  | 'alphavantage';

/**
 * Validate API key format based on provider
 */
export function validateApiKeyFormat(provider: ApiKeyProvider, apiKey: string): boolean {
  if (!apiKey || typeof apiKey !== 'string') {
    return false;
  }

  const trimmedKey = apiKey.trim();

  switch (provider) {
    case 'openai':
      // OpenAI keys: sk-... (legacy) or sk-proj-... (project-based)
      return (trimmedKey.startsWith('sk-') && trimmedKey.length >= 20) ||
             (trimmedKey.startsWith('sk-proj-') && trimmedKey.length >= 30);

    case 'anthropic':
      // Anthropic keys: sk-ant-...
      return trimmedKey.startsWith('sk-ant-') && trimmedKey.length >= 20;

    case 'gemini':
      // Google AI Studio keys: typically 40+ characters, alphanumeric
      return trimmedKey.length >= 30 && /^[A-Za-z0-9_-]+$/.test(trimmedKey);

    case 'perplexity':
      // Perplexity keys: pplx-...
      return trimmedKey.startsWith('pplx-') && trimmedKey.length >= 20;

    case 'serpapi':
      // SerpAPI keys: alphanumeric, typically 32-64 characters
      return trimmedKey.length >= 32 && /^[A-Za-z0-9]+$/.test(trimmedKey);

    case 'mistral':
      // Mistral keys: alphanumeric with dashes/underscores
      return trimmedKey.length >= 20 && /^[A-Za-z0-9_-]+$/.test(trimmedKey);

    case 'groq':
      // Groq keys: gsk_...
      return trimmedKey.startsWith('gsk_') && trimmedKey.length >= 20;

    case 'cohere':
      // Cohere keys: long alphanumeric, sometimes with dashes
      return trimmedKey.length >= 30 && /^[A-Za-z0-9_-]+$/.test(trimmedKey);

    case 'huggingface':
      // Hugging Face tokens: hf_...
      return trimmedKey.startsWith('hf_') && trimmedKey.length >= 20;

    case 'newsapi':
      // NewsAPI keys: 32 alphanumeric characters
      return /^[A-Za-z0-9]{32}$/.test(trimmedKey);

    case 'alphavantage':
      // Alpha Vantage keys: 16 uppercase alphanumeric
      return /^[A-Z0-9]{16}$/.test(trimmedKey);

    default:
      return false;
  }
}

/**
 * Get human-readable format description for a provider
 */
export function getApiKeyFormatDescription(provider: ApiKeyProvider): string {
  switch (provider) {
    case 'openai':
      return 'OpenAI keys should start with "sk-" or "sk-proj-" and be at least 20 characters long';
    case 'anthropic':
      return 'Anthropic keys should start with "sk-ant-" and be at least 20 characters long';
    case 'gemini':
      return 'Google AI Studio (Gemini) keys should be at least 30 alphanumeric characters';
    case 'perplexity':
      return 'Perplexity keys should start with "pplx-" and be at least 20 characters long';
    case 'serpapi':
      return 'SerpAPI keys should be at least 32 alphanumeric characters';
    case 'mistral':
      return 'Mistral keys should be at least 20 alphanumeric characters';
    case 'groq':
      return 'Groq keys should start with "gsk_" and be at least 20 characters long';
    case 'cohere':
      return 'Cohere keys should be at least 30 alphanumeric characters';
    case 'huggingface':
      return 'Hugging Face tokens should start with "hf_" and be at least 20 characters long';
    case 'newsapi':
      return 'NewsAPI keys are 32 alphanumeric characters';
    case 'alphavantage':
      return 'Alpha Vantage keys are 16 uppercase alphanumeric characters';
    default:
      return 'Invalid provider specified';
  }
}

/**
 * Mask an API key for display purposes
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 8) {
    return '***';
  }
  
  const start = apiKey.substring(0, 3);
  const end = apiKey.substring(apiKey.length - 4);
  return `${start}...${end}`;
}

/**
 * Extract key prefix for identification
 */
export function getApiKeyPrefix(apiKey: string): string {
  if (!apiKey || apiKey.length < 4) {
    return '';
  }
  return apiKey.substring(0, 4);
}