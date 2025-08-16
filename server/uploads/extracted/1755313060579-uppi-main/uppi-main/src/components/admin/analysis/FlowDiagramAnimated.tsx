import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export type DiagramStatus = 'idle' | 'running' | 'success' | 'warning' | 'error';

export interface DiagramStep {
  id: string;
  name: string;
  status: DiagramStatus;
}

interface Props {
  steps: DiagramStep[];
  onRefresh?: () => void;
  loading?: boolean;
}

const statusIcon = (status: DiagramStatus) => {
  switch (status) {
    case 'success':
      return <CheckCircle className="h-4 w-4" />;
    case 'error':
      return <XCircle className="h-4 w-4" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4" />;
    case 'running':
      return <Clock className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

const statusCls = (status: DiagramStatus) =>
  status === 'success'
    ? 'bg-green-500/10 text-green-600 border-green-500/20'
    : status === 'error'
    ? 'bg-red-500/10 text-red-600 border-red-500/20'
    : status === 'warning'
    ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
    : status === 'running'
    ? 'bg-purple-500/10 text-purple-600 border-purple-500/20 animate-pulse'
    : 'bg-muted text-muted-foreground border-border';

export const FlowDiagramAnimated: React.FC<Props> = ({ steps, onRefresh, loading }) => {
  return (
    <section aria-label="Competitor Analysis Flow" className="w-full mb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold tracking-tight">Pipeline Overview</h2>
        <div className="flex items-center gap-3">
          <TooltipProvider>
            <div className="hidden md:flex items-center gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-green-500/30" />
                    <span className="hidden sm:inline">Success</span>
                  </span>
                </TooltipTrigger>
                <TooltipContent>Step completed successfully</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-red-500/30" />
                    <span className="hidden sm:inline">Error</span>
                  </span>
                </TooltipTrigger>
                <TooltipContent>Step failed with an error</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-amber-500/30" />
                    <span className="hidden sm:inline">Warning</span>
                  </span>
                </TooltipTrigger>
                <TooltipContent>Step completed with warnings</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-full bg-purple-500 ring-2 ring-purple-500/30 animate-pulse" />
                    <span className="hidden sm:inline">Running</span>
                  </span>
                </TooltipTrigger>
                <TooltipContent>Step is currently running</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30 ring-2 ring-border/40" />
                    <span className="hidden sm:inline">Idle</span>
                  </span>
                </TooltipTrigger>
                <TooltipContent>Step has not started</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
          {onRefresh && (
            <Button size="sm" variant="outline" onClick={onRefresh} disabled={Boolean(loading)}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          )}
        </div>
      </div>
      <div className="relative grid gap-4 md:grid-cols-3 lg:grid-cols-4" role="list" aria-label="Pipeline steps">
        {steps.map((s, idx) => (
          <div key={s.id} className="group hover-scale">
            <div className={`rounded-lg border p-3 transition-colors ${statusCls(s.status)} animate-fade-in`}> 
              <div className="flex items-center gap-2">
                <Badge variant={s.status === 'success' ? 'default' : 'secondary'} className="shrink-0">
                  {statusIcon(s.status)}
                </Badge>
                <span className="text-sm font-medium">{s.name}</span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-muted-foreground/10 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    s.status === 'success'
                      ? 'bg-green-500'
                      : s.status === 'error'
                      ? 'bg-red-500'
                      : s.status === 'warning'
                      ? 'bg-amber-500'
                      : s.status === 'running'
                      ? 'bg-purple-500 animate-pulse'
                      : 'bg-muted-foreground/30'
                  }`}
                  style={{ width: s.status === 'success' ? '100%' : s.status === 'running' ? '70%' : s.status === 'warning' ? '50%' : s.status === 'error' ? '20%' : '10%' }}
                />
              </div>
            </div>
            {/* Connector */}
            {idx < steps.length - 1 && (
              <div className="hidden md:block absolute top-1/2 right-[-8px] md:right-[-12px] h-0.5 w-4 md:w-6 bg-border" aria-hidden="true" />
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default FlowDiagramAnimated;
