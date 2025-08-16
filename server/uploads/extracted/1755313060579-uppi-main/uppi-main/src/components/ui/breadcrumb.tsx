
import * as React from "react"
import { ChevronRight, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

export interface BreadcrumbProps extends React.ComponentPropsWithoutRef<"nav"> {
  separator?: React.ReactNode
  children: React.ReactNode
}

export interface BreadcrumbListProps extends React.ComponentPropsWithoutRef<"ol"> {
  children: React.ReactNode
}

export interface BreadcrumbItemProps extends React.ComponentPropsWithoutRef<"li"> {
  children: React.ReactNode
}

export interface BreadcrumbLinkProps extends React.ComponentPropsWithoutRef<"span"> {
  asChild?: boolean
  children: React.ReactNode
}

export interface BreadcrumbPageProps
  extends React.ComponentPropsWithoutRef<"span"> {
  children: React.ReactNode
}

export interface BreadcrumbSeparatorProps extends React.ComponentPropsWithoutRef<"span"> {
  children?: React.ReactNode
  className?: string
}

export function Breadcrumb({
  separator = <ChevronRight className="h-4 w-4" />,
  children,
  className,
  ...props
}: BreadcrumbProps) {
  return (
    <nav
      aria-label="breadcrumb"
      className={cn("flex w-full items-center", className)}
      {...props}
    >
      {children}
    </nav>
  )
}

export function BreadcrumbList({
  children,
  className,
  ...props
}: BreadcrumbListProps) {
  return (
    <ol
      role="list"
      className={cn(
        "flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5",
        className
      )}
      {...props}
    >
      {children}
    </ol>
  )
}

export function BreadcrumbItem({
  children,
  className,
  ...props
}: BreadcrumbItemProps) {
  return (
    <li
      role="listitem"
      className={cn("inline-flex items-center gap-1.5", className)}
      {...props}
    >
      {children}
    </li>
  )
}

export function BreadcrumbLink({
  children,
  className,
  asChild = false,
  ...props
}: BreadcrumbLinkProps) {
  return (
    <span
      className={cn("hover:text-foreground transition-colors", className)}
      {...props}
    >
      {children}
    </span>
  )
}

export function BreadcrumbSeparator({
  children = <ChevronRight className="h-4 w-4" />,
  className,
  ...props
}: BreadcrumbSeparatorProps) {
  return (
    <span
      role="presentation"
      aria-hidden="true"
      className={cn("[&>svg]:size-3.5", className)}
      {...props}
    >
      {children}
    </span>
  )
}

export function BreadcrumbPage({
  children,
  className,
  ...props
}: BreadcrumbPageProps) {
  return (
    <span
      aria-current="page"
      className={cn("font-normal text-foreground", className)}
      {...props}
    >
      {children}
    </span>
  )
}

