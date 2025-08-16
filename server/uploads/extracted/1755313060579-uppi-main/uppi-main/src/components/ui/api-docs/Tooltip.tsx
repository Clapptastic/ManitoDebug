
import React from 'react';
import { Tooltip as ShadcnTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Documentation Tooltip Component
 * 
 * Displays helpful information to users via a tooltip triggered by a help icon
 * 
 * @component
 * @example
 * ```tsx
 * <DocTooltip
 *   content="This field accepts an API key from your OpenAI account."
 *   position="right"
 * />
 * ```
 */
interface DocTooltipProps {
  /** The tooltip content to display */
  content: React.ReactNode;
  /** The position of the tooltip relative to the trigger */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Custom CSS classes for the tooltip trigger */
  className?: string;
  /** Custom icon to use as the tooltip trigger */
  icon?: React.ReactNode;
  /** Whether to use a smaller icon */
  compact?: boolean;
}

/**
 * Documentation Tooltip Component
 * 
 * Displays help text in a tooltip when users hover over or focus on an icon
 */
export function DocTooltip({
  content,
  position = 'right',
  className,
  icon,
  compact = false
}: DocTooltipProps) {
  return (
    <TooltipProvider>
      <ShadcnTooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <span 
            className={cn(
              "inline-flex cursor-help text-muted-foreground hover:text-foreground transition-colors",
              compact ? "ml-1" : "ml-2",
              className
            )}
            tabIndex={0}
            aria-label="View help information"
          >
            {icon || <HelpCircle className={cn(compact ? "h-3 w-3" : "h-4 w-4")} />}
          </span>
        </TooltipTrigger>
        <TooltipContent 
          side={position} 
          className="max-w-xs text-sm bg-popover text-popover-foreground"
        >
          {content}
        </TooltipContent>
      </ShadcnTooltip>
    </TooltipProvider>
  );
}

/**
 * Field Label with Documentation Tooltip
 * 
 * Combines a form field label with an optional documentation tooltip
 * 
 * @example
 * ```tsx
 * <LabelWithTooltip 
 *   label="API Key" 
 *   tooltip="Enter your OpenAI API key here" 
 * />
 * ```
 */
export interface LabelWithTooltipProps {
  /** The label text */
  label: string;
  /** The tooltip content */
  tooltip?: React.ReactNode;
  /** Whether the field is required */
  required?: boolean;
  /** Custom CSS classes */
  className?: string;
}

/**
 * Field Label with Documentation Tooltip
 */
export function LabelWithTooltip({
  label,
  tooltip,
  required = false,
  className
}: LabelWithTooltipProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <span className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </span>
      {tooltip && <DocTooltip content={tooltip} compact />}
    </div>
  );
}
