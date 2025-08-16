import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { logApiMetrics } from '../shared/api-metrics.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

interface RateLimitRequest {
  operation: string;
  windowMs?: number;
  maxRequests?: number;
}

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(userId: string, windowMs = 60000, maxRequests = 10): boolean {
  const now = Date.now();
  const key = `${userId}:${Math.floor(now / windowMs)}`;
  
  const current = rateLimitStore.get(key) || { count: 0, resetTime: now + windowMs };
  
  if (current.count >= maxRequests) {
    return false;
  }
  
  current.count++;
  rateLimitStore.set(key, current);
  
  // Cleanup old entries
  for (const [k, v] of rateLimitStore.entries()) {
    if (v.resetTime < now) {
      rateLimitStore.delete(k);
    }
  }
  
  return true;
}

function validateInput(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data || typeof data !== 'object') {
    errors.push('Request body must be a valid JSON object');
    return { isValid: false, errors };
  }
  
  if (data.operation && typeof data.operation !== 'string') {
    errors.push('Operation must be a string');
  }
  
  if (data.windowMs && (typeof data.windowMs !== 'number' || data.windowMs < 1000 || data.windowMs > 3600000)) {
    errors.push('WindowMs must be a number between 1000 and 3600000');
  }
  
  if (data.maxRequests && (typeof data.maxRequests !== 'number' || data.maxRequests < 1 || data.maxRequests > 1000)) {
    errors.push('MaxRequests must be a number between 1 and 1000');
  }
  
  return { isValid: errors.length === 0, errors };
}

function sanitizeError(error: any): string {
  if (!error) return 'Unknown error';
  
  const message = error.message || error.toString();
  
  // Remove sensitive information
  return message
    .replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/g, '[REDACTED_TOKEN]')
    .replace(/sk-[A-Za-z0-9]{32,}/g, '[REDACTED_API_KEY]')
    .replace(/\b[A-Fa-f0-9]{64}\b/g, '[REDACTED_HASH]')
    .replace(/user_id\s*=\s*'[^']+'/g, "user_id='[REDACTED]'");
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const startTime = Date.now();
  let userId = 'unknown';
  
  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Authenticate user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('Authentication error:', sanitizeError(userError));
      await logApiMetrics('unknown', 'rate-limiter', startTime, 401);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    userId = user.id;

    // Global rate limiting for this endpoint
    if (!checkRateLimit(`global:rate-limiter`, 60000, 100)) {
      await logApiMetrics(userId, 'rate-limiter', startTime, 429);
      return new Response(
        JSON.stringify({ error: 'Global rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate request body
    let body: RateLimitRequest;
    try {
      const rawBody = await req.text();
      body = JSON.parse(rawBody);
    } catch (parseError) {
      await logApiMetrics(userId, 'rate-limiter', startTime, 400);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate input
    const validation = validateInput(body);
    if (!validation.isValid) {
      await logApiMetrics(userId, 'rate-limiter', startTime, 400);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input', 
          details: validation.errors 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { operation, windowMs = 60000, maxRequests = 10 } = body;

    // Check user-specific rate limit
    const allowed = checkRateLimit(`${userId}:${operation}`, windowMs, maxRequests);
    
    // Log the rate limit check
    await supabaseClient
      .from('audit_logs')
      .insert({
        user_id: userId,
        action: 'rate_limit_check',
        resource_type: 'security',
        metadata: {
          operation,
          allowed,
          windowMs,
          maxRequests,
          timestamp: new Date().toISOString()
        }
      });

    await logApiMetrics(userId, 'rate-limiter', startTime, 200);
    return new Response(
      JSON.stringify({ 
        allowed,
        operation,
        windowMs,
        maxRequests,
        resetTime: Date.now() + windowMs
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in rate limiter:', sanitizeError(error));
    await logApiMetrics(userId, 'rate-limiter', startTime, 500);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: sanitizeError(error)
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})