import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, Loader2, AlertTriangle } from 'lucide-react';
import type { FlowStep } from '../ModernFlowMonitor';

interface FlowStepCardProps {
  step: FlowStep;
}

const getStatusIcon = (status: FlowStep['status']) => {
  switch (status) {
    case 'success':
      return <CheckCircle className="h-4 w-4 text-success" />;
    case 'error':
      return <XCircle className="h-4 w-4 text-destructive" />;
    case 'running':
      return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-warning" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
};

const getStatusBadge = (status: FlowStep['status']) => {
  const variants = {
    success: 'success' as const,
    error: 'destructive' as const,
    running: 'default' as const,
    warning: 'warning' as const,
    idle: 'secondary' as const,
  };

  return (
    <Badge variant={variants[status]} className="text-xs">
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

export const FlowStepCard: React.FC<FlowStepCardProps> = ({ step }) => {
  return (
    <Card className={`transition-all duration-200 ${
      step.status === 'running' ? 'ring-2 ring-primary/20 bg-primary/5' :
      step.status === 'success' ? 'border-success/30 bg-success/5' :
      step.status === 'error' ? 'border-destructive/30 bg-destructive/5' :
      step.status === 'warning' ? 'border-warning/30 bg-warning/5' :
      'hover:border-border/60'
    }`}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                step.status === 'success' ? 'bg-success/10 text-success' :
                step.status === 'error' ? 'bg-destructive/10 text-destructive' :
                step.status === 'running' ? 'bg-primary/10 text-primary' :
                step.status === 'warning' ? 'bg-warning/10 text-warning' :
                'bg-muted text-muted-foreground'
              }`}>
                {step.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm text-foreground truncate">
                  {step.name}
                </h4>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {step.description}
                </p>
              </div>
            </div>
            {getStatusIcon(step.status)}
          </div>

          {/* Status and Duration */}
          <div className="flex items-center justify-between">
            {getStatusBadge(step.status)}
            {step.duration && (
              <span className="text-xs text-muted-foreground">
                {Math.round(step.duration)}ms
              </span>
            )}
          </div>

          {/* Error Message */}
          {step.error && (
            <div className="p-2 rounded-md bg-destructive/10 border border-destructive/20">
              <p className="text-xs text-destructive font-medium">Error:</p>
              <p className="text-xs text-destructive/80 mt-1">{step.error}</p>
            </div>
          )}

          {/* Success Data Preview */}
          {step.status === 'success' && step.data && (
            <div className="p-2 rounded-md bg-success/10 border border-success/20">
              <p className="text-xs text-success font-medium">
                ✓ Completed successfully
              </p>
              {typeof step.data === 'object' && (
                <p className="text-xs text-success/80 mt-1">
                  {Object.keys(step.data).length} data fields processed
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};