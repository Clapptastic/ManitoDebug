/**
 * Standardized Error Handling System
 * Simple error handling for consistent user experience
 */

import { toast } from '@/hooks/use-toast';
import { errorMonitoringService } from '@/services/monitoring/errorMonitoringService';

export type ErrorCategory = 
  | 'authentication' 
  | 'authorization' 
  | 'validation' 
  | 'network' 
  | 'database' 
  | 'api' 
  | 'analytics'
  | 'competitor_analysis'
  | 'document_management'
  | 'realtime'
  | 'system_metrics'
  | 'unknown';

export interface StandardError {
  message: string;
  category: string;
  timestamp: string;
  userFriendlyMessage: string;
}

class StandardErrorHandler {
  handleError(error: unknown, category: ErrorCategory | string = 'unknown'): string {
    const errorMessage = this.extractErrorMessage(error);
    const categoryStr = typeof category === 'string' ? category : category;
    
    const standardError: StandardError = {
      message: errorMessage,
      category: categoryStr,
      timestamp: new Date().toISOString(),
      userFriendlyMessage: this.getUserFriendlyMessage(categoryStr, errorMessage)
    };

    // Log the error
    console.error(`[${categoryStr.toUpperCase()}] ${errorMessage}`, {
      originalError: error,
      timestamp: standardError.timestamp
    });

    // Show toast notification
    toast({
      title: 'Error',
      description: standardError.userFriendlyMessage,
      variant: 'destructive',
    });

    // Forward to centralized backend logger (non-blocking)
    try {
      void errorMonitoringService.logError({
        error_type: 'client',
        error_message: errorMessage,
        error_stack: (error as any)?.stack,
        component: categoryStr,
        action: 'standard_error_handler',
        metadata: { originalError: error },
        severity: 'high'
      });
    } catch {}

    return errorMessage;
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    
    if (typeof error === 'string') {
      return error;
    }
    
    if (error && typeof error === 'object' && 'message' in error) {
      return String((error as any).message);
    }
    
    return 'An unknown error occurred';
  }

  private getUserFriendlyMessage(category: string, message: string): string {
    // Authentication errors
    if (category.includes('auth') || message.includes('auth')) {
      return 'Please log in to continue. Your session may have expired.';
    }

    // Authorization errors
    if (category.includes('authorization') || message.includes('permission')) {
      return 'You don\'t have permission to perform this action.';
    }

    // Network errors
    if (category.includes('network') || message.includes('network') || message.includes('fetch')) {
      return 'Network connection issue. Please check your internet connection and try again.';
    }

    // Database errors
    if (category.includes('database') || message.includes('database') || message.includes('table')) {
      return 'There was a problem accessing data. Please try again.';
    }

    // API key errors
    if (category.includes('api') || message.includes('api key') || message.includes('key')) {
      return 'There\'s an issue with your API configuration. Please check your settings.';
    }

    // Validation errors
    if (category.includes('validation') || message.includes('validation') || message.includes('invalid')) {
      return 'Please check your input and try again.';
    }

    // Competitor analysis specific errors
    if (category.includes('competitor')) {
      return 'There was an issue with the competitor analysis. Please try again.';
    }

    // Document management errors
    if (category.includes('document')) {
      return 'There was an issue with document processing. Please try again.';
    }

    // Analytics errors
    if (category.includes('analytics') || category.includes('metrics')) {
      return 'There was an issue loading analytics data. Please try again.';
    }

    // Real-time errors
    if (category.includes('realtime')) {
      return 'There was an issue with real-time updates. Please refresh the page.';
    }

    // Generic friendly message
    return 'Something went wrong. Please try again, and contact support if the problem persists.';
  }
}

// Export singleton instance
export const standardErrorHandler = new StandardErrorHandler();
export default standardErrorHandler;