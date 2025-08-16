/**
 * Server-side Rate Limiting Edge Function
 * Provides centralized, persistent rate limiting across the application
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { corsHeaders } from '../_shared/cors.ts';
import { logInfo, logWarn, logError } from '../_shared/logging.ts';

// Rate limit configurations
const RATE_LIMITS = {
  // API endpoints
  'api-call': { requests: 100, windowMs: 60000 }, // 100 req/min
  'api-key-validation': { requests: 50, windowMs: 60000 }, // 50 req/min
  'competitor-analysis': { requests: 10, windowMs: 60000 }, // 10 req/min
  
  // User actions
  'login-attempt': { requests: 5, windowMs: 300000 }, // 5 attempts/5min
  'password-reset': { requests: 3, windowMs: 3600000 }, // 3 attempts/hour
  'profile-update': { requests: 10, windowMs: 60000 }, // 10 updates/min
  
  // Admin actions
  'admin-action': { requests: 200, windowMs: 60000 }, // 200 req/min
  'bulk-operation': { requests: 5, windowMs: 300000 }, // 5 ops/5min
  
  // Default fallback
  'default': { requests: 60, windowMs: 60000 }, // 60 req/min
} as const;

interface RateLimitRequest {
  identifier: string; // user_id, ip_address, or api_key
  operation: string;
  metadata?: Record<string, any>;
}

interface RateLimitResponse {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  limit: number;
  windowMs: number;
}

// In-memory store for rate limits (consider Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Check if request is within rate limits
 */
function checkRateLimit(
  identifier: string,
  operation: string
): RateLimitResponse {
  const config = RATE_LIMITS[operation as keyof typeof RATE_LIMITS] || RATE_LIMITS.default;
  const key = `${identifier}:${operation}`;
  const now = Date.now();
  
  // Get or initialize rate limit data
  let limitData = rateLimitStore.get(key);
  
  if (!limitData || limitData.resetTime <= now) {
    // Initialize or reset window
    limitData = {
      count: 0,
      resetTime: now + config.windowMs,
    };
  }
  
  // Check if limit exceeded
  const allowed = limitData.count < config.requests;
  
  if (allowed) {
    limitData.count++;
    rateLimitStore.set(key, limitData);
  }
  
  return {
    allowed,
    remaining: Math.max(0, config.requests - limitData.count),
    resetTime: limitData.resetTime,
    limit: config.requests,
    windowMs: config.windowMs,
  };
}

/**
 * Clean up expired rate limit entries
 */
function cleanupExpiredEntries() {
  const now = Date.now();
  
  for (const [key, data] of rateLimitStore.entries()) {
    if (data.resetTime <= now) {
      rateLimitStore.delete(key);
    }
  }
}

// Cleanup every 5 minutes
setInterval(cleanupExpiredEntries, 300000);

/**
 * Get client identifier from request
 */
function getClientIdentifier(request: Request, user_id?: string): string {
  // Prefer authenticated user ID
  if (user_id) {
    return `user:${user_id}`;
  }
  
  // Fall back to IP address
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  const ip = forwarded?.split(',')[0] || realIp || cfConnectingIp || 'unknown';
  return `ip:${ip}`;
}

/**
 * Validate request body
 */
function validateRequest(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.identifier || typeof data.identifier !== 'string') {
    errors.push('identifier is required and must be a string');
  }
  
  if (!data.operation || typeof data.operation !== 'string') {
    errors.push('operation is required and must be a string');
  }
  
  if (data.operation && !RATE_LIMITS[data.operation as keyof typeof RATE_LIMITS] && data.operation !== 'default') {
    logWarn(`Unknown operation: ${data.operation}`, { operation: data.operation });
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Create rate limit headers for response
 */
function createRateLimitHeaders(result: RateLimitResponse): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
    'X-RateLimit-Window': result.windowMs.toString(),
    'Retry-After': result.allowed ? '0' : Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
  };
}

/**
 * Main request handler
 */
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }
  
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get user from auth header if provided
    const authHeader = req.headers.get('authorization');
    let user_id: string | undefined;
    
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
        user_id = user?.id;
      } catch (error) {
        logWarn('Failed to authenticate user for rate limiting', { error: error.message });
      }
    }
    
    // Parse request body
    let requestData: RateLimitRequest;
    try {
      requestData = await req.json();
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Validate request
    const validation = validateRequest(requestData);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ 
          error: 'Validation failed',
          details: validation.errors 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Use provided identifier or derive from request
    const identifier = requestData.identifier || getClientIdentifier(req, user_id);
    
    logInfo('Rate limit check', {
      identifier,
      operation: requestData.operation,
      user_id,
    });
    
    // Check rate limit
    const result = checkRateLimit(identifier, requestData.operation);
    
    const headers = {
      ...corsHeaders,
      'Content-Type': 'application/json',
      ...createRateLimitHeaders(result),
    };
    
    const responseData = {
      allowed: result.allowed,
      remaining: result.remaining,
      resetTime: result.resetTime,
      limit: result.limit,
      windowMs: result.windowMs,
    };
    
    if (!result.allowed) {
      logWarn('Rate limit exceeded', {
        identifier,
        operation: requestData.operation,
        limit: result.limit,
        remaining: result.remaining,
      });
      
      return new Response(
        JSON.stringify({
          ...responseData,
          error: 'Rate limit exceeded',
          message: `Too many requests. Limit: ${result.limit} per ${Math.round(result.windowMs / 1000)}s`,
        }),
        { 
          status: 429, 
          headers 
        }
      );
    }
    
    logInfo('Rate limit check passed', {
      identifier,
      operation: requestData.operation,
      remaining: result.remaining,
    });
    
    return new Response(
      JSON.stringify(responseData),
      { 
        status: 200, 
        headers 
      }
    );
    
  } catch (error) {
    logError(error, 'Rate limiter error');
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: 'Rate limiting service temporarily unavailable',
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});