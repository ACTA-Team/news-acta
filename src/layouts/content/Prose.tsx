import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

/**
 * Typographic wrapper for long-form content (articles, monthly reviews).
 * Centralizes widths, fonts and rhythm so every post looks the same
 * without depending on the `@tailwindcss/typography` plugin.
 */
export function Prose({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'max-w-3xl text-base leading-7 text-zinc-800 dark:text-zinc-200',
        '[&>h2]:mt-10 [&>h2]:text-2xl [&>h2]:font-semibold [&>h2]:tracking-tight',
        '[&>h3]:mt-8 [&>h3]:text-xl [&>h3]:font-semibold',
        '[&>p]:mt-5',
        '[&>ul]:mt-5 [&>ul]:list-disc [&>ul]:pl-6',
        '[&>ol]:mt-5 [&>ol]:list-decimal [&>ol]:pl-6',
        '[&>blockquote]:mt-5 [&>blockquote]:border-l-2 [&>blockquote]:border-zinc-300 [&>blockquote]:pl-4 [&>blockquote]:italic',
        '[&>pre]:mt-5 [&>pre]:rounded-lg [&>pre]:bg-zinc-900 [&>pre]:p-4 [&>pre]:text-zinc-100',
        '[&>a]:underline [&>a]:decoration-zinc-400 [&>a]:underline-offset-2 hover:[&>a]:decoration-zinc-700',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
