/**
 * Authentication debugging utilities for development environment
 */

import { User, Session } from '@supabase/supabase-js';
import { UserRole } from '@/types/auth/roles';

export interface AuthDebugInfo {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  hasSpecialAccess: boolean;
  timestamp: string;
}

/**
 * Debug authentication state
 */
export function debugAuthState(
  user: User | null, 
  session: Session | null,
  role?: UserRole | null,
  hasSpecialAccess?: boolean
): AuthDebugInfo {
  const debugInfo: AuthDebugInfo = {
    user,
    session,
    role: role || null,
    isAuthenticated: !!user && !!session,
    hasSpecialAccess: hasSpecialAccess || false,
    timestamp: new Date().toISOString()
  };
  
  if (process.env.NODE_ENV === 'development') {
    console.group('🔐 Auth Debug Info');
    console.log('User:', user?.email || 'Not authenticated');
    console.log('Role:', role || 'No role assigned');
    console.log('Session valid:', !!session);
    console.log('Special access:', hasSpecialAccess);
    console.log('Timestamp:', debugInfo.timestamp);
    console.groupEnd();
  }
  
  return debugInfo;
}

/**
 * Log authentication events for debugging
 */
export function logAuthEvent(event: string, details?: any) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔐 Auth Event: ${event}`, details || '');
  }
}

/**
 * Validate session integrity
 */
export function validateSession(session: Session | null): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  if (!session) {
    issues.push('No session found');
    return { isValid: false, issues };
  }
  
  if (!session.access_token) {
    issues.push('Missing access token');
  }
  
  if (!session.user) {
    issues.push('Missing user in session');
  }
  
  // Check token expiration
  if (session.expires_at) {
    const now = Math.floor(Date.now() / 1000);
    if (session.expires_at < now) {
      issues.push('Session expired');
    }
  }
  
  const isValid = issues.length === 0;
  
  if (process.env.NODE_ENV === 'development' && !isValid) {
    console.warn('🔐 Session validation issues:', issues);
  }
  
  return { isValid, issues };
}

/**
 * Log session details for debugging
 */
export function logSessionDetails(session: Session | null, context?: string): void {
  if (process.env.NODE_ENV === 'development') {
    console.group('🔐 Session Details');
    console.log('Context:', context || 'Unknown');
    console.log('Session:', session ? 'Valid' : 'Invalid');
    if (session) {
      console.log('User ID:', session.user?.id);
      console.log('Expires at:', new Date(session.expires_at! * 1000));
    }
    console.groupEnd();
  }
}

/**
 * Main auth debugger instance
 */
export const authDebugger = {
  debugAuthState,
  logAuthEvent,
  validateSession,
  logSessionDetails
};