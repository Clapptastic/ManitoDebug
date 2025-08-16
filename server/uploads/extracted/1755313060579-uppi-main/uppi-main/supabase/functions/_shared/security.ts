/**
 * Security utilities for edge functions
 */

import { createSupabaseClient } from './supabase-client.ts';
import { EdgeFunctionError } from './error-handler.ts';

/**
 * Verify user has admin privileges
 */
export async function requireAdmin(userId: string): Promise<void> {
  const supabase = createSupabaseClient({ useServiceRole: true });
  
  const { data: isAdmin, error } = await supabase
    .rpc('is_admin_user', { check_user_id: userId });

  if (error) {
    throw new EdgeFunctionError({
      message: 'Failed to verify admin status',
      statusCode: 500,
      details: error
    });
  }

  if (!isAdmin) {
    throw new EdgeFunctionError({
      message: 'Admin privileges required',
      statusCode: 403,
      code: 'INSUFFICIENT_PRIVILEGES'
    });
  }
}

/**
 * Sanitize user input to prevent injection attacks
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Validate JWT token structure
 */
export function validateJWTStructure(token: string): boolean {
  const parts = token.split('.');
  return parts.length === 3 && parts.every(part => part.length > 0);
}

/**
 * Check if request is from allowed origin
 */
export function validateOrigin(request: Request, allowedOrigins: string[] = ['*']): boolean {
  if (allowedOrigins.includes('*')) {
    return true;
  }

  const origin = request.headers.get('origin');
  return origin ? allowedOrigins.includes(origin) : false;
}

/**
 * Extract user IP address from request
 */
export function getUserIP(request: Request): string {
  return request.headers.get('cf-connecting-ip') ||
         request.headers.get('x-forwarded-for') ||
         request.headers.get('x-real-ip') ||
         'unknown';
}

/**
 * Generate secure random string
 */
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Mask sensitive data for logging
 */
export function maskSensitiveData(data: any): any {
  if (typeof data === 'string') {
    // Mask API keys
    if (data.startsWith('sk-') || data.startsWith('pk-')) {
      return data.substring(0, 4) + '***' + data.substring(data.length - 4);
    }
    // Mask emails
    if (data.includes('@')) {
      const [username, domain] = data.split('@');
      return username.substring(0, 2) + '***@' + domain;
    }
    return data;
  }

  if (typeof data === 'object' && data !== null) {
    const masked: any = {};
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      if (lowerKey.includes('key') || lowerKey.includes('token') || 
          lowerKey.includes('password') || lowerKey.includes('secret')) {
        masked[key] = '***MASKED***';
      } else {
        masked[key] = maskSensitiveData(value);
      }
    }
    return masked;
  }

  return data;
}