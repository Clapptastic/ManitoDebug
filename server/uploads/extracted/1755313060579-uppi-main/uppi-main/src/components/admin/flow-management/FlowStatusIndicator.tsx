import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle2, AlertCircle, XCircle, MinusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PromptFlowStatus } from '@/services/flowManagementService';

interface FlowStatusIndicatorProps {
  status: PromptFlowStatus;
  variant?: 'badge' | 'icon' | 'compact';
  className?: string;
}

const STATUS_CONFIGS = {
  active: {
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-200',
    label: 'Active in all flows',
    description: 'This prompt is active in all assigned flows'
  },
  partial: {
    icon: AlertCircle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-200',
    label: 'Partially active',
    description: 'This prompt is active in some flows but not others'
  },
  inactive: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-200',
    label: 'Inactive in flows',
    description: 'This prompt is inactive in all assigned flows'
  },
  unassigned: {
    icon: MinusCircle,
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200',
    label: 'Not assigned',
    description: 'This prompt is not assigned to any flows'
  }
};

export const FlowStatusIndicator: React.FC<FlowStatusIndicatorProps> = ({
  status,
  variant = 'badge',
  className
}) => {
  const config = STATUS_CONFIGS[status.status];
  const Icon = config.icon;

  const tooltipContent = (
    <div className="space-y-2">
      <div className="font-medium">{config.description}</div>
      {status.total_assignments > 0 && (
        <div className="text-sm">
          <div>Total assignments: {status.total_assignments}</div>
          <div>Active assignments: {status.active_assignments}</div>
        </div>
      )}
      {status.flows.length > 0 && (
        <div className="space-y-1">
          <div className="text-sm font-medium">Flow assignments:</div>
          {status.flows.map((flow, index) => (
            <div key={index} className="text-sm flex items-center gap-2">
              <span className={cn(
                "w-2 h-2 rounded-full",
                flow.is_active_in_flow ? "bg-green-500" : "bg-red-500"
              )} />
              {flow.flow_name}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (variant === 'icon') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Icon className={cn("h-4 w-4", config.color, className)} />
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            {tooltipContent}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (variant === 'compact') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-md text-xs",
              config.bgColor,
              config.borderColor,
              "border",
              className
            )}>
              <Icon className="h-3 w-3" />
              <span>{status.active_assignments}/{status.total_assignments}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            {tooltipContent}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Default badge variant
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={cn(
              "gap-1",
              config.color,
              config.bgColor,
              config.borderColor,
              className
            )}
          >
            <Icon className="h-3 w-3" />
            {config.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};