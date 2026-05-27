import type { ResolvedStellarEntity } from '@/@types/stellar';
import { collectEntities, parseArticleContent } from '@/lib/stellar/parser';
import { entityKey, resolveEntities } from '@/lib/stellar/resolver';
import { cn } from '@/lib/utils';
import { StellarEmbed } from './StellarEmbed';

interface ArticleContentProps {
  content: string;
  className?: string;
}

/**
 * Renders article content with inline Stellar embeds. Async Server Component.
 *
 * Flow: parse content → resolve detected entities (cache + APIs, server-side,
 * never throws) → render HTML chunks verbatim inside the prose container and
 * swap each entity for its resolved embed card.
 *
 * Resolution failures degrade to fallback links per entity, so article
 * rendering is never blocked. If parsing itself were to fail, the original
 * content is rendered as-is.
 */
export async function ArticleContent({ content, className }: ArticleContentProps) {
  const proseClass = cn('prose prose-zinc max-w-none dark:prose-invert', className);

  let segments;
  let resolvedByKey: Map<string, ResolvedStellarEntity>;
  try {
    segments = parseArticleContent(content);
    resolvedByKey = await resolveEntities(collectEntities(segments));
  } catch {
    return <div className={proseClass} dangerouslySetInnerHTML={{ __html: content }} />;
  }

  return (
    <div className={proseClass}>
      {segments.map((segment, index) => {
        if (segment.kind === 'html') {
          return (
            <div
              key={index}
              // Content is authored by admins; sanitize upstream before storing real HTML.
              dangerouslySetInnerHTML={{ __html: segment.html }}
            />
          );
        }

        const entity =
          resolvedByKey.get(entityKey(segment.ref)) ??
          ({ ref: segment.ref, status: 'error', resolvedAt: new Date().toISOString() } as const);

        return <StellarEmbed key={index} entity={entity} />;
      })}
    </div>
  );
}
