import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { canEditArticle } from '@/lib/editorial/permissions';
import type { EditorialStatus } from '@/lib/editorial/transitions';
import { createClient } from '@/lib/supabase/server';
import { LOCALES, otherLocales } from '@/i18n/config';

import { requireAdmin } from '../services/auth.service';
import { fetchAdminNewsById } from '../services/news.service';
import {
  fetchArticleTranslationFieldHashes,
  fetchArticleTranslations,
  fetchTranslationSource,
  fieldStaleness,
} from '../services/translations.service';
import { TranslationEditor } from '../ui/TranslationEditor';
import { TranslationStatusBadge } from '../ui/TranslationStatusBadge';

interface AdminTranslationsPageContentProps {
  articleId: string;
}

/**
 * Suggested slug for a new translation.
 *
 * Prefixing the source slug with the locale is a deliberately boring default: it
 * is unique by construction, so a translator can save immediately and rename it
 * to something readable afterwards without fighting a constraint violation on the
 * first attempt.
 */
function suggestSlug(sourceSlug: string, locale: string): string {
  return `${sourceSlug}-${locale}`;
}

export async function AdminTranslationsPageContent({
  articleId,
}: AdminTranslationsPageContentProps) {
  const session = await requireAdmin();
  const supabase = await createClient();

  const [article, source] = await Promise.all([
    fetchAdminNewsById(supabase, articleId),
    fetchTranslationSource(supabase, articleId),
  ]);

  if (!article || !source) notFound();

  const ownsArticle = session.authorId !== null && session.authorId === article.authorId;
  const canEdit = canEditArticle(session.role, {
    ownsArticle,
    status: article.status as EditorialStatus,
  });

  const [translations, storedFieldHashes] = await Promise.all([
    fetchArticleTranslations(supabase, articleId, source.translationSourceHash),
    fetchArticleTranslationFieldHashes(supabase, articleId),
  ]);

  // The source language needs no translation of its own, so the editor only
  // offers the other locales.
  const targetLocales = otherLocales(source.sourceLocale);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border bg-card p-5">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Translations
          </p>
          <h1 className="text-lg font-semibold">{article.title}</h1>
          <p className="text-xs text-muted-foreground">
            Source language: {source.sourceLocale} · /{source.slug}
          </p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {LOCALES.map((locale) => {
              const record = translations[locale];
              const status =
                locale === source.sourceLocale
                  ? 'current'
                  : !record
                    ? 'missing'
                    : record.isStale
                      ? 'stale'
                      : 'current';
              return <TranslationStatusBadge key={locale} locale={locale} status={status} />;
            })}
          </div>
        </div>

        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href={`/admin/news/${articleId}/edit`}>Back to editor</Link>
          </Button>
        </div>
      </header>

      {!canEdit ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
          Your role cannot edit this article in &ldquo;{article.status}&rdquo;, so saving a
          translation will be refused. The source and any stored translations are shown read-only
          below.
        </p>
      ) : null}

      {targetLocales.map((locale) => (
        <TranslationEditor
          key={locale}
          source={source}
          locale={locale}
          translation={translations[locale]}
          fieldStaleness={fieldStaleness(
            storedFieldHashes[locale],
            source,
            translations[locale]?.isStale ?? false
          )}
          suggestedSlug={suggestSlug(source.slug, locale)}
        />
      ))}
    </div>
  );
}
