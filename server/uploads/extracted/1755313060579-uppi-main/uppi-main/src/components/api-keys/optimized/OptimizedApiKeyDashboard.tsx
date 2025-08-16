import { memo, useMemo, lazy, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useUnifiedApiKeys } from '@/hooks/useUnifiedApiKeys';
import { API_PROVIDERS, ApiKeyType } from '@/types/api-keys/unified';

// Lazy load the status card for better performance
const ApiKeyStatusCard = lazy(() => 
  import('./ApiKeyStatusCard').then(module => ({ 
    default: module.ApiKeyStatusCard 
  }))
);

const StatusCardSkeleton = memo(() => (
  <Card>
    <CardHeader className="space-y-2">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-6 w-16" />
    </CardHeader>
    <CardContent className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-8 w-20" />
    </CardContent>
  </Card>
));

StatusCardSkeleton.displayName = 'StatusCardSkeleton';

const ErrorDisplay = memo(({ error }: { error: string }) => (
  <Alert variant="destructive">
    <AlertTriangle className="h-4 w-4" />
    <AlertDescription>
      Failed to load API key statuses: {error}
    </AlertDescription>
  </Alert>
));

ErrorDisplay.displayName = 'ErrorDisplay';

export const OptimizedApiKeyDashboard = memo(() => {
  const {
    statuses,
    isLoading: isStatusLoading,
    error,
    validateProvider,
    hasWorkingApis,
    workingApis
  } = useUnifiedApiKeys();

  const sortedProviders = useMemo(() => {
    return Object.keys(API_PROVIDERS).sort((a, b) => {
      const aStatus = statuses[a as ApiKeyType];
      const bStatus = statuses[b as ApiKeyType];
      
      // Working APIs first
      if (aStatus?.isWorking && !bStatus?.isWorking) return -1;
      if (!aStatus?.isWorking && bStatus?.isWorking) return 1;
      
      // Then by alphabetical order
      return a.localeCompare(b);
    });
  }, [statuses]);

  const summaryStats = useMemo(() => ({
    total: Object.keys(API_PROVIDERS).length,
    working: workingApis.length,
    configured: Object.values(statuses).filter(s => s.exists).length,
    errors: Object.values(statuses).filter(s => s.status === 'error').length
  }), [statuses, workingApis.length]);

  if (error) {
    return <ErrorDisplay error={error} />;
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {summaryStats.working}
            </div>
            <div className="text-sm text-muted-foreground">Working</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {summaryStats.configured}
            </div>
            <div className="text-sm text-muted-foreground">Configured</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {summaryStats.errors}
            </div>
            <div className="text-sm text-muted-foreground">Errors</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-600">
              {summaryStats.total}
            </div>
            <div className="text-sm text-muted-foreground">Total</div>
          </CardContent>
        </Card>
      </div>

      {/* API Key Status Grid */}
      <div>
        <CardHeader className="px-0">
          <CardTitle>API Key Status</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedProviders.map((provider) => (
            <Suspense key={provider} fallback={<StatusCardSkeleton />}>
              <ApiKeyStatusCard
                provider={provider as ApiKeyType}
                status={statuses[provider as ApiKeyType] || {
                  status: 'unconfigured',
                  exists: false,
                  isActive: false,
                  isWorking: false,
                  lastChecked: new Date().toISOString(),
                  errorMessage: null,
                  isConfigured: false
                }}
                onRefresh={validateProvider}
                isRefreshing={isStatusLoading}
              />
            </Suspense>
          ))}
        </div>
      </div>

      {/* Working APIs Quick Access */}
      {hasWorkingApis && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Ready for Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {workingApis.map((api) => (
                <span
                  key={api}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                >
                  {api}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
});

OptimizedApiKeyDashboard.displayName = 'OptimizedApiKeyDashboard';