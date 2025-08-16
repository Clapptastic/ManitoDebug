/**
 * Error formatting utilities for consistent error display across the application
 */

export interface FormattedError {
  title: string;
  message: string;
  code?: string;
}

/**
 * Format error for display in UI components
 */
export function formatError(error: Error | string | unknown): FormattedError {
  if (typeof error === 'string') {
    return {
      title: 'Error',
      message: error
    };
  }
  
  if (error instanceof Error) {
    return {
      title: error.name || 'Error',
      message: error.message,
      code: (error as any).code
    };
  }
  
  return {
    title: 'Unknown Error',
    message: 'An unexpected error occurred'
  };
}

/**
 * Format authentication errors with user-friendly messages
 */
export function formatAuthError(error: Error | string | unknown): FormattedError {
  const formatted = formatError(error);
  
  // Map common auth error codes to user-friendly messages
  const message = typeof error === 'object' && error && 'message' in error 
    ? String(error.message) 
    : formatted.message;
    
  if (message.includes('Invalid login credentials')) {
    return {
      title: 'Login Failed',
      message: 'Invalid email or password. Please check your credentials and try again.'
    };
  }
  
  if (message.includes('Email not confirmed')) {
    return {
      title: 'Email Verification Required',
      message: 'Please check your email and click the verification link before signing in.'
    };
  }
  
  if (message.includes('Too many requests')) {
    return {
      title: 'Too Many Attempts',
      message: 'Too many login attempts. Please wait a few minutes before trying again.'
    };
  }
  
  return formatted;
}

/**
 * Format API errors with additional context
 */
export function formatApiError(error: Error | string | unknown, context?: string): FormattedError {
  const formatted = formatError(error);
  
  if (context) {
    return {
      ...formatted,
      message: `${context}: ${formatted.message}`
    };
  }
  
  return formatted;
}

/**
 * Format error message for simple display
 */
export function formatErrorMessage(error: Error | string | unknown): string {
  return formatError(error).message;
}

/**
 * Get user-friendly auth error message
 */
export function getAuthErrorMessage(error: Error | string | unknown): string {
  return formatAuthError(error).message;
}