
import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { OutboundLink } from '@/components/shared/OutboundLink';

export interface NavItemProps {
  title: string;
  icon?: React.ReactNode;
  href?: string;
  count?: number;
  active?: boolean;
  disabled?: boolean;
  external?: boolean;
  variant?: 'default' | 'sidebar';
  className?: string;
  onClick?: () => void;
  children?: React.ReactNode; // Add children prop
}

const NavItem: React.FC<NavItemProps> = ({
  title,
  icon,
  href,
  count,
  active,
  disabled = false,
  external = false,
  variant = 'default',
  className,
  onClick,
  children,
}) => {
  const linkClasses = cn(
    'flex items-center gap-x-2 text-sm',
    variant === 'default' ? 'px-3 py-2 rounded-md' : 'px-2 py-1.5 rounded-md',
    active
      ? 'bg-primary text-primary-foreground'
      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
    disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
    className
  );

  const content = (
    <>
      {icon && <span className="h-4 w-4">{icon}</span>}
      <span className="flex-grow">{title}</span>
      {count != null && (
        <Badge variant="secondary" className="text-xs">
          {count}
        </Badge>
      )}
      {children}
    </>
  );

  if (disabled) {
    return <div className={linkClasses}>{content}</div>;
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={linkClasses}>
        {content}
      </button>
    );
  }

  if (external) {
    return (
      <OutboundLink href={href || '#'} target="_blank" rel="noopener noreferrer" className={linkClasses}>
        {content}
      </OutboundLink>
    );
  }

  return (
    <Link to={href || '#'} className={linkClasses}>
      {content}
    </Link>
  );
};

export default NavItem;
