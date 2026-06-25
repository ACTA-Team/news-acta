import { ExternalLink } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmbedShellProps {
  icon: LucideIcon;
  /** Entity-type label, e.g. "Transaction". */
  label: string;
  /** "View on explorer" target. */
  explorerHref: string;
  /** Optional status badge rendered in the header. */
  badge?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Shared card chrome for every Stellar embed. Server Component (presentational).
 * Uses semantic theme tokens so dark/light mode work automatically, and is
 * responsive: full-width with comfortable padding, no fixed dimensions.
 */
export function EmbedShell({ icon: Icon, label, explorerHref, badge, children }: EmbedShellProps) {
  return (
    <div
      data-slot="stellar-embed"
      className="not-prose my-4 overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm"
    >
      <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-2.5">
        <Icon className="size-4 text-muted-foreground" aria-hidden />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {badge}
        <a
          href={explorerHref}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Explorer
          <ExternalLink className="size-3" aria-hidden />
        </a>
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  );
}

/** A label/value row used inside embed bodies. */
export function EmbedRow({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-baseline justify-between gap-3 py-1', className)}>
      <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-right text-sm font-medium text-foreground">
        {children}
      </span>
    </div>
  );
}

/** Responsive grid wrapper: single column on mobile, two on wider viewports. */
export function EmbedGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-x-6 gap-y-0 sm:grid-cols-2">{children}</div>;
}
