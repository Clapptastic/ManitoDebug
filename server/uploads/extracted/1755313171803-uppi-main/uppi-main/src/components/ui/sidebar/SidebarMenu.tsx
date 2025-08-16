
import * as React from "react";
import { cn } from "@/lib/utils";

interface SidebarMenuProps extends React.HTMLAttributes<HTMLDivElement> {}

export function SidebarMenu({ className, ...props }: SidebarMenuProps) {
  return <div className={cn("space-y-1", className)} {...props} />;
}

interface SidebarMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {}

export function SidebarMenuItem({ className, ...props }: SidebarMenuItemProps) {
  return <div className={cn("", className)} {...props} />;
}

interface SidebarMenuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  children: React.ReactNode;
}

export function SidebarMenuButton({
  className,
  active = false,
  children,
  ...props
}: SidebarMenuButtonProps) {
  return (
    <button
      className={cn(
        "flex w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-all",
        active
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-3">{children}</div>
    </button>
  );
}

interface SidebarMenuGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  children: React.ReactNode;
}

export function SidebarMenuGroup({
  label,
  className,
  children,
  ...props
}: SidebarMenuGroupProps) {
  return (
    <div className={cn("mb-4", className)} {...props}>
      {label && (
        <h3 className="px-3 mb-2 text-xs font-semibold text-foreground/70">{label}</h3>
      )}
      {children}
    </div>
  );
}
