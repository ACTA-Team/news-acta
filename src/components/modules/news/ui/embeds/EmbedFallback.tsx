import { ExternalLink, TriangleAlert } from 'lucide-react';
import type { StellarEntityRef } from '@/@types/stellar';
import { explorerUrl } from '@/lib/stellar/explorer';
import { truncateMiddle } from '@/lib/stellar/format';
import { cn } from '@/lib/utils';

interface EmbedFallbackProps {
  entityRef: StellarEntityRef;
  /** True when the network confirmed the entity does not exist. */
  notFound?: boolean;
}

/**
 * Minimal fallback when resolution fails or the entity does not exist.
 * Renders the raw id as a clickable explorer link so the article never loses
 * information, with a subtle "not found" hint when applicable.
 */
export function EmbedFallback({ entityRef, notFound }: EmbedFallbackProps) {
  const href = explorerUrl(entityRef.type, entityRef.id, entityRef.network);
  const display = entityRef.type === 'asset' ? entityRef.id : truncateMiddle(entityRef.id, 6, 6);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={notFound ? `${entityRef.id} — not found on ${entityRef.network}` : entityRef.id}
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-1 font-mono text-[0.95em] underline-offset-2 hover:underline',
        notFound ? 'text-muted-foreground' : 'text-primary'
      )}
    >
      {notFound ? <TriangleAlert className="size-3 shrink-0" aria-hidden /> : null}
      <span className="truncate">{display}</span>
      <ExternalLink className="size-3 shrink-0 opacity-60" aria-hidden />
    </a>
  );
}
