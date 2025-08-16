import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const ReportSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-24" />
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-24" />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-20" />
          </div>
        </div>

        {/* Metadata Skeleton */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Navigation Skeleton */}
        <div className="flex gap-1 border-b">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-20" />
          ))}
        </div>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-6 w-32 mb-4" />
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export const MetricSkeleton: React.FC = () => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-8 w-16 mb-1" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-12 w-12 rounded-lg" />
      </div>
    </CardContent>
  </Card>
);

export const InsightSkeleton: React.FC = () => (
  <Card>
    <CardContent className="pt-6">
      <Skeleton className="h-6 w-32 mb-4" />
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-start gap-2">
            <Skeleton className="h-2 w-2 rounded-full mt-2" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export const ErrorFallback: React.FC<{ error: string; onRetry: () => void }> = ({ 
  error, 
  onRetry 
}) => (
  <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-lg mx-auto">
        <CardContent className="pt-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-red-600 text-2xl">⚠</span>
          </div>
          <h3 className="text-lg font-semibold mb-2">Failed to Load Analysis</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button 
            onClick={onRetry}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </CardContent>
      </Card>
    </div>
  </div>
);