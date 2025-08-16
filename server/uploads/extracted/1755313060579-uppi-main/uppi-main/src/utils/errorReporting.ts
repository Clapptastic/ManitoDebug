import { errorHandler } from '@/services/error-handling/ErrorHandlingService';

/**
 * Utility functions for standardized error reporting
 * Provides consistent error handling across the application
 */

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

/**
 * Report a user action error
 */
export function reportUserActionError(
  error: Error | string,
  action: string,
  component: string,
  metadata?: Record<string, any>
) {
  errorHandler.logError(error, {
    component,
    action,
    user_action: true,
    ...metadata
  });
}

/**
 * Report an API call error
 */
export function reportApiError(
  error: Error | string,
  endpoint: string,
  method: string = 'GET',
  metadata?: Record<string, any>
) {
  errorHandler.logError(error, {
    component: 'API',
    action: 'api_call_failed',
    api_endpoint: endpoint,
    api_method: method,
    ...metadata
  });
}

/**
 * Report a database operation error
 */
export function reportDatabaseError(
  error: Error | string,
  operation: string,
  table?: string,
  metadata?: Record<string, any>
) {
  errorHandler.logError(error, {
    component: 'Database',
    action: 'database_operation_failed',
    database_operation: operation,
    database_table: table,
    ...metadata
  });
}

/**
 * Report a validation error
 */
export function reportValidationError(
  error: Error | string,
  fieldName: string,
  value: any,
  component: string,
  metadata?: Record<string, any>
) {
  errorHandler.logError(error, {
    component,
    action: 'validation_failed',
    validation_field: fieldName,
    validation_value: typeof value === 'object' ? JSON.stringify(value) : String(value),
    ...metadata
  });
}

/**
 * Report a performance issue
 */
export function reportPerformanceIssue(
  operation: string,
  duration: number,
  threshold: number,
  component: string,
  metadata?: Record<string, any>
) {
  errorHandler.logError(`Performance issue: ${operation} took ${duration}ms (threshold: ${threshold}ms)`, {
    component,
    action: 'performance_issue',
    performance_operation: operation,
    performance_duration: duration,
    performance_threshold: threshold,
    ...metadata
  });
}

/**
 * Async operation wrapper with error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: ErrorContext,
  fallbackValue?: T
): Promise<T | undefined> {
  try {
    return await operation();
  } catch (error) {
    errorHandler.logError(error as Error, context);
    return fallbackValue;
  }
}