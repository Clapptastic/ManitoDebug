/**
 * Production-Safe Error Handling
 * Removes sensitive information from error responses in production
 */

interface SafeError {
  message: string;
  code?: string;
  timestamp: string;
  requestId?: string;
}

/**
 * Check if we're in production environment
 */
function isProduction(): boolean {
  return import.meta.env.PROD || 
         import.meta.env.MODE === 'production' ||
         window.location.hostname !== 'localhost';
}

/**
 * Sanitize error for production consumption
 */
export function sanitizeErrorForProduction(error: Error | string | unknown): SafeError {
  const timestamp = new Date().toISOString();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;

  // In development, return more detailed errors
  if (!isProduction()) {
    if (error instanceof Error) {
      return {
        message: error.message,
        code: (error as any).code,
        timestamp,
        requestId,
        // Include stack in development only
        ...(error.stack && { stack: error.stack }),
      } as SafeError & { stack?: string };
    }
    
    return {
      message: typeof error === 'string' ? error : 'Unknown error occurred',
      timestamp,
      requestId,
    };
  }

  // Production error sanitization
  if (error instanceof Error) {
    const message = error.message;
    
    // Map specific error types to user-friendly messages
    if (message.includes('authentication') || message.includes('unauthorized')) {
      return {
        message: 'Authentication required. Please sign in again.',
        code: 'AUTH_ERROR',
        timestamp,
        requestId,
      };
    }
    
    if (message.includes('permission') || message.includes('forbidden')) {
      return {
        message: 'You do not have permission to perform this action.',
        code: 'PERMISSION_ERROR',
        timestamp,
        requestId,
      };
    }
    
    if (message.includes('network') || message.includes('fetch')) {
      return {
        message: 'Network connection failed. Please check your connection and try again.',
        code: 'NETWORK_ERROR',
        timestamp,
        requestId,
      };
    }
    
    if (message.includes('rate limit') || message.includes('too many requests')) {
      return {
        message: 'Too many requests. Please wait a moment before trying again.',
        code: 'RATE_LIMIT_ERROR',
        timestamp,
        requestId,
      };
    }
    
    if (message.includes('validation') || message.includes('invalid')) {
      return {
        message: 'Invalid input provided. Please check your data and try again.',
        code: 'VALIDATION_ERROR',
        timestamp,
        requestId,
      };
    }
    
    // Generic error for anything else in production
    return {
      message: 'An unexpected error occurred. Please try again or contact support.',
      code: 'INTERNAL_ERROR',
      timestamp,
      requestId,
    };
  }
  
  if (typeof error === 'string') {
    // Don't expose raw string errors in production
    return {
      message: 'An error occurred while processing your request.',
      code: 'GENERIC_ERROR',
      timestamp,
      requestId,
    };
  }
  
  return {
    message: 'An unexpected error occurred. Please try again.',
    code: 'UNKNOWN_ERROR',
    timestamp,
    requestId,
  };
}

/**
 * Log error details securely (for monitoring/debugging)
 */
export function logErrorSecurely(
  error: Error | string | unknown, 
  context: Record<string, any> = {}
) {
  const sanitizedContext = {
    ...context,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    // Remove potentially sensitive data
    apiKey: context.apiKey ? '[REDACTED]' : undefined,
    token: context.token ? '[REDACTED]' : undefined,
    password: context.password ? '[REDACTED]' : undefined,
  };
  
  if (isProduction()) {
    // In production, log only essential information
    console.error('Application Error:', {
      message: error instanceof Error ? error.message : String(error),
      context: sanitizedContext,
    });
  } else {
    // In development, log full error details
    console.error('Application Error:', {
      error,
      stack: error instanceof Error ? error.stack : undefined,
      context: sanitizedContext,
    });
  }
}

/**
 * Create a safe error response for API responses
 */
export function createSafeErrorResponse(error: unknown, statusCode: number = 500): Response {
  const safeError = sanitizeErrorForProduction(error);
  
  return new Response(
    JSON.stringify({
      success: false,
      error: safeError,
    }),
    {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
      },
    }
  );
}

/**
 * Wrap async operations with production-safe error handling
 */
export async function withProductionErrorHandling<T>(
  operation: () => Promise<T>,
  context: Record<string, any> = {}
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    logErrorSecurely(error, context);
    
    // Re-throw sanitized error in production
    if (isProduction()) {
      const safeError = sanitizeErrorForProduction(error);
      throw new Error(safeError.message);
    }
    
    throw error;
  }
}

/**
 * Environment detection utilities
 */
export const ENV_UTILS = {
  isProduction,
  isDevelopment: () => !isProduction(),
  getEnvironment: () => isProduction() ? 'production' : 'development',
} as const;