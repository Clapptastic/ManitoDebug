
import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface NavProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Nav({ className, children, ...props }: NavProps) {
  return (
    <nav className={cn('flex flex-col gap-1', className)} {...props}>
      {children}
    </nav>
  );
}

interface NavLinkProps extends React.HTMLAttributes<HTMLAnchorElement> {
  href: string;
  icon?: React.ReactNode;
  iconOnly?: boolean;
  active?: boolean;
  disabled?: boolean;
  external?: boolean;
  children: React.ReactNode;
}

export function NavLink({
  className,
  href,
  icon,
  iconOnly = false,
  active = false,
  disabled = false,
  external = false,
  children,
  ...props
}: NavLinkProps) {
  const Component = external ? 'a' : Link;
  const externalProps = external ? { target: "_blank", rel: "noopener noreferrer" } : {};

  return (
    <Component
      to={external ? undefined : href}
      href={external ? href : undefined}
      className={cn(
        'group flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
        active 
          ? 'bg-primary/10 text-primary hover:bg-primary/15' 
          : 'hover:bg-secondary/80 hover:text-foreground',
        disabled && 'opacity-50 pointer-events-none',
        className
      )}
      {...externalProps}
      {...props}
    >
      {icon && (
        <span className={cn('mr-2 h-4 w-4', iconOnly && 'mr-0')}>
          {icon}
        </span>
      )}
      {!iconOnly && children}
    </Component>
  );
}

export default Nav;
