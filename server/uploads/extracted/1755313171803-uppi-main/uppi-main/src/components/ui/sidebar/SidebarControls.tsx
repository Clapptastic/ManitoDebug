
import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Menu } from "lucide-react";
import { useSidebar } from "./SidebarContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const SidebarTrigger = React.forwardRef<
  React.ElementRef<typeof Button>,
  React.ComponentProps<typeof Button>
>(({ className, onClick, ...props }, ref) => {
  const { toggleSidebar, state, isMobile } = useSidebar();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            ref={ref}
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8", className)}
            onClick={(event) => {
              onClick?.(event);
              toggleSidebar();
            }}
            {...props}
          >
            {isMobile ? (
              <Menu className="h-4 w-4" />
            ) : state === "expanded" ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <span className="sr-only">Toggle Sidebar</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          {state === "expanded" ? "Collapse sidebar" : "Expand sidebar"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

SidebarTrigger.displayName = "SidebarTrigger";

// Overlay for mobile sidebar for better UX
export const SidebarOverlay = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, onClick, ...props }, ref) => {
  const { state, toggleSidebar, isMobile } = useSidebar();
  
  if (!isMobile || state !== "expanded") return null;
  
  return (
    <div
      ref={ref}
      className={cn(
        "fixed inset-0 z-40 bg-background/80 backdrop-blur-sm",
        className
      )}
      onClick={(e) => {
        onClick?.(e);
        toggleSidebar();
      }}
      {...props}
    />
  );
});

SidebarOverlay.displayName = "SidebarOverlay";
