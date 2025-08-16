
import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { FileSearch, Info, SearchX, AlertCircle } from 'lucide-react';

/**
 * Empty State Component
 * 
 * Displays a message when there is no data to show
 * 
 * @example
 * ```tsx
 * <EmptyState 
 *   title="No results found" 
 *   description="Try adjusting your search parameters"
 *   action={<Button>Clear filters</Button>}
 * />
 * ```
 */
interface EmptyStateProps {
  /** Title of the empty state */
  title: string;
  /** Description text */
  description?: string;
  /** Action button or element */
  action?: React.ReactNode;
  /** The variant/type of empty state */
  variant?: 'default' | 'search' | 'filter' | 'error';
  /** Icon to display */
  icon?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show with minimal styling */
  minimal?: boolean;
}

/**
 * Empty state component for displaying when no data is available
 */
export function EmptyState({
  title,
  description,
  action,
  variant = 'default',
  icon,
  className,
  minimal = false
}: EmptyStateProps) {
  // Default icons based on variant
  const getIcon = () => {
    if (icon) return icon;
    
    switch (variant) {
      case 'search':
        return <SearchX className="h-10 w-10 text-muted-foreground/60" />;
      case 'filter':
        return <FileSearch className="h-10 w-10 text-muted-foreground/60" />;
      case 'error':
        return <AlertCircle className="h-10 w-10 text-destructive/80" />;
      default:
        return <Info className="h-10 w-10 text-muted-foreground/60" />;
    }
  };

  if (minimal) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center p-4 text-center",
        className
      )}>
        <p className="text-sm text-muted-foreground mb-2">{title}</p>
        {description && <p className="text-xs text-muted-foreground/80">{description}</p>}
        {action && <div className="mt-3">{action}</div>}
      </div>
    );
  }

  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-10 px-4 text-center border rounded-lg bg-background/50",
      className
    )}>
      <div className="mb-4">
        {getIcon()}
      </div>
      <h3 className="text-lg font-medium mb-1">{title}</h3>
      {description && <p className="text-sm text-muted-foreground max-w-md">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/**
 * No Results Found Component
 * 
 * Specialized EmptyState for search with no results
 * 
 * @example
 * ```tsx
 * <NoResults 
 *   searchTerm="competitors" 
 *   onClear={() => setSearchTerm('')} 
 * />
 * ```
 */
interface NoResultsProps {
  /** The search term that produced no results */
  searchTerm?: string;
  /** Function to clear search */
  onClear?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show with minimal styling */
  minimal?: boolean;
}

/**
 * Specialized empty state for search with no results
 */
export function NoResults({ 
  searchTerm, 
  onClear, 
  className,
  minimal = false
}: NoResultsProps) {
  return (
    <EmptyState
      title={`No results ${searchTerm ? `for "${searchTerm}"` : 'found'}`}
      description="Try adjusting your search or filters to find what you're looking for."
      variant="search"
      minimal={minimal}
      className={className}
      action={onClear && (
        <Button variant="outline" size="sm" onClick={onClear}>
          Clear search
        </Button>
      )}
    />
  );
}

/**
 * No Data Component
 * 
 * Specialized EmptyState for when no data exists yet
 * 
 * @example
 * ```tsx
 * <NoData 
 *   entityName="competitors" 
 *   createAction={<Button>Add competitor</Button>} 
 * />
 * ```
 */
interface NoDataProps {
  /** Name of the entity that has no data */
  entityName: string;
  /** Action to create new data */
  createAction?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Specialized empty state for when no data exists yet
 */
export function NoData({ entityName, createAction, className }: NoDataProps) {
  return (
    <EmptyState
      title={`No ${entityName} yet`}
      description={`When you add ${entityName}, they will appear here.`}
      action={createAction}
      className={className}
    />
  );
}
