
import { cn } from "@/lib/utils";
import React from "react";

/**
 * Responsive Container Component
 * 
 * Provides consistent padding and responsiveness for content containers
 * 
 * @example
 * ```tsx
 * <ResponsiveContainer>
 *   <h1>Content Title</h1>
 *   <p>Content body...</p>
 * </ResponsiveContainer>
 * ```
 */
interface ResponsiveContainerProps {
  /** Content to be displayed within the container */
  children: React.ReactNode;
  /** Additional CSS class names */
  className?: string;
  /** Whether to use full width at all breakpoints */
  fullWidth?: boolean;
  /** Whether to use less padding */
  compact?: boolean;
}

/**
 * A responsive container component that provides consistent layout across screen sizes
 */
export function ResponsiveContainer({
  children,
  className,
  fullWidth = false,
  compact = false
}: ResponsiveContainerProps) {
  return (
    <div
      className={cn(
        "w-full",
        fullWidth ? "px-4 sm:px-6 lg:px-8" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
        compact ? "py-4" : "py-6 sm:py-8 md:py-10",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Responsive Grid Container
 * 
 * Creates a responsive grid layout that adjusts columns based on screen size
 * 
 * @example
 * ```tsx
 * <ResponsiveGrid columns={{ default: 1, sm: 2, lg: 3 }}>
 *   <Card />
 *   <Card />
 *   <Card />
 * </ResponsiveGrid>
 * ```
 */
interface ResponsiveGridProps {
  /** Content to be displayed within the grid */
  children: React.ReactNode;
  /** Column configuration for different breakpoints */
  columns?: {
    default: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  /** Gap between grid items */
  gap?: 'none' | 'sm' | 'md' | 'lg';
  /** Additional CSS class names */
  className?: string;
}

/**
 * A responsive grid component that adjusts columns based on screen size
 */
export function ResponsiveGrid({
  children,
  columns = { default: 1, sm: 2, md: 3, lg: 4 },
  gap = 'md',
  className
}: ResponsiveGridProps) {
  // Map gap values to CSS classes
  const gapClasses = {
    none: 'gap-0',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6'
  };

  // Create column class based on config
  const columnClasses = [
    `grid-cols-${columns.default}`,
    columns.sm && `sm:grid-cols-${columns.sm}`,
    columns.md && `md:grid-cols-${columns.md}`,
    columns.lg && `lg:grid-cols-${columns.lg}`,
    columns.xl && `xl:grid-cols-${columns.xl}`
  ].filter(Boolean).join(' ');

  return (
    <div
      className={cn(
        'grid',
        columnClasses,
        gapClasses[gap],
        className
      )}
    >
      {children}
    </div>
  );
}
