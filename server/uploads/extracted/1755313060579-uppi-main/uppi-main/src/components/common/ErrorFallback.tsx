import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
  componentName?: string;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  resetErrorBoundary, 
  componentName = 'Component' 
}) => {
  console.error(`${componentName} Error:`, error);

  return (
    <Card className="max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          {componentName} Error
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Something went wrong while loading this component.
        </p>
        
        <details className="text-xs bg-muted p-2 rounded">
          <summary className="cursor-pointer font-medium mb-2">Error Details</summary>
          <pre className="whitespace-pre-wrap break-words">
            {error.message}
          </pre>
        </details>
        
        <Button 
          onClick={resetErrorBoundary}
          className="w-full"
          variant="outline"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </CardContent>
    </Card>
  );
};