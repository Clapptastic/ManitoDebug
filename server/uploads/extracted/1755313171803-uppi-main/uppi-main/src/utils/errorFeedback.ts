/**
 * Centralized error feedback utility for providing consistent user-friendly error messages
 */

export interface ErrorDetails {
  title: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  action?: string;
}

export class ErrorFeedbackService {
  /**
   * Analyzes an error and returns user-friendly feedback
   */
  static getErrorFeedback(error: any, context?: string): ErrorDetails {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const lowerMessage = errorMessage.toLowerCase();

    // API Key related errors
    if (lowerMessage.includes('api key') || lowerMessage.includes('invalid openai')) {
      return {
        title: 'API Key Issue',
        message: 'Please check your API keys in settings and ensure they are valid.',
        severity: 'error',
        action: 'Go to Settings → API Keys to verify your configuration'
      };
    }

    // Authentication errors
    if (lowerMessage.includes('authentication') || lowerMessage.includes('not authenticated') || lowerMessage.includes('permission denied')) {
      return {
        title: 'Authentication Error',
        message: 'Please log in again to continue.',
        severity: 'error',
        action: 'Click the login button to re-authenticate'
      };
    }

    // Rate limiting errors
    if (lowerMessage.includes('quota') || lowerMessage.includes('rate limit') || lowerMessage.includes('too many requests')) {
      return {
        title: 'Rate Limit Exceeded',
        message: 'API rate limit reached. Please try again in a few minutes.',
        severity: 'warning',
        action: 'Wait a few minutes before trying again'
      };
    }

    // Network errors
    if (lowerMessage.includes('network') || lowerMessage.includes('fetch') || lowerMessage.includes('connection')) {
      return {
        title: 'Connection Error',
        message: 'Network connection issue. Please check your internet connection.',
        severity: 'error',
        action: 'Check your internet connection and try again'
      };
    }

    // Validation errors
    if (lowerMessage.includes('validation') || lowerMessage.includes('invalid') || lowerMessage.includes('required')) {
      return {
        title: 'Validation Error',
        message: 'Please check your input and try again.',
        severity: 'warning',
        action: 'Review the form fields and correct any errors'
      };
    }

    // Server errors
    if (lowerMessage.includes('500') || lowerMessage.includes('internal server') || lowerMessage.includes('server error')) {
      return {
        title: 'Server Error',
        message: 'A server error occurred. Our team has been notified.',
        severity: 'error',
        action: 'Please try again in a few minutes'
      };
    }

    // Database errors
    if (lowerMessage.includes('database') || lowerMessage.includes('query') || lowerMessage.includes('constraint')) {
      return {
        title: 'Data Error',
        message: 'A data processing error occurred. Please try again.',
        severity: 'error',
        action: 'Try again or contact support if the issue persists'
      };
    }

    // Timeout errors
    if (lowerMessage.includes('timeout') || lowerMessage.includes('timed out')) {
      return {
        title: 'Request Timeout',
        message: 'The request took too long to complete. Please try again.',
        severity: 'warning',
        action: 'Try again with a simpler request or wait a moment'
      };
    }

    // Context-specific errors
    if (context) {
      switch (context) {
        case 'competitor-analysis':
          return {
            title: 'Analysis Failed',
            message: 'The competitor analysis could not be completed. Please check your API keys and try again.',
            severity: 'error',
            action: 'Verify your API keys in settings and try again'
          };
        
        case 'document-upload':
          return {
            title: 'Upload Failed',
            message: 'The document could not be uploaded. Please check the file format and size.',
            severity: 'error',
            action: 'Ensure your file is in a supported format and under the size limit'
          };
        
        case 'ai-chat':
          return {
            title: 'Chat Error',
            message: 'Unable to process your message. Please try again.',
            severity: 'error',
            action: 'Check your API keys or try rephrasing your message'
          };
      }
    }

    // Generic error fallback
    return {
      title: 'Unexpected Error',
      message: errorMessage || 'An unexpected error occurred. Please try again.',
      severity: 'error',
      action: 'If the problem persists, please contact support'
    };
  }

  /**
   * Returns a simplified error message for toast notifications
   */
  static getSimpleErrorMessage(error: any): string {
    const feedback = this.getErrorFeedback(error);
    return feedback.message;
  }

  /**
   * Checks if an error is user-actionable
   */
  static isUserActionable(error: any): boolean {
    const feedback = this.getErrorFeedback(error);
    return Boolean(feedback.action);
  }

  /**
   * Gets color coding for error severity
   */
  static getSeverityColor(severity: ErrorDetails['severity']): string {
    switch (severity) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'warning';
      case 'info':
        return 'default';
      default:
        return 'destructive';
    }
  }
}

/**
 * Hook for consistent error handling in components
 */
export const useErrorFeedback = () => {
  return {
    getErrorFeedback: ErrorFeedbackService.getErrorFeedback,
    getSimpleErrorMessage: ErrorFeedbackService.getSimpleErrorMessage,
    isUserActionable: ErrorFeedbackService.isUserActionable,
    getSeverityColor: ErrorFeedbackService.getSeverityColor
  };
};