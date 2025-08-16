/**
 * Centralized logging utilities for edge functions
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  userId?: string;
  functionName?: string;
  requestId?: string;
  metadata?: Record<string, any>;
}

/**
 * Enhanced logging with context
 */
export function logInfo(message: string, context: LogContext = {}): void {
  const timestamp = new Date().toISOString();
  const logEntry = {
    level: 'info',
    timestamp,
    message,
    ...context
  };
  console.log(`[INFO] ${timestamp}`, message, context);
}

export function logError(error: any, message: string, context: LogContext = {}): void {
  const timestamp = new Date().toISOString();
  const logEntry = {
    level: 'error',
    timestamp,
    message,
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error,
    ...context
  };
  console.error(`[ERROR] ${timestamp}`, message, logEntry);
}

export function logWarn(message: string, context: LogContext = {}): void {
  const timestamp = new Date().toISOString();
  const logEntry = {
    level: 'warn',
    timestamp,
    message,
    ...context
  };
  console.warn(`[WARN] ${timestamp}`, message, context);
}

export function logDebug(message: string, context: LogContext = {}): void {
  const timestamp = new Date().toISOString();
  const logEntry = {
    level: 'debug',
    timestamp,
    message,
    ...context
  };
  console.debug(`[DEBUG] ${timestamp}`, message, context);
}

/**
 * Performance monitoring
 */
export class PerformanceTracker {
  private startTime: number;
  private context: LogContext;

  constructor(operationName: string, context: LogContext = {}) {
    this.startTime = Date.now();
    this.context = { ...context, operation: operationName };
    logDebug(`Started: ${operationName}`, this.context);
  }

  finish(message?: string): number {
    const duration = Date.now() - this.startTime;
    const finalMessage = message || `Completed: ${this.context.operation}`;
    
    logInfo(finalMessage, {
      ...this.context,
      duration_ms: duration
    });

    // Log slow operations as warnings
    if (duration > 5000) {
      logWarn(`Slow operation detected: ${this.context.operation}`, {
        ...this.context,
        duration_ms: duration
      });
    }

    return duration;
  }
}