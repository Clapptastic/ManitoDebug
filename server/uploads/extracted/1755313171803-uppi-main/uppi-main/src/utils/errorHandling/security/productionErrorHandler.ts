/**
 * Production Error Handler with Security Features
 * Sanitizes errors for production use and provides secure logging
 */

export interface SanitizedError {
  message: string;
  timestamp: string;
  errorId: string;
  context?: Record<string, any>;
}

/**
 * Sanitize error information for production use
 * Removes sensitive information and stack traces
 */
export function sanitizeErrorForProduction(error: any, context: any): SanitizedError {
  const errorId = generateErrorId();
  
  // Default safe message
  let message = 'An unexpected error occurred';
  
  // Allow specific safe error messages
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase();
    
    // Safe error types that can be shown to users
    if (
      errorMessage.includes('network') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('not found') ||
      errorMessage.includes('unauthorized') ||
      errorMessage.includes('forbidden') ||
      errorMessage.includes('validation') ||
      errorMessage.includes('invalid input') ||
      errorMessage.includes('rate limit')
    ) {
      message = error.message;
    }
  }
  
  return {
    message,
    timestamp: new Date().toISOString(),
    errorId,
    context: {
      action: context.action,
      component: context.component,
      // Don't include sensitive metadata in production
    }
  };
}

/**
 * Securely log errors without exposing sensitive information
 */
export function logErrorSecurely(error: any, context: any): void {
  const sanitizedError = sanitizeErrorForProduction(error, context);
  
  // Log to console with limited information
  console.error(`[${sanitizedError.errorId}] ${context.action} failed:`, {
    message: sanitizedError.message,
    timestamp: sanitizedError.timestamp,
    context: sanitizedError.context
  });
  
  // In production, you would send this to a secure logging service
  // Example: sendToLoggingService(sanitizedError);
}

/**
 * Generate unique error ID for tracking
 */
function generateErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if we're in production environment
 */
export function isProduction(): boolean {
  return import.meta.env.MODE === 'production';
}

/**
 * Safe error message generator
 */
export function getSafeErrorMessage(error: any): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unexpected error occurred';
}