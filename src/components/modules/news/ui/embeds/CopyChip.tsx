'use client';

import { Check, Copy } from 'lucide-react';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { truncateMiddle } from '@/lib/stellar/format';
import { cn } from '@/lib/utils';

interface CopyChipProps {
  /** Full value copied to the clipboard. */
  value: string;
  /** Display text; defaults to a middle-truncated `value`. */
  display?: string;
  className?: string;
}

/**
 * A monospace, middle-truncated id with a copy-to-clipboard button.
 * Client Component — uses the clipboard and local "copied" feedback.
 */
export function CopyChip({ value, display, className }: CopyChipProps) {
  const { copied, copy } = useCopyToClipboard();

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground',
        className
      )}
    >
      <span className="truncate">{display ?? truncateMiddle(value, 6, 6)}</span>
      <button
        type="button"
        onClick={() => copy(value)}
        aria-label={copied ? 'Copied' : `Copy ${value}`}
        className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
      >
        {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
      </button>
    </span>
  );
}
