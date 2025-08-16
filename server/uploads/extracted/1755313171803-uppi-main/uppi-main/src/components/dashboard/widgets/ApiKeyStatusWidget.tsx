
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw } from 'lucide-react';
import { useUnifiedApiKeys } from '@/hooks/useUnifiedApiKeys';

export const ApiKeyStatusWidget = () => {
  const { statuses: apiStatuses, isLoading: loading, refreshStatuses: refreshApiStatus } = useUnifiedApiKeys();

  const getProviderCount = () => {
    if (!apiStatuses || loading) return { total: 0, working: 0 };

    const providers = Object.keys(apiStatuses);
    const workingProviders = providers.filter(key => {
      const status = apiStatuses[key];
      return status && status.isWorking === true;
    });
    
    return {
      total: providers.length,
      working: workingProviders.length,
    };
  };
  
  const { total, working } = getProviderCount();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">API Key Status</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded animate-pulse w-3/4"></div>
            <div className="h-4 bg-muted rounded animate-pulse w-1/2"></div>
          </div>
        ) : total > 0 ? (
          <div>
            <div className="text-2xl font-bold">
              {working} / {total}
            </div>
            <p className="text-xs text-muted-foreground">API keys active</p>
            <div className="mt-2 space-y-1">
              {Object.entries(apiStatuses).map(([provider, status]) => {
                const isWorking = status?.isWorking === true;
                const statusText = status?.status || 'unknown';
                
                return (
                  <div key={provider} className="flex justify-between items-center">
                    <span className="text-xs capitalize">{provider}</span>
                    <Badge variant={isWorking ? "default" : "destructive"} className="text-[10px]">
                      {statusText}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="text-muted-foreground text-sm mb-1">
              🔑 No API keys configured
            </div>
            <p className="text-xs text-center">
              Set up keys to unlock AI features
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-1">
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full text-xs"
          onClick={() => refreshApiStatus()}
        >
          <RefreshCw className="h-3 w-3 mr-1" /> Refresh Status
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ApiKeyStatusWidget;
