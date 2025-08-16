/**
 * Centralized Error Handling and User Feedback System
 * Provides consistent error handling and user feedback across the application
 */

import { toast } from '@/hooks/use-toast';
import { errorMonitoringService } from '@/services/monitoring/errorMonitoringService';

export interface ErrorContext {
  action: string;
  component?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface ApiError extends Error {
  code?: string;
  status?: number;
  details?: any;
}

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number,
    public context?: ErrorContext
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Enhanced error handler with comprehensive logging and user feedback
 */
export function handleError(error: Error | ApiError | any, context: ErrorContext) {
  // Import production error handler
  import('./security/productionErrorHandler').then(({ sanitizeErrorForProduction, logErrorSecurely }) => {
    logErrorSecurely(error, context);
  }).catch(() => {
    // Fallback logging if import fails
    console.error(`❌ Error in ${context.action}:`, {
      error: error.message || error,
      context,
      timestamp: new Date().toISOString()
    });
  });

  // Determine user-friendly message
  const userMessage = getUserFriendlyMessage(error, context);
  
  // Show toast notification
  toast({
    title: `${context.action} Failed`,
    description: userMessage,
    variant: 'destructive',
    duration: 6000,
  });

  // Log to monitoring service (could be added later)
  logToMonitoring(error, context);
}

/**
 * Success handler for positive user feedback
 */
export function handleSuccess(action: string, message: string, duration: number = 4000) {
  console.log(`✅ Success: ${action}`);
  
  toast({
    title: 'Success',
    description: message,
    duration,
  });
}

/**
 * Loading state handler for operations
 */
export function handleLoading(action: string, message: string) {
  console.log(`⏳ Loading: ${action} - ${message}`);
  
  toast({
    title: action,
    description: message,
    duration: 2000,
  });
}

/**
 * Convert technical errors to user-friendly messages
 */
function getUserFriendlyMessage(error: any, context: ErrorContext): string {
  // Network errors
  if (error.message?.includes('fetch') || error.message?.includes('network')) {
    return 'Network connection failed. Please check your internet connection and try again.';
  }

  // Authentication errors
  if (error.message?.includes('unauthorized') || error.message?.includes('authentication')) {
    return 'Please log in again to continue.';
  }

  // Permission errors
  if (error.message?.includes('permission denied') || error.message?.includes('forbidden')) {
    return 'You don\'t have permission to perform this action.';
  }

  // API key specific errors
  if (context.action.includes('API key') || context.action.includes('api-key')) {
    if (error.message?.includes('invalid') || error.message?.includes('unauthorized')) {
      return 'The API key is invalid or has expired. Please check your key and try again.';
    }
    if (error.message?.includes('rate limit')) {
      return 'API rate limit exceeded. Please wait a moment before trying again.';
    }
  }

  // Validation errors
  if (error.message?.includes('validation') || error.message?.includes('invalid input')) {
    return 'Please check your input and try again.';
  }

  // Database errors
  if (error.message?.includes('duplicate') || error.message?.includes('already exists')) {
    return 'This item already exists. Please use a different name or update the existing item.';
  }

  // Generic fallback
  if (error.message && error.message.length < 200) {
    return error.message;
  }

  return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
}

/**
 * Log errors to monitoring service
 */
function logToMonitoring(error: any, context: ErrorContext) {
  // Forward to centralized backend logger (non-blocking)
  try {
    const err = error instanceof Error ? error : new Error(String(error?.message || error));
    void errorMonitoringService.logError({
      error_type: 'client',
      error_message: err.message,
      error_stack: err.stack,
      component: context.component,
      action: context.action,
      metadata: context.metadata,
      severity: 'high'
    });
  } catch {}

  // Also log structured details to console for local debugging
  console.warn('Error logged to monitoring:', {
    error: {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    },
    context,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
  });
}

/**
 * Async operation wrapper with comprehensive error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: ErrorContext,
  successMessage?: string
): Promise<T | null> {
  try {
    const result = await operation();
    
    if (successMessage) {
      handleSuccess(context.action, successMessage);
    }
    
    return result;
  } catch (error) {
    handleError(error, context);
    return null;
  }
}

/**
 * Form validation wrapper
 */
export function validateAndHandle(
  validation: () => boolean | string,
  context: ErrorContext
): boolean {
  try {
    const result = validation();
    
    if (typeof result === 'string') {
      toast({
        title: 'Validation Error',
        description: result,
        variant: 'destructive',
        duration: 5000,
      });
      return false;
    }
    
    return result;
  } catch (error) {
    handleError(error, context);
    return false;
  }
}

/**
 * File operation error handler
 */
export function handleFileError(error: any, operation: string, filename?: string) {
  const context: ErrorContext = {
    action: `File ${operation}`,
    metadata: { filename }
  };

  if (error.name === 'QuotaExceededError') {
    toast({
      title: 'Storage Full',
      description: 'Your device storage is full. Please free up space and try again.',
      variant: 'destructive',
      duration: 6000,
    });
    return;
  }

  if (error.message?.includes('file too large')) {
    toast({
      title: 'File Too Large',
      description: 'The selected file is too large. Please choose a smaller file.',
      variant: 'destructive',
      duration: 5000,
    });
    return;
  }

  handleError(error, context);
}

/**
 * API-specific error handler
 */
export function handleApiError(error: any, endpoint: string, method: string = 'GET') {
  const context: ErrorContext = {
    action: `API ${method}`,
    metadata: { endpoint }
  };

  // Handle specific HTTP status codes
  if (error.status) {
    switch (error.status) {
      case 400:
        toast({
          title: 'Invalid Request',
          description: 'The request was invalid. Please check your input and try again.',
          variant: 'destructive',
          duration: 5000,
        });
        return;
      case 401:
        toast({
          title: 'Authentication Required',
          description: 'Please log in to continue.',
          variant: 'destructive',
          duration: 5000,
        });
        return;
      case 403:
        toast({
          title: 'Access Denied',
          description: 'You don\'t have permission to access this resource.',
          variant: 'destructive',
          duration: 5000,
        });
        return;
      case 429:
        toast({
          title: 'Rate Limited',
          description: 'Too many requests. Please wait a moment and try again.',
          variant: 'destructive',
          duration: 6000,
        });
        return;
      case 500:
      case 502:
      case 503:
        toast({
          title: 'Server Error',
          description: 'Server is temporarily unavailable. Please try again later.',
          variant: 'destructive',
          duration: 6000,
        });
        return;
    }
  }

  handleError(error, context);
}