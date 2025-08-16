/**
 * Edge Function Health Check Utility
 * Provides connection testing and diagnostic tools for edge functions
 */

import { supabase } from '@/integrations/supabase/client';

export interface HealthCheckResult {
  isHealthy: boolean;
  responseTime: number;
  error?: string;
  details: {
    authStatus: 'authenticated' | 'unauthenticated' | 'error';
    networkStatus: 'online' | 'offline';
    serverReachable: boolean;
  };
}

/**
 * Comprehensive health check for edge functions
 */
export async function checkEdgeFunctionHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    // Check network connectivity
    const networkStatus = navigator.onLine ? 'online' : 'offline';
    
    // Check authentication status
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    let authStatus: 'authenticated' | 'unauthenticated' | 'error';
    if (authError) {
      authStatus = 'error';
    } else if (session) {
      authStatus = 'authenticated';
    } else {
      authStatus = 'unauthenticated';
    }
    
    // Try a simple edge function call with short timeout
    let serverReachable = false;
    try {
      const testPromise = supabase.functions.invoke('unified-api-key-manager', {
        body: { action: 'health_check' }
      });
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Health check timeout')), 5000);
      });
      
      await Promise.race([testPromise, timeoutPromise]);
      serverReachable = true;
    } catch (error) {
      console.warn('Server reachability test failed:', error);
      serverReachable = false;
    }
    
    const responseTime = Date.now() - startTime;
    
    const isHealthy = networkStatus === 'online' && 
                     authStatus === 'authenticated' && 
                     serverReachable;
    
    return {
      isHealthy,
      responseTime,
      details: {
        authStatus,
        networkStatus,
        serverReachable
      }
    };
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return {
      isHealthy: false,
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: {
        authStatus: 'error',
        networkStatus: navigator.onLine ? 'online' : 'offline',
        serverReachable: false
      }
    };
  }
}

/**
 * Get diagnostic information for troubleshooting
 */
export function getDiagnosticInfo() {
  return {
    userAgent: navigator.userAgent,
    online: navigator.onLine,
    currentUrl: window.location.href,
    timestamp: new Date().toISOString(),
    supabseUrl: import.meta.env.VITE_SUPABASE_URL || 'Not configured',
    hasAuthToken: !!localStorage.getItem('sb-jqbdjttdaihidoyalqvs-auth-token')
  };
}

/**
 * Retry mechanism with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (attempt === maxRetries - 1) {
        throw lastError;
      }
      
      // Exponential backoff: wait longer between each retry
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}