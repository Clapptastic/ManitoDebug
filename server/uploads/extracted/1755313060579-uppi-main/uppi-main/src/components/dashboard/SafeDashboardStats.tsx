import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { DashboardStats } from './DashboardStats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

/**
 * Safe wrapper for DashboardStats that shows graceful error fallback
 * instead of crashing the entire app
 */

function DashboardStatsErrorFallback({ error, resetErrorBoundary }: { error: Error, resetErrorBoundary: () => void }) {
  React.useEffect(() => {
    // Show a toast notification about the stats being unavailable
    toast({
      title: 'Dashboard Stats Temporarily Unavailable',
      description: 'Some dashboard statistics are currently unavailable. Your data is safe.',
      variant: 'default',
    });
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="border-orange-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            Dashboard Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground mb-3">
            Statistics are temporarily unavailable
          </div>
          <Button 
            onClick={resetErrorBoundary}
            variant="outline" 
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </Button>
        </CardContent>
      </Card>
      
      {/* Show placeholder cards for the other stats */}
      {[1, 2, 3].map((i) => (
        <Card key={i} className="opacity-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">---</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">---</div>
            <p className="text-xs text-muted-foreground">Data unavailable</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export const SafeDashboardStats: React.FC = () => {
  return (
    <ErrorBoundary
      FallbackComponent={DashboardStatsErrorFallback}
      onError={(error, errorInfo) => {
        console.error('Dashboard Stats Error (isolated):', error, errorInfo);
        // Don't propagate to outer error boundary
      }}
    >
      <DashboardStats />
    </ErrorBoundary>
  );
};

export default SafeDashboardStats;