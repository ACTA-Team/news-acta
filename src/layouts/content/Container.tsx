import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Layout container with a consistent max-width across the whole site.
 * Prevents every page from defining its own `max-w-*` + `mx-auto`.
 */
export function Container({ size = 'lg', className, children, ...props }: ContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-6',
        size === 'sm' && 'max-w-2xl',
        size === 'md' && 'max-w-4xl',
        size === 'lg' && 'max-w-6xl',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
