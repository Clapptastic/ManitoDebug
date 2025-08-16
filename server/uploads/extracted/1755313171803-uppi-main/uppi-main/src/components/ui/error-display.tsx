
import { AlertCircle, RefreshCw, AlertTriangle, XCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface ErrorDisplayProps {
  error: Error | string;
  title?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  variant?: 'error' | 'warning' | 'info';
  className?: string;
}

export default function ErrorDisplay({
  error,
  title,
  onRetry,
  onDismiss,
  variant = 'error',
  className = ''
}: ErrorDisplayProps) {
  const errorMessage = typeof error === 'string' ? error : error.message;
  
  const getErrorIcon = () => {
    switch (variant) {
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />;
      case 'info':
        return <AlertCircle className="h-5 w-5" />;
      case 'error':
      default:
        return <XCircle className="h-5 w-5" />;
    }
  };
  
  const getErrorTitle = () => {
    if (title) return title;
    
    switch (variant) {
      case 'warning':
        return 'Warning';
      case 'info':
        return 'Information';
      case 'error':
      default:
        return 'Error';
    }
  };
  
  const getAlertVariant = () => {
    switch (variant) {
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      case 'error':
      default:
        return 'destructive';
    }
  };
  
  return (
    <Alert variant={getAlertVariant() as any} className={className}>
      <div className="flex justify-between items-start">
        <div className="flex gap-3">
          {getErrorIcon()}
          <div>
            <AlertTitle>{getErrorTitle()}</AlertTitle>
            <AlertDescription>
              {errorMessage}
            </AlertDescription>
          </div>
        </div>
        
        <div className="flex gap-2">
          {onRetry && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRetry}
              className="h-8"
            >
              <RefreshCw className="h-3 w-3 mr-2" />
              Retry
            </Button>
          )}
          
          {onDismiss && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onDismiss}
              className="h-8"
            >
              Dismiss
            </Button>
          )}
        </div>
      </div>
    </Alert>
  );
}
