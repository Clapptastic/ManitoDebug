/**
 * Error tracking and monitoring utilities
 */

import { errorMonitoringService } from '@/services/monitoring/errorMonitoringService';
export interface TrackedError {
  id: string;
  message: string;
  stack?: string;
  timestamp: number;
  url: string;
  userAgent: string;
  source?: string;
}

export class ErrorTracker {
  private errors: TrackedError[] = [];
  private maxErrors = 100;
  private subscribers: ((errors: TrackedError[]) => void)[] = [];

  trackError(error: Error, context?: string): void {
    const trackedError: TrackedError = {
      id: Math.random().toString(36),
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      source: context
    };

    this.errors.unshift(trackedError);
    
    // Forward to centralized backend logger (fire-and-forget)
    try {
      void errorMonitoringService.logClientError(error, 'ErrorTracker', context, {
        trackedError
      });
    } catch {}
    
    // Keep only the latest errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // Notify subscribers
    this.subscribers.forEach(callback => callback([...this.errors]));

    if (process.env.NODE_ENV === 'development') {
      // Avoid creating console.error loops when errors originate from toast error tracking
      if (trackedError.source !== 'toast-error') {
        console.error('Error tracked:', trackedError);
      }
    }
  }

  getErrors(): TrackedError[] {
    return [...this.errors];
  }

  clearErrors(): void {
    this.errors = [];
    this.subscribers.forEach(callback => callback([]));
  }

  subscribe(callback: (errors: TrackedError[]) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }
}

/**
 * Global error tracker instance
 */
export const errorTracker = new ErrorTracker();
