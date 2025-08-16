import { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { ApiKeyType } from '@/types/api-keys/unified';
import { type ApiKeyStatus } from '@/services/api-keys/unifiedApiKeyService';

interface ApiKeyStatusCardProps {
  provider: ApiKeyType;
  status: ApiKeyStatus;
  onRefresh?: (provider: ApiKeyType) => void;
  isRefreshing?: boolean;
}

const StatusIcon = memo(({ status }: { status: string }) => {
  switch (status) {
    case 'active':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'error':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'pending':
      return <Clock className="h-4 w-4 text-yellow-500" />;
    default:
      return <AlertTriangle className="h-4 w-4 text-gray-500" />;
  }
});

StatusIcon.displayName = 'StatusIcon';

const StatusBadge = memo(({ status, isWorking }: { status: string; isWorking: boolean }) => {
  const variant = useMemo(() => {
    if (status === 'active' && isWorking) return 'default';
    if (status === 'error') return 'destructive';
    if (status === 'pending') return 'secondary';
    return 'outline';
  }, [status, isWorking]);

  const label = useMemo(() => {
    if (status === 'active' && isWorking) return 'Working';
    if (status === 'active' && !isWorking) return 'Configured';
    if (status === 'error') return 'Error';
    if (status === 'pending') return 'Pending';
    return 'Unconfigured';
  }, [status, isWorking]);

  return (
    <Badge variant={variant}>
      {label}
    </Badge>
  );
});

StatusBadge.displayName = 'StatusBadge';

export const ApiKeyStatusCard = memo<ApiKeyStatusCardProps>(({
  provider,
  status,
  onRefresh,
  isRefreshing = false
}) => {
  const formattedProvider = useMemo(() => 
    provider.charAt(0).toUpperCase() + provider.slice(1)
  , [provider]);

  const lastCheckedFormatted = useMemo(() => {
    if (!status.lastChecked) return 'Never';
    try {
      return new Date(status.lastChecked).toLocaleString();
    } catch {
      return 'Invalid date';
    }
  }, [status.lastChecked]);

  const handleRefresh = useMemo(() => 
    onRefresh ? () => onRefresh(provider) : undefined
  , [onRefresh, provider]);

  if (isRefreshing) {
    return (
      <Card className="h-full">
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
    );
  }

  return (
    <Card className="h-full transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            {formattedProvider}
          </CardTitle>
          <StatusIcon status={status.status} />
        </div>
        <StatusBadge status={status.status} isWorking={status.isWorking} />
      </CardHeader>
      <CardContent className="space-y-3">
        {status.maskedKey && (
          <div className="text-xs text-muted-foreground">
            Key: {status.maskedKey}
          </div>
        )}
        <div className="text-xs text-muted-foreground">
          Last checked: {lastCheckedFormatted}
        </div>
        {status.errorMessage && (
          <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
            {status.errorMessage}
          </div>
        )}
        {handleRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="w-full"
          >
            Refresh
          </Button>
        )}
      </CardContent>
    </Card>
  );
});

ApiKeyStatusCard.displayName = 'ApiKeyStatusCard';