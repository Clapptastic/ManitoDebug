/**
 * Enhanced API Key Error Handler
 * Provides specific error messages and user guidance for API key related issues
 */

export interface ApiKeyErrorInfo {
  title: string;
  message: string;
  action?: string;
  showApiKeyWarning?: boolean;
  variant: 'destructive' | 'default';
}

export class ApiKeyErrorHandler {
  /**
   * Analyzes an error and provides appropriate user feedback
   */
  static handleApiKeyError(error: any, provider?: string): ApiKeyErrorInfo {
    const errorMessage = error?.message || error?.toString() || 'Unknown error';
    const providerName = provider ? provider.charAt(0).toUpperCase() + provider.slice(1) : 'API';

    // Invalid API key format
    if (errorMessage.includes('Invalid') && errorMessage.includes('API key format')) {
      return {
        title: 'Invalid API Key Format',
        message: `The ${providerName} API key format is incorrect. Please check your key and try again.`,
        action: 'Verify the key format matches the provider requirements.',
        showApiKeyWarning: true,
        variant: 'destructive'
      };
    }

    // Authentication/Authorization errors
    if (errorMessage.includes('401') || errorMessage.includes('unauthorized') || 
        errorMessage.includes('invalid_api_key') || errorMessage.includes('authentication failed')) {
      return {
        title: 'Invalid API Key',
        message: `Your ${providerName} API key is invalid or has been revoked.`,
        action: 'Please check your API key in Settings and ensure it\'s correct.',
        showApiKeyWarning: true,
        variant: 'destructive'
      };
    }

    // Missing API keys
    if (errorMessage.includes('Missing required API keys') || errorMessage.includes('API key not configured')) {
      return {
        title: 'Missing API Keys',
        message: 'Required API keys are not configured.',
        action: 'Please add your API keys in Settings before proceeding.',
        showApiKeyWarning: true,
        variant: 'destructive'
      };
    }

    // Rate limiting
    if (errorMessage.includes('rate limit') || errorMessage.includes('429') || 
        errorMessage.includes('quota') || errorMessage.includes('too many requests')) {
      return {
        title: 'API Rate Limit Exceeded',
        message: `${providerName} rate limit or quota exceeded.`,
        action: 'Please wait a few minutes before trying again.',
        showApiKeyWarning: false,
        variant: 'destructive'
      };
    }

    // Network errors
    if (errorMessage.includes('network') || errorMessage.includes('fetch failed') || 
        errorMessage.includes('connection') || errorMessage.includes('timeout')) {
      return {
        title: 'Network Error',
        message: 'Unable to connect to the API provider.',
        action: 'Please check your internet connection and try again.',
        showApiKeyWarning: false,
        variant: 'destructive'
      };
    }

    // Validation failures
    if (errorMessage.includes('validation failed') || errorMessage.includes('key validation')) {
      return {
        title: 'API Key Validation Failed',
        message: `${providerName} API key validation failed.`,
        action: 'Please verify your API key is correct and has the required permissions.',
        showApiKeyWarning: true,
        variant: 'destructive'
      };
    }

    // Server errors (5xx)
    if (errorMessage.includes('500') || errorMessage.includes('502') || 
        errorMessage.includes('503') || errorMessage.includes('server error')) {
      return {
        title: 'API Server Error',
        message: `${providerName} is experiencing server issues.`,
        action: 'This is a temporary issue. Please try again in a few minutes.',
        showApiKeyWarning: false,
        variant: 'destructive'
      };
    }

    // Generic API key related errors
    if (errorMessage.toLowerCase().includes('api key')) {
      return {
        title: 'API Key Issue',
        message: `There's an issue with your ${providerName} API key.`,
        action: 'Please check your API key configuration in Settings.',
        showApiKeyWarning: true,
        variant: 'destructive'
      };
    }

    // Fallback for unknown errors
    return {
      title: 'API Error',
      message: errorMessage || 'An unexpected error occurred.',
      action: 'Please try again or contact support if the issue persists.',
      showApiKeyWarning: false,
      variant: 'destructive'
    };
  }

  /**
   * Checks if an error is related to API keys
   */
  static isApiKeyError(error: any): boolean {
    const errorMessage = error?.message || error?.toString() || '';
    
    return errorMessage.toLowerCase().includes('api key') ||
           errorMessage.includes('401') ||
           errorMessage.includes('unauthorized') ||
           errorMessage.includes('authentication') ||
           errorMessage.includes('invalid_api_key') ||
           errorMessage.includes('validation failed');
  }

  /**
   * Gets provider-specific error guidance
   */
  static getProviderGuidance(provider: string): string {
    const guidance: Record<string, string> = {
      openai: 'OpenAI keys start with "sk-" or "sk-proj-". Get yours at https://platform.openai.com/api-keys',
      anthropic: 'Anthropic keys start with "sk-ant-". Get yours at https://console.anthropic.com/account/keys',
      perplexity: 'Perplexity keys start with "pplx-". Get yours at https://www.perplexity.ai/settings/api',
      gemini: 'Gemini keys start with "AIza". Get yours at https://aistudio.google.com/app/apikey',
      google: 'Google API keys start with "AIza". Get yours at https://console.developers.google.com/',
      groq: 'Groq keys start with "gsk_". Get yours at https://console.groq.com/keys',
      mistral: 'Mistral API keys can be obtained at https://console.mistral.ai/',
      cohere: 'Cohere API keys can be obtained at https://dashboard.cohere.ai/api-keys'
    };

    return guidance[provider.toLowerCase()] || 'Check your API provider\'s documentation for the correct key format.';
  }
}