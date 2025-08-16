/**
 * SHARED SECURITY UTILITIES FOR EDGE FUNCTIONS
 * Comprehensive security hardening for all edge functions
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Security configuration
const SECURITY_CONFIG = {
  MAX_REQUEST_SIZE: 1024 * 1024, // 1MB
  MAX_REQUESTS_PER_MINUTE: 60,
  SENSITIVE_HEADERS: ['authorization', 'x-api-key', 'cookie'],
  BLOCKED_USER_AGENTS: ['bot', 'crawler', 'spider'],
  RATE_LIMIT_WINDOW: 60 * 1000, // 1 minute
}

interface SecurityContext {
  user: any;
  isAuthenticated: boolean;
  isAdmin: boolean;
  userAgent: string;
  ipAddress: string;
  requestId: string;
}

interface RateLimitEntry {
  count: number;
  firstRequest: number;
  lastRequest: number;
}

// In-memory rate limiting (for demo - in production use Redis)
const rateLimitMap = new Map<string, RateLimitEntry>();

export class EdgeFunctionSecurity {
  private supabase: SupabaseClient;
  
  constructor(supabaseUrl: string, supabaseServiceKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  /**
   * Comprehensive request validation and authentication
   */
  async validateRequest(request: Request): Promise<SecurityContext> {
    const userAgent = request.headers.get('user-agent') || '';
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 'unknown';
    const requestId = crypto.randomUUID();

    // Check for blocked user agents
    if (this.isBlockedUserAgent(userAgent)) {
      throw new Error('SECURITY_BLOCKED_USER_AGENT');
    }

    // Validate request size
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      const contentLength = request.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > SECURITY_CONFIG.MAX_REQUEST_SIZE) {
        throw new Error('SECURITY_REQUEST_TOO_LARGE');
      }
    }

    // Rate limiting
    await this.checkRateLimit(ipAddress);

    // Authentication check
    const authHeader = request.headers.get('authorization');
    let user = null;
    let isAuthenticated = false;
    let isAdmin = false;

    if (authHeader) {
      try {
        const { data: { user: authUser }, error } = await this.supabase.auth.getUser(
          authHeader.replace('Bearer ', '')
        );
        
        if (!error && authUser) {
          user = authUser;
          isAuthenticated = true;
          
          // Check if user is admin
          const { data: roleData } = await this.supabase.rpc('get_user_role', {
            user_id_param: authUser.id
          });
          
          isAdmin = roleData && ['admin', 'super_admin'].includes(roleData);
        }
      } catch (error) {
        console.error('Authentication error:', error);
      }
    }

    // Log security event
    await this.logSecurityEvent({
      event_type: 'edge_function_access',
      user_id: user?.id,
      metadata: {
        user_agent: userAgent,
        ip_address: ipAddress,
        request_id: requestId,
        is_authenticated: isAuthenticated,
        is_admin: isAdmin,
        method: request.method,
        url: request.url
      }
    });

    return {
      user,
      isAuthenticated,
      isAdmin,
      userAgent,
      ipAddress,
      requestId
    };
  }

  /**
   * Sanitize and validate input data
   */
  sanitizeInput(data: any, allowedFields: string[] = []): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sanitized: any = {};
    
    for (const [key, value] of Object.entries(data)) {
      // Skip if field not in allowed list (if provided)
      if (allowedFields.length > 0 && !allowedFields.includes(key)) {
        continue;
      }

      // Basic XSS protection
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeString(value);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(item => 
          typeof item === 'string' ? this.sanitizeString(item) : item
        );
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Create secure response with proper headers
   */
  createSecureResponse(data: any, status: number = 200): Response {
    const secureHeaders = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    };

    return new Response(JSON.stringify(data), {
      status,
      headers: secureHeaders
    });
  }

  /**
   * Handle CORS preflight requests
   */
  handleCORS(): Response {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Max-Age': '86400',
      }
    });
  }

  /**
   * Log security events for monitoring
   */
  private async logSecurityEvent(event: {
    event_type: string;
    user_id?: string;
    metadata?: any;
  }) {
    try {
      await this.supabase.rpc('log_security_event', {
        user_id_param: event.user_id,
        event_type: event.event_type,
        resource_type: 'edge_function',
        metadata_param: event.metadata || {}
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  /**
   * Rate limiting implementation
   */
  private async checkRateLimit(identifier: string): Promise<void> {
    const now = Date.now();
    const entry = rateLimitMap.get(identifier);

    if (!entry) {
      rateLimitMap.set(identifier, {
        count: 1,
        firstRequest: now,
        lastRequest: now
      });
      return;
    }

    // Reset window if expired
    if (now - entry.firstRequest > SECURITY_CONFIG.RATE_LIMIT_WINDOW) {
      rateLimitMap.set(identifier, {
        count: 1,
        firstRequest: now,
        lastRequest: now
      });
      return;
    }

    // Check rate limit
    if (entry.count >= SECURITY_CONFIG.MAX_REQUESTS_PER_MINUTE) {
      throw new Error('SECURITY_RATE_LIMIT_EXCEEDED');
    }

    // Update counter
    entry.count++;
    entry.lastRequest = now;
    rateLimitMap.set(identifier, entry);
  }

  /**
   * Check for blocked user agents
   */
  private isBlockedUserAgent(userAgent: string): boolean {
    const lowerUA = userAgent.toLowerCase();
    return SECURITY_CONFIG.BLOCKED_USER_AGENTS.some(blocked => 
      lowerUA.includes(blocked)
    );
  }

  /**
   * Sanitize string input
   */
  private sanitizeString(str: string): string {
    return str
      .replace(/[<>]/g, '') // Basic XSS protection
      .replace(/javascript:/gi, '') // Block javascript: URLs
      .replace(/on\w+=/gi, '') // Block event handlers
      .trim()
      .slice(0, 10000); // Limit length
  }

  /**
   * Validate API key access and track usage
   */
  async validateApiKeyAccess(apiKeyId: string, operation: string): Promise<boolean> {
    try {
      // Check if API key exists and is active
      const { data: keyData, error } = await this.supabase
        .from('api_keys')
        .select('id, is_active, status, user_id, provider')
        .eq('id', apiKeyId)
        .single();

      if (error || !keyData || !keyData.is_active || keyData.status !== 'active') {
        await this.logSecurityEvent({
          event_type: 'api_key_access_denied',
          metadata: {
            api_key_id: apiKeyId,
            operation,
            reason: 'Invalid or inactive key'
          }
        });
        return false;
      }

      // Log successful access
      await this.logSecurityEvent({
        event_type: 'api_key_access_granted',
        user_id: keyData.user_id,
        metadata: {
          api_key_id: apiKeyId,
          operation,
          provider: keyData.provider
        }
      });

      // Track API usage
      await this.supabase
        .from('api_usage_costs')
        .insert({
          user_id: keyData.user_id,
          provider: keyData.provider,
          service: operation,
          usage_count: 1,
          cost_usd: 0,
          endpoint: operation,
          success: true
        });

      return true;
    } catch (error) {
      console.error('API key validation error:', error);
      return false;
    }
  }
}

/**
 * Helper function to create security instance
 */
export function createSecurityUtils(): EdgeFunctionSecurity {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  
  return new EdgeFunctionSecurity(supabaseUrl, supabaseServiceKey);
}

/**
 * Security error handler
 */
export function handleSecurityError(error: any): Response {
  const errorCode = typeof error === 'string' ? error : error?.message || 'SECURITY_ERROR';
  
  let status = 500;
  let message = 'Internal security error';

  switch (errorCode) {
    case 'SECURITY_BLOCKED_USER_AGENT':
      status = 403;
      message = 'Access denied';
      break;
    case 'SECURITY_REQUEST_TOO_LARGE':
      status = 413;
      message = 'Request too large';
      break;
    case 'SECURITY_RATE_LIMIT_EXCEEDED':
      status = 429;
      message = 'Rate limit exceeded';
      break;
    case 'SECURITY_AUTHENTICATION_FAILED':
      status = 401;
      message = 'Authentication failed';
      break;
    case 'SECURITY_AUTHORIZATION_FAILED':
      status = 403;
      message = 'Insufficient permissions';
      break;
  }

  return new Response(JSON.stringify({
    error: {
      code: errorCode,
      message,
      timestamp: new Date().toISOString()
    }
  }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}