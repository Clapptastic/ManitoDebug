
import React from "react";
import { cn } from "@/lib/utils";
import { useSidebar } from "./SidebarContext";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Sidebar({ className, children, ...props }: SidebarProps) {
  const { state: sidebarState } = useSidebar();
  const isCollapsed = sidebarState === "collapsed";

  return (
    <aside
      className={cn(
        "h-screen flex flex-col border-r bg-background transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
        className
      )}
      {...props}
    >
      {children}
    </aside>
  );
}

export function SidebarHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("h-14 border-b flex items-center px-4", className)}
      {...props}
    />
  );
}

export function SidebarContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex-1 overflow-auto", className)} {...props} />;
}

export function SidebarFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4 border-t", className)} {...props} />;
}

export function SidebarSection({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("py-4", className)} {...props} />;
}

// Added SidebarNav component
export function SidebarNav({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <nav className={cn("flex flex-col gap-1", className)} {...props} />;
}
