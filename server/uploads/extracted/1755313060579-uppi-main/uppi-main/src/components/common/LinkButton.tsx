
import React from 'react';
import { Link } from 'react-router-dom';
import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LinkButtonProps extends Omit<ButtonProps, 'onClick'> {
  href: string;
  external?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const LinkButton: React.FC<LinkButtonProps> = ({
  href,
  external = false,
  className,
  children,
  ...props
}) => {
  // For external links, use a regular anchor tag
  if (external || href.startsWith('http')) {
    return (
      <Button
        asChild
        className={cn(className)}
        {...props}
      >
        <a 
          href={href}
          target="_blank"
          rel="noopener noreferrer"
        >
          {children}
        </a>
      </Button>
    );
  }
  
  // For internal links, use React Router Link
  return (
    <Button
      asChild
      className={cn(className)}
      {...props}
    >
      <Link to={href}>{children}</Link>
    </Button>
  );
};

export default LinkButton;
