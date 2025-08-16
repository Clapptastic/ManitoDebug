/**
 * Centralized logging utilities for edge functions
 * Provides structured logging with different levels
 */

export interface LogContext {
  userId?: string;
  sessionId?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
}

/**
 * Log an informational message
 */
export function logInfo(message: string, context?: LogContext) {
  const timestamp = new Date().toISOString();
  console.log(`[INFO] ${timestamp} - ${message}`, context ? JSON.stringify(context, null, 2) : '');
}

/**
 * Log an error message
 */
export function logError(error: Error | string, message?: string, context?: LogContext) {
  const timestamp = new Date().toISOString();
  const errorMessage = error instanceof Error ? error.message : error;
  const stack = error instanceof Error ? error.stack : undefined;
  
  console.error(`[ERROR] ${timestamp} - ${message || errorMessage}`, {
    error: errorMessage,
    stack,
    ...context
  });
}

/**
 * Log a warning message
 */
export function logWarning(message: string, context?: LogContext) {
  const timestamp = new Date().toISOString();
  console.warn(`[WARN] ${timestamp} - ${message}`, context ? JSON.stringify(context, null, 2) : '');
}

/**
 * Log a debug message (only in development)
 */
export function logDebug(message: string, context?: LogContext) {
  const timestamp = new Date().toISOString();
  console.debug(`[DEBUG] ${timestamp} - ${message}`, context ? JSON.stringify(context, null, 2) : '');
}

/**
 * Log a performance metric
 */
export function logMetric(metricName: string, value: number, metadata?: Record<string, any>) {
  const timestamp = new Date().toISOString();
  console.log(`[METRIC] ${timestamp} - ${metricName}: ${value}`, metadata ? JSON.stringify(metadata, null, 2) : '');
}

/**
 * Log API call metrics
 */
export function logApiCall(
  provider: string,
  endpoint: string,
  responseTime: number,
  success: boolean,
  context?: LogContext
) {
  logMetric(`api_call_${provider}`, responseTime, {
    endpoint,
    success,
    provider,
    ...context
  });
}