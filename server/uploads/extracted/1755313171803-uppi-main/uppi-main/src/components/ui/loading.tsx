
import React from 'react';
import { cn } from '@/lib/utils';
import { Spinner } from './spinner';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'default';
  text?: string;
  className?: string;
  fadeIn?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({
  size = 'md',
  variant = 'primary',
  text,
  className,
  fadeIn = false,
}) => {
  return (
    <div 
      className={cn(
        'flex flex-col items-center justify-center gap-3',
        fadeIn && 'animate-fade-in',
        className
      )}
    >
      <Spinner size={size} />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  );
};

export default Loading;
