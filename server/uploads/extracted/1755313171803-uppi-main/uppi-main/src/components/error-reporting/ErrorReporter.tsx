
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Copy, Trash2, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { errorMonitoringService } from '@/services/monitoring/errorMonitoringService';

interface ErrorReport {
  id: string;
  timestamp: string;
  message: string;
  stack?: string;
  source: string;
  component?: string;
  route?: string;
  userAgent?: string;
  details?: Record<string, any>;
}

interface ErrorReporterProps {
  errors?: ErrorReport[];
  onClearErrors?: () => void;
  onRefresh?: () => void;
}

const ErrorReporter: React.FC<ErrorReporterProps> = ({
  errors = [],
  onClearErrors,
  onRefresh
}) => {
  const [localErrors, setLocalErrors] = useState<ErrorReport[]>([]);

  useEffect(() => {
    // Listen for global errors
    const handleError = (event: ErrorEvent) => {
      const errorReport: ErrorReport = {
        id: `error-${Date.now()}`,
        timestamp: new Date().toISOString(),
        message: event.message,
        stack: event.error?.stack,
        source: 'javascript',
        route: window.location.pathname,
        userAgent: navigator.userAgent,
        details: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      };
      
      setLocalErrors(prev => [...prev, errorReport]);
      console.error('[ErrorReporter] JavaScript Error:', errorReport);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const errorReport: ErrorReport = {
        id: `promise-${Date.now()}`,
        timestamp: new Date().toISOString(),
        message: event.reason?.message || 'Unhandled Promise Rejection',
        stack: event.reason?.stack,
        source: 'promise',
        route: window.location.pathname,
        userAgent: navigator.userAgent,
        details: {
          reason: event.reason
        }
      };
      
      setLocalErrors(prev => [...prev, errorReport]);
      console.error('[ErrorReporter] Promise Rejection:', errorReport);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const allErrors = [...errors, ...localErrors];

  const copyErrorsToClipboard = async () => {
    try {
      const errorText = allErrors.map(error => 
        `[${error.timestamp}] ${error.source.toUpperCase()}: ${error.message}\n` +
        `Route: ${error.route || 'unknown'}\n` +
        `Component: ${error.component || 'unknown'}\n` +
        `Stack: ${error.stack || 'No stack trace'}\n` +
        `Details: ${JSON.stringify(error.details, null, 2)}\n\n`
      ).join('');
      
      await navigator.clipboard.writeText(errorText);
      toast({
        title: 'Errors copied',
        description: 'All error details have been copied to clipboard.',
      });
    } catch (err) {
      toast({
        title: 'Copy failed',
        description: 'Failed to copy error details to clipboard.',
        variant: 'destructive'
      });
    }
  };

  const clearAllErrors = () => {
    setLocalErrors([]);
    if (onClearErrors) {
      onClearErrors();
    }
  };

  const getSourceColor = (source: string) => {
    switch (source.toLowerCase()) {
      case 'javascript':
      case 'typescript':
        return 'bg-red-100 text-red-800';
      case 'api':
        return 'bg-blue-100 text-blue-800';
      case 'database':
        return 'bg-green-100 text-green-800';
      case 'promise':
        return 'bg-yellow-100 text-yellow-800';
      case 'component':
      case 'react':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString();
    } catch {
      return 'Invalid time';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Error Reporter ({allErrors.length})
          </CardTitle>
          <div className="flex gap-2">
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={copyErrorsToClipboard}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={clearAllErrors}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          {allErrors.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No errors detected
            </div>
          ) : (
            <div className="space-y-3 p-4">
              {allErrors.map((error) => (
                <div key={error.id} className="border rounded-lg p-3 bg-muted/20">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getSourceColor(error.source)}>
                        {error.source}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(error.timestamp)}
                      </span>
                      {error.route && (
                        <Badge variant="outline" className="text-xs">
                          {error.route}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-red-600 break-words">
                      {error.message}
                    </p>
                    
                    {error.component && (
                      <p className="text-xs text-muted-foreground">
                        Component: {error.component}
                      </p>
                    )}
                    
                    {error.stack && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                          Stack trace
                        </summary>
                        <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto whitespace-pre-wrap">
                          {error.stack}
                        </pre>
                      </details>
                    )}
                    
                    {error.details && Object.keys(error.details).length > 0 && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                          Error details
                        </summary>
                        <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                          {JSON.stringify(error.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ErrorReporter;
