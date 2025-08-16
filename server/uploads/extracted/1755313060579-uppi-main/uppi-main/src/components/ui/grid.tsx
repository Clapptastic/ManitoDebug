
import React from 'react';
import { cn } from '@/utils/cn';

interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  columns?: number;
  gap?: number;
  className?: string;
}

export const Grid = ({
  children,
  columns = 4,
  gap = 4,
  className,
  ...props
}: GridProps) => {
  // Map the columns and gap values to Tailwind classes
  const columnsClass = `grid-cols-1 md:grid-cols-${columns}`;
  const gapClass = `gap-${gap}`;
  
  return (
    <div
      className={cn(
        `grid ${columnsClass} ${gapClass}`,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
