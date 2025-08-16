import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { useUnifiedApiKeys } from '@/hooks/useUnifiedApiKeys';
import { API_PROVIDERS, ApiKeyType } from '@/types/api-keys/unified';

interface ApiKeyStatusDisplayProps {
  className?: string;
}

/**
 * Unified API Key Status Display Component
 * Shows real-time status of all API keys using the single source of truth
 */
export const ApiKeyStatusDisplay: React.FC<ApiKeyStatusDisplayProps> = ({ className }) => {
  const { statuses, isLoading, refreshStatuses, hasWorkingApis, workingApis } = useUnifiedApiKeys();

  const getStatusIcon = (status: any) => {
    if (status?.isWorking) {
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    }
    if (status?.exists) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
    return <XCircle className="h-4 w-4 text-muted-foreground" />;
  };

  const getStatusBadge = (status: any) => {
    if (status?.isWorking) {
      return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Active</Badge>;
    }
    if (status?.exists) {
      return <Badge variant="secondary">Configured</Badge>;
    }
    return <Badge variant="outline">Not Set</Badge>;
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-6">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading API key status...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>API Key Status</CardTitle>
            <CardDescription>
              Real-time status of your configured API keys
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshStatuses}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!hasWorkingApis && (
          <Alert className="mb-4" variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No working API keys found. Please add and validate API keys below to enable AI features. 
              All keys are now securely encrypted using Supabase Vault.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          {Object.keys(API_PROVIDERS).map((provider) => {
            const status = statuses[provider as ApiKeyType];
            return (
              <div
                key={provider}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(status)}
                  <div>
                    <p className="font-medium capitalize">{provider}</p>
                    {status?.lastChecked && (
                      <p className="text-xs text-muted-foreground">
                        Last checked: {new Date(status.lastChecked).toLocaleString()}
                      </p>
                    )}
                    {status?.errorMessage && (
                      <p className="text-xs text-destructive">{status.errorMessage}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(status)}
                  {status?.maskedKey && (
                    <span className="text-xs text-muted-foreground font-mono">
                      {status.maskedKey}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {hasWorkingApis && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <p className="text-sm text-emerald-800">
              ✅ {workingApis.length} working API key{workingApis.length !== 1 ? 's' : ''}: {workingApis.join(', ')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};