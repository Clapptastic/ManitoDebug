/**
 * Frontend Input Validation Utilities
 * Complements backend validation with client-side checks
 */

import { z } from 'zod';
import { ApiKeyType } from '@/types/api-keys';

// API providers for validation
const API_PROVIDERS = [
  'openai',
  'anthropic', 
  'google',
  'perplexity',
  'groq',
  'mistral',
  'serpapi'
] as const;

// Validation schemas matching backend
export const ApiKeyCreationSchema = z.object({
  provider: z.enum(API_PROVIDERS),
  apiKey: z.string()
    .min(20, 'API key must be at least 20 characters')
    .max(200, 'API key must be less than 200 characters')
    .regex(/^[a-zA-Z0-9\-_\.]+$/, 'API key contains invalid characters'),
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .optional(),
});

export const ApiKeyUpdateSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .optional(),
  isActive: z.boolean().optional(),
});

/**
 * Validate API key format for different providers
 */
export function validateApiKeyFormat(provider: ApiKeyType, apiKey: string): {
  valid: boolean;
  error?: string;
} {
  const patterns = {
    openai: /^sk-[a-zA-Z0-9]{32,}$/,
    anthropic: /^sk-ant-[a-zA-Z0-9\-_]{32,}$/,
    google: /^[a-zA-Z0-9\-_]{32,}$/,
    perplexity: /^pplx-[a-zA-Z0-9]{32,}$/,
    groq: /^gsk_[a-zA-Z0-9]{32,}$/,
    mistral: /^[a-zA-Z0-9]{32,}$/,
    serpapi: /^[a-zA-Z0-9]{32,}$/
  };

  const pattern = patterns[provider];
  if (!pattern) {
    return {
      valid: apiKey.length >= 20,
      error: apiKey.length < 20 ? 'API key too short' : undefined
    };
  }

  const valid = pattern.test(apiKey);
  return {
    valid,
    error: valid ? undefined : `Invalid ${provider} API key format`
  };
}

/**
 * Sanitize user input on frontend
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>\"'&]/g, '') // Remove potential HTML/script characters
    .trim()
    .substring(0, 1000); // Limit length
}

/**
 * Validate and format API key name
 */
export function validateApiKeyName(name: string): {
  valid: boolean;
  sanitized: string;
  error?: string;
} {
  const sanitized = sanitizeInput(name);
  
  if (!sanitized) {
    return { valid: false, sanitized: '', error: 'Name is required' };
  }
  
  if (sanitized.length > 100) {
    return { valid: false, sanitized, error: 'Name must be less than 100 characters' };
  }
  
  return { valid: true, sanitized };
}

/**
 * Client-side rate limiting check
 */
class ClientRateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  isAllowed(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    let timestamps = this.requests.get(key) || [];
    
    // Remove old timestamps
    timestamps = timestamps.filter(timestamp => timestamp > windowStart);
    
    if (timestamps.length >= maxRequests) {
      return false;
    }
    
    timestamps.push(now);
    this.requests.set(key, timestamps);
    return true;
  }
}

export const clientRateLimiter = new ClientRateLimiter();

/**
 * Check if user can perform API key operation (client-side)
 */
export function canPerformApiKeyOperation(operation: string): boolean {
  const limits = {
    create: { requests: 5, window: 60000 }, // 5 per minute
    validate: { requests: 10, window: 60000 }, // 10 per minute
    update: { requests: 20, window: 60000 }, // 20 per minute
  };
  
  const limit = limits[operation as keyof typeof limits];
  if (!limit) return true;
  
  return clientRateLimiter.isAllowed(
    `api_key_${operation}`,
    limit.requests,
    limit.window
  );
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}