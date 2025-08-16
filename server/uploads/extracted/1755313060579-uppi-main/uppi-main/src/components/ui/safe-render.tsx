import React, { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetErrorBoundary }) => (
  <div className="flex flex-col items-center justify-center p-4 border border-destructive/20 rounded-lg bg-destructive/5">
    <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
    <p className="text-sm text-destructive mb-2">Something went wrong</p>
    <button
      onClick={resetErrorBoundary}
      className="text-xs px-2 py-1 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90"
    >
      Try again
    </button>
  </div>
);

const LoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center p-4">
    <Loader2 className="h-6 w-6 animate-spin" />
  </div>
);

interface SafeRenderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const SafeRender: React.FC<SafeRenderProps> = ({ children, fallback }) => (
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <Suspense fallback={fallback || <LoadingFallback />}>
      {children}
    </Suspense>
  </ErrorBoundary>
);