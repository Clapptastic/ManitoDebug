import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <Loader2 className={`animate-spin ${sizeClasses[size]} ${className}`} />
  );
};

interface LoadingStateProps {
  title?: string;
  description?: string;
  progress?: number;
  showProgress?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  title = 'Loading...',
  description,
  progress,
  showProgress = false
}) => {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <LoadingSpinner size="lg" />
        </div>
        <CardTitle>{title}</CardTitle>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      {showProgress && typeof progress === 'number' && (
        <CardContent>
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-xs text-center text-muted-foreground">
              {Math.round(progress)}% complete
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export const SkeletonLoader: React.FC<{ 
  lines?: number; 
  className?: string;
}> = ({ lines = 3, className = '' }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </div>
  );
};

export const TableSkeleton: React.FC<{ 
  rows?: number; 
  cols?: number; 
}> = ({ rows = 5, cols = 4 }) => {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-2">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-8 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
};

export const CardSkeleton: React.FC<{ className?: string }> = ({ 
  className = '' 
}) => {
  return (
    <Card className={className}>
      <CardHeader>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent>
        <SkeletonLoader lines={3} />
      </CardContent>
    </Card>
  );
};

export default LoadingSpinner;