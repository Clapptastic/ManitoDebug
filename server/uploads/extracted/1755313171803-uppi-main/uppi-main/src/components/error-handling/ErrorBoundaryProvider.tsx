import React, { createContext, useContext, ReactNode } from 'react';
import { useErrorHandler } from '@/services/error-handling/ErrorHandlingService';

interface ErrorBoundaryContextType {
  captureError: (error: Error, context?: any) => void;
  reportIssue: (description: string, context?: any) => void;
}

const ErrorBoundaryContext = createContext<ErrorBoundaryContextType | undefined>(undefined);

interface ErrorBoundaryProviderProps {
  children: ReactNode;
}

/**
 * Provider for centralized error handling context
 * Makes error reporting available throughout the component tree
 */
export function ErrorBoundaryProvider({ children }: ErrorBoundaryProviderProps) {
  const { logError } = useErrorHandler();

  const captureError = (error: Error, context?: any) => {
    logError(error, {
      component: 'ErrorBoundaryProvider',
      action: 'error_captured',
      ...context
    });
  };

  const reportIssue = (description: string, context?: any) => {
    logError(new Error(description), {
      component: 'ErrorBoundaryProvider',
      action: 'issue_reported',
      user_reported: true,
      ...context
    });
  };

  const value = {
    captureError,
    reportIssue
  };

  return (
    <ErrorBoundaryContext.Provider value={value}>
      {children}
    </ErrorBoundaryContext.Provider>
  );
}

export function useErrorBoundaryContext() {
  const context = useContext(ErrorBoundaryContext);
  if (!context) {
    throw new Error('useErrorBoundaryContext must be used within ErrorBoundaryProvider');
  }
  return context;
}