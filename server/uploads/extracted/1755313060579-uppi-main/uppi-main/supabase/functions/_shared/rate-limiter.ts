/**
 * Rate limiting utilities for edge functions
 */

export interface RateLimitConfig {
  requests: number;
  windowMs: number;
  keyGenerator?: (req: Request) => string;
}

// In-memory store for rate limiting (simple implementation)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Simple rate limiter
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = identifier;
  
  // Clean up expired entries periodically
  if (Math.random() < 0.01) { // 1% chance to clean up
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetTime < now) {
        rateLimitStore.delete(k);
      }
    }
  }

  const existing = rateLimitStore.get(key);
  
  if (!existing || existing.resetTime < now) {
    // First request or window expired
    const resetTime = now + config.windowMs;
    rateLimitStore.set(key, { count: 1, resetTime });
    return {
      allowed: true,
      remaining: config.requests - 1,
      resetTime
    };
  }

  if (existing.count >= config.requests) {
    // Rate limit exceeded
    return {
      allowed: false,
      remaining: 0,
      resetTime: existing.resetTime
    };
  }

  // Increment count
  existing.count++;
  rateLimitStore.set(key, existing);
  
  return {
    allowed: true,
    remaining: config.requests - existing.count,
    resetTime: existing.resetTime
  };
}

/**
 * Create rate limit headers
 */
export function createRateLimitHeaders(
  result: { remaining: number; resetTime: number }
): Record<string, string> {
  return {
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString()
  };
}

/**
 * Default rate limit configurations
 */
export const RATE_LIMITS = {
  API_KEYS: { requests: 10, windowMs: 60000 }, // 10 requests per minute
  AI_CHAT: { requests: 50, windowMs: 60000 }, // 50 requests per minute
  ANALYSIS: { requests: 5, windowMs: 60000 }, // 5 requests per minute
  VALIDATION: { requests: 20, windowMs: 60000 } // 20 requests per minute
};