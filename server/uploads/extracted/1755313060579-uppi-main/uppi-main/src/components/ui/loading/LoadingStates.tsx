
import { cn } from '@/lib/utils';
import React from 'react';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';

/**
 * Loading Spinner Component
 * 
 * Displays a spinner animation during loading states
 * 
 * @example
 * ```tsx
 * <Spinner size="md" />
 * ```
 */
interface SpinnerProps {
  /** Size of the spinner */
  size?: 'sm' | 'md' | 'lg';
  /** The color variant of the spinner */
  variant?: 'default' | 'primary' | 'secondary' | 'muted';
  /** Additional CSS class names */
  className?: string;
}

/**
 * Loading spinner component
 */
export function Spinner({ 
  size = 'md', 
  variant = 'default',
  className 
}: SpinnerProps) {
  const sizeClass = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  const variantClass = {
    default: 'text-foreground',
    primary: 'text-primary',
    secondary: 'text-secondary',
    muted: 'text-muted-foreground'
  };

  return (
    <Loader2 
      className={cn(
        'animate-spin',
        sizeClass[size],
        variantClass[variant],
        className
      )} 
    />
  );
}

/**
 * Skeleton Loader Component
 * 
 * Displays a pulsing placeholder while content is loading
 * 
 * @example
 * ```tsx
 * <Skeleton className="h-10 w-full" />
 * ```
 */
interface SkeletonProps {
  /** Additional CSS class names */
  className?: string;
  /** Whether to show a shimmer effect */
  shimmer?: boolean;
}

/**
 * Skeleton placeholder for loading states
 */
export function Skeleton({ className, shimmer = true }: SkeletonProps) {
  return (
    <div 
      className={cn(
        "rounded-md bg-muted/60 dark:bg-muted/80",
        shimmer && "animate-pulse",
        className
      )} 
      aria-hidden="true"
    />
  );
}

/**
 * Loading State Component
 * 
 * Displays different states: loading, success, error or custom content
 * 
 * @example
 * ```tsx
 * <LoadingState 
 *   status="loading" 
 *   loadingText="Processing..." 
 *   successText="Completed!" 
 *   errorText="Failed to process" 
 * />
 * ```
 */
interface LoadingStateProps {
  /** Current status */
  status: 'loading' | 'success' | 'error' | 'idle';
  /** Text to display during loading */
  loadingText?: string;
  /** Text to display on success */
  successText?: string;
  /** Text to display on error */
  errorText?: string;
  /** Error message details */
  errorDetails?: string;
  /** Time to show success state before reverting to idle (ms) */
  successDuration?: number;
  /** Custom content to show when idle */
  children?: React.ReactNode;
  /** CSS class for container */
  className?: string;
  /** CSS class for the status icon */
  iconClassName?: string;
  /** CSS class for the text */
  textClassName?: string;
  /** Event handler for when success state completes */
  onSuccessComplete?: () => void;
}

/**
 * Component to handle different loading states with appropriate feedback
 */
export function LoadingState({
  status,
  loadingText = 'Loading...',
  successText = 'Success!',
  errorText = 'An error occurred',
  errorDetails,
  successDuration = 2000,
  children,
  className,
  iconClassName,
  textClassName,
  onSuccessComplete
}: LoadingStateProps) {
  // Success auto transition after duration
  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (status === 'success' && onSuccessComplete) {
      timer = setTimeout(() => {
        onSuccessComplete();
      }, successDuration);
    }
    return () => clearTimeout(timer);
  }, [status, successDuration, onSuccessComplete]);

  if (status === 'idle') {
    return <>{children}</> || null;
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {status === 'loading' && (
        <Spinner 
          size="sm" 
          className={cn("text-muted-foreground", iconClassName)} 
        />
      )}
      
      {status === 'success' && (
        <CheckCircle 
          className={cn("h-5 w-5 text-success", iconClassName)} 
        />
      )}
      
      {status === 'error' && (
        <AlertCircle 
          className={cn("h-5 w-5 text-destructive", iconClassName)} 
        />
      )}
      
      <div className="flex flex-col">
        <span className={cn("text-sm", textClassName)}>
          {status === 'loading' && loadingText}
          {status === 'success' && successText}
          {status === 'error' && errorText}
        </span>
        
        {status === 'error' && errorDetails && (
          <span className="text-xs text-muted-foreground">
            {errorDetails}
          </span>
        )}
      </div>
    </div>
  );
}
