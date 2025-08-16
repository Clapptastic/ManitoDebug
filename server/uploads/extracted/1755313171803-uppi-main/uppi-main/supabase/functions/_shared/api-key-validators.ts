/**
 * Centralized API key validation utilities
 */

import type { ApiKeyValidationResult } from './api-key-types.ts';

/**
 * Timeout wrapper for validation requests
 */
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 8000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Validation timeout')), timeoutMs)
    )
  ]);
}

/**
 * Validate OpenAI API key
 */
export async function validateOpenAI(apiKey: string): Promise<ApiKeyValidationResult> {
  const startTime = Date.now();
  
  try {
    const response = await withTimeout(
      fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      })
    );

    const responseTime = Date.now() - startTime;

    if (response.ok) {
      const data = await response.json();
      return {
        isValid: true,
        provider: 'openai',
        details: {
          responseTime,
          statusCode: response.status,
          endpoint: '/v1/models',
          modelsCount: data.data?.length || 0
        }
      };
    } else {
      return {
        isValid: false,
        provider: 'openai',
        error: `OpenAI API error: ${response.status}`,
        details: { responseTime, statusCode: response.status }
      };
    }
  } catch (error) {
    return {
      isValid: false,
      provider: 'openai',
      error: error instanceof Error ? error.message : 'Unknown error',
      details: { responseTime: Date.now() - startTime }
    };
  }
}

/**
 * Validate Anthropic API key
 */
export async function validateAnthropic(apiKey: string): Promise<ApiKeyValidationResult> {
  const startTime = Date.now();

  try {
    const response = await withTimeout(
      fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'test' }]
        })
      })
    );

    const responseTime = Date.now() - startTime;
    const isValid = response.status !== 401 && response.status !== 403;

    return {
      isValid,
      provider: 'anthropic',
      error: !isValid ? `Invalid Anthropic API key: ${response.status}` : undefined,
      details: {
        responseTime,
        statusCode: response.status,
        endpoint: '/v1/messages'
      }
    };
  } catch (error) {
    return {
      isValid: false,
      provider: 'anthropic',
      error: error instanceof Error ? error.message : 'Unknown error',
      details: { responseTime: Date.now() - startTime }
    };
  }
}

/**
 * Validate Gemini API key
 */
export async function validateGemini(apiKey: string): Promise<ApiKeyValidationResult> {
  const startTime = Date.now();

  try {
    const response = await withTimeout(
      fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
    );

    const responseTime = Date.now() - startTime;

    if (response.ok) {
      const data = await response.json();
      return {
        isValid: true,
        provider: 'gemini',
        details: {
          responseTime,
          statusCode: response.status,
          endpoint: '/v1beta/models',
          modelsCount: data.models?.length || 0
        }
      };
    } else {
      return {
        isValid: false,
        provider: 'gemini',
        error: `Gemini API error: ${response.status}`,
        details: { responseTime, statusCode: response.status }
      };
    }
  } catch (error) {
    return {
      isValid: false,
      provider: 'gemini',
      error: error instanceof Error ? error.message : 'Unknown error',
      details: { responseTime: Date.now() - startTime }
    };
  }
}

/**
 * Validate Perplexity API key
 */
export async function validatePerplexity(apiKey: string): Promise<ApiKeyValidationResult> {
  const startTime = Date.now();

  try {
    const response = await withTimeout(
      fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 1
        })
      })
    );

    const responseTime = Date.now() - startTime;
    const isValid = response.status !== 401 && response.status !== 403;

    return {
      isValid,
      provider: 'perplexity',
      error: !isValid ? `Invalid Perplexity API key: ${response.status}` : undefined,
      details: {
        responseTime,
        statusCode: response.status,
        endpoint: '/chat/completions'
      }
    };
  } catch (error) {
    return {
      isValid: false,
      provider: 'perplexity',
      error: error instanceof Error ? error.message : 'Unknown error',
      details: { responseTime: Date.now() - startTime }
    };
  }
}

/**
 * Validate other providers with simpler endpoints
 */
const providerEndpoints: Record<string, { url: string; method: 'GET' | 'POST'; headers: (key: string) => Record<string, string> }> = {
  groq: {
    url: 'https://api.groq.com/openai/v1/models',
    method: 'GET',
    headers: (key) => ({ 'Authorization': `Bearer ${key}` })
  },
  mistral: {
    url: 'https://api.mistral.ai/v1/models',
    method: 'GET', 
    headers: (key) => ({ 'Authorization': `Bearer ${key}` })
  },
  serpapi: {
    url: (key: string) => `https://serpapi.com/account?api_key=${key}`,
    method: 'GET',
    headers: () => ({})
  },
  cohere: {
    url: 'https://api.cohere.ai/v1/models',
    method: 'GET',
    headers: (key) => ({ 'Authorization': `Bearer ${key}` })
  },
  huggingface: {
    url: 'https://huggingface.co/api/whoami',
    method: 'GET',
    headers: (key) => ({ 'Authorization': `Bearer ${key}` })
  }
};

async function validateGenericProvider(provider: string, apiKey: string): Promise<ApiKeyValidationResult> {
  const config = providerEndpoints[provider];
  if (!config) {
    return {
      isValid: false,
      provider,
      error: `Unsupported provider: ${provider}`
    };
  }

  const startTime = Date.now();

  try {
    const url = typeof config.url === 'function' ? config.url(apiKey) : config.url;
    const response = await withTimeout(
      fetch(url, {
        method: config.method,
        headers: config.headers(apiKey)
      })
    );

    const responseTime = Date.now() - startTime;
    const isValid = response.ok;

    return {
      isValid,
      provider,
      error: !isValid ? `${provider} API error: ${response.status}` : undefined,
      details: {
        responseTime,
        statusCode: response.status,
        endpoint: url
      }
    };
  } catch (error) {
    return {
      isValid: false,
      provider,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: { responseTime: Date.now() - startTime }
    };
  }
}

/**
 * Main validation function
 */
export async function validateApiKey(provider: string, apiKey: string): Promise<ApiKeyValidationResult> {
  console.log(`Validating ${provider} API key...`);

  switch (provider.toLowerCase()) {
    case 'openai':
      return validateOpenAI(apiKey);
    case 'anthropic':
      return validateAnthropic(apiKey);
    case 'gemini':
    case 'google':
      return validateGemini(apiKey);
    case 'perplexity':
      return validatePerplexity(apiKey);
    case 'groq':
    case 'mistral':
    case 'serpapi':
    case 'cohere':
    case 'huggingface':
      return validateGenericProvider(provider.toLowerCase(), apiKey);
    default:
      return {
        isValid: false,
        provider,
        error: `Unsupported provider: ${provider}`
      };
  }
}