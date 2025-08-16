/**
 * Input validation utilities for edge functions
 */

export interface ValidationRule {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object';
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  enum?: string[];
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validate input data against schema
 */
export function validateInput(data: any, schema: ValidationSchema): void {
  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];

    // Check required fields
    if (rules.required && (value === undefined || value === null || value === '')) {
      throw new ValidationError(`Field '${field}' is required`, field);
    }

    // Skip validation for optional undefined fields
    if (value === undefined || value === null) {
      continue;
    }

    // Type validation
    if (rules.type) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== rules.type) {
        throw new ValidationError(`Field '${field}' must be of type ${rules.type}`, field);
      }
    }

    // String validations
    if (typeof value === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        throw new ValidationError(`Field '${field}' must be at least ${rules.minLength} characters`, field);
      }
      if (rules.maxLength && value.length > rules.maxLength) {
        throw new ValidationError(`Field '${field}' must be at most ${rules.maxLength} characters`, field);
      }
      if (rules.pattern && !rules.pattern.test(value)) {
        throw new ValidationError(`Field '${field}' format is invalid`, field);
      }
    }

    // Enum validation
    if (rules.enum && !rules.enum.includes(value)) {
      throw new ValidationError(`Field '${field}' must be one of: ${rules.enum.join(', ')}`, field);
    }
  }
}

/**
 * API Key format validation patterns
 */
export const API_KEY_PATTERNS = {
  openai: /^sk-(?:proj-)?[a-zA-Z0-9\-_]{20,}$/,
  anthropic: /^sk-ant-api03-[a-zA-Z0-9_-]{93}$/,
  perplexity: /^pplx-[a-f0-9]{56}$/,
  gemini: /^AIza[0-9A-Za-z_-]{35}$/,
  newsapi: /^[a-f0-9]{32}$/,
  serpapi: /^[a-f0-9]{64}$/,
  mistral: /^[a-zA-Z0-9]{32}$/,
  cohere: /^[a-zA-Z0-9_-]{40}$/,
  groq: /^gsk_[a-zA-Z0-9]{52}$/,
  huggingface: /^hf_[a-zA-Z0-9]{37}$/
};

/**
 * Validate API key format
 */
export function validateApiKeyFormat(provider: string, apiKey: string): boolean {
  const pattern = API_KEY_PATTERNS[provider as keyof typeof API_KEY_PATTERNS];
  if (!pattern) {
    throw new ValidationError(`Unsupported API provider: ${provider}`);
  }
  return pattern.test(apiKey);
}