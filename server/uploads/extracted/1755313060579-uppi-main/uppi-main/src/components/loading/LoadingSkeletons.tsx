import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const ApiKeyStatusSkeleton = memo(() => (
  <Card>
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
      <Skeleton className="h-6 w-16" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
      <Skeleton className="h-8 w-full" />
    </div>
  </Card>
));

ApiKeyStatusSkeleton.displayName = 'ApiKeyStatusSkeleton';

export const DashboardStatsSkeleton = memo(() => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <Card key={i}>
        <CardContent className="p-4">
          <Skeleton className="h-8 w-8 mb-2" />
          <Skeleton className="h-3 w-16" />
        </CardContent>
      </Card>
    ))}
  </div>
));

DashboardStatsSkeleton.displayName = 'DashboardStatsSkeleton';

export const ApiKeyGridSkeleton = memo(() => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    {Array.from({ length: 8 }).map((_, i) => (
      <ApiKeyStatusSkeleton key={i} />
    ))}
  </div>
));

ApiKeyGridSkeleton.displayName = 'ApiKeyGridSkeleton';

export const CompetitorAnalysisSkeleton = memo(() => (
  <div className="space-y-4">
    <Card>
      <div className="p-6 space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
    </Card>
    
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <div className="p-6 space-y-4">
            <Skeleton className="h-5 w-32" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  </div>
));

CompetitorAnalysisSkeleton.displayName = 'CompetitorAnalysisSkeleton';