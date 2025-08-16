
import * as React from "react";
import { cn } from "@/lib/utils";

export type StepStatus = 'incomplete' | 'current' | 'complete' | 'error';

interface StepProps extends React.HTMLAttributes<HTMLDivElement> {
  status?: StepStatus;
  children: React.ReactNode;
}

/**
 * Step component for multi-step processes
 * Displays a step with appropriate styling based on its status
 */
export const Step = React.forwardRef<HTMLDivElement, StepProps>(
  ({ className, status = 'incomplete', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "py-2 px-3 rounded-md font-medium text-sm transition-colors",
          status === 'incomplete' && "text-muted-foreground bg-muted/40",
          status === 'current' && "text-primary-foreground bg-primary",
          status === 'complete' && "text-green-700 bg-green-100",
          status === 'error' && "text-red-700 bg-red-100",
          className
        )}
        data-status={status}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Step.displayName = "Step";

export default Step;
