/**
 * Input Validation and Sanitization for API Key Operations
 */

import { z } from 'https://deno.land/x/zod@v3.16.1/mod.ts';

// Define valid API providers
export const API_PROVIDERS = [
  'openai',
  'anthropic', 
  'google',
  'perplexity',
  'groq',
  'mistral',
  'serpapi'
] as const;

export type ApiProvider = typeof API_PROVIDERS[number];

// Validation schemas
export const ApiKeySchema = z.object({
  provider: z.enum(API_PROVIDERS),
  apiKey: z.string()
    .min(20, 'API key must be at least 20 characters')
    .max(200, 'API key must be less than 200 characters')
    .regex(/^[a-zA-Z0-9\-_\.]+$/, 'API key contains invalid characters'),
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .optional(),
  organizationId: z.string().uuid().optional(),
});

export const ApiKeyUpdateSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .optional(),
  isActive: z.boolean().optional(),
  permissions: z.array(z.enum(['read', 'write'])).optional(),
});

export const ApiKeyValidationSchema = z.object({
  provider: z.enum(API_PROVIDERS),
  apiKey: z.string().min(20).max(200),
});

// Rate limiting configuration
const RATE_LIMITS = {
  api_key_create: { requests: 5, window: 60 }, // 5 requests per minute
  api_key_validate: { requests: 10, window: 60 }, // 10 requests per minute
  api_key_list: { requests: 30, window: 60 }, // 30 requests per minute
};

/**
 * Sanitize user input to prevent XSS and other attacks
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>\"'&]/g, '') // Remove potential HTML/script characters
    .trim()
    .substring(0, 1000); // Limit length
}

/**
 * Validate API key creation request
 */
export function validateApiKeyCreation(data: unknown): {
  success: boolean;
  data?: z.infer<typeof ApiKeySchema>;
  errors?: string[];
} {
  try {
    const result = ApiKeySchema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      };
    }
    return { success: false, errors: ['Invalid input format'] };
  }
}

/**
 * Validate API key update request
 */
export function validateApiKeyUpdate(data: unknown): {
  success: boolean;
  data?: z.infer<typeof ApiKeyUpdateSchema>;
  errors?: string[];
} {
  try {
    const result = ApiKeyUpdateSchema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      };
    }
    return { success: false, errors: ['Invalid input format'] };
  }
}

/**
 * Validate API key for external validation
 */
export function validateApiKeyValidation(data: unknown): {
  success: boolean;
  data?: z.infer<typeof ApiKeyValidationSchema>;
  errors?: string[];
} {
  try {
    const result = ApiKeyValidationSchema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      };
    }
    return { success: false, errors: ['Invalid input format'] };
  }
}

/**
 * Rate limiting implementation using in-memory store
 * In production, this should use Redis or similar persistent store
 */
class RateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map();

  isAllowed(key: string, operation: keyof typeof RATE_LIMITS): boolean {
    const limit = RATE_LIMITS[operation];
    const now = Date.now();
    const windowStart = now - (limit.window * 1000);

    const existing = this.requests.get(key);
    
    if (!existing || existing.resetTime < windowStart) {
      // Reset or initialize
      this.requests.set(key, { count: 1, resetTime: now });
      return true;
    }

    if (existing.count >= limit.requests) {
      return false;
    }

    existing.count++;
    return true;
  }

  getRemainingRequests(key: string, operation: keyof typeof RATE_LIMITS): number {
    const limit = RATE_LIMITS[operation];
    const existing = this.requests.get(key);
    
    if (!existing) {
      return limit.requests;
    }

    return Math.max(0, limit.requests - existing.count);
  }
}

export const rateLimiter = new RateLimiter();

/**
 * Check rate limit for a user and operation
 */
export function checkRateLimit(
  userId: string, 
  operation: keyof typeof RATE_LIMITS
): { allowed: boolean; remaining: number; resetTime?: number } {
  const key = `${userId}:${operation}`;
  const allowed = rateLimiter.isAllowed(key, operation);
  const remaining = rateLimiter.getRemainingRequests(key, operation);
  
  return {
    allowed,
    remaining,
    resetTime: allowed ? undefined : Date.now() + (RATE_LIMITS[operation].window * 1000)
  };
}

/**
 * Validate request headers for security
 */
export function validateRequestHeaders(headers: Headers): {
  valid: boolean;
  errors?: string[];
} {
  const errors: string[] = [];
  
  // Check Content-Type for POST requests
  const contentType = headers.get('content-type');
  if (contentType && !contentType.includes('application/json')) {
    errors.push('Invalid content type. Expected application/json');
  }
  
  // Check for required auth header
  const authHeader = headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    errors.push('Missing or invalid authorization header');
  }
  
  // Check for suspicious headers
  const suspiciousHeaders = ['x-forwarded-host', 'x-real-ip'];
  for (const header of suspiciousHeaders) {
    if (headers.get(header)) {
      console.warn(`Suspicious header detected: ${header}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Sanitize and validate organization ID
 */
export function validateOrganizationId(orgId: unknown): string | null {
  if (typeof orgId !== 'string') {
    return null;
  }
  
  const sanitized = sanitizeInput(orgId);
  return isValidUUID(sanitized) ? sanitized : null;
}