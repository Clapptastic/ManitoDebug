import React, { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { ErrorFallback } from './ErrorFallback';
import { Loader2 } from 'lucide-react';

interface SafeComponentWrapperProps {
  children: React.ReactNode;
  componentName: string;
  fallback?: React.ReactNode;
  showErrorDetails?: boolean;
}

const LoadingFallback: React.FC<{ componentName: string }> = ({ componentName }) => (
  <div className="flex items-center justify-center p-8">
    <div className="flex items-center space-x-2">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span>Loading {componentName}...</span>
    </div>
  </div>
);

export const SafeComponentWrapper: React.FC<SafeComponentWrapperProps> = ({ 
  children, 
  componentName,
  fallback,
  showErrorDetails = false 
}) => {
  return (
    <ErrorBoundary
      FallbackComponent={(props) => (
        <ErrorFallback {...props} componentName={componentName} />
      )}
      onError={(error, errorInfo) => {
        console.error(`${componentName} crashed:`, error, errorInfo);
        
        // Report to monitoring service if available
        if (typeof window !== 'undefined' && 'gtag' in window) {
          (window as any).gtag('event', 'exception', {
            description: `${componentName}: ${error.message}`,
            fatal: false
          });
        }
      }}
    >
      <Suspense fallback={fallback || <LoadingFallback componentName={componentName} />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
};