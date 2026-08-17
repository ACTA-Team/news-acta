import { AlertTriangle, CheckCircle2, Trash2 } from 'lucide-react';

import type {
  ArticleTranslationRecord,
  ArticleTranslationSource,
  TranslationFieldStaleness,
} from '@/@types/i18n';
import {
  deleteArticleTranslationAction,
  markArticleTranslationCurrentAction,
  saveArticleTranslationAction,
} from '@/components/modules/admin/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LOCALE_NAMES, type Locale } from '@/i18n/config';

/**
 * Two-column translation editor: read-only source on the left, editable
 * translation on the right.
 *
 * Field-level staleness markers appear next to the source fields, not the
 * translated ones: the question a translator is answering is "which part of the
 * original moved since I last looked at it?".
 *
 * "Mark as up to date" exists because a source edit can be cosmetic. It re-stamps
 * the stored hashes without touching the translation, and it is the only way to
 * clear a stale flag other than saving new text, which keeps the flag meaningful.
 */

interface TranslationEditorProps {
  source: ArticleTranslationSource;
  locale: Locale;
  translation: ArticleTranslationRecord | undefined;
  fieldStaleness: TranslationFieldStaleness;
  /** Suggested slug when there is no translation yet. */
  suggestedSlug: string;
}

export function TranslationEditor({
  source,
  locale,
  translation,
  fieldStaleness,
  suggestedSlug,
}: TranslationEditorProps) {
  const isStale = translation?.isStale ?? false;

  return (
    <section className="space-y-4 rounded-2xl border bg-card p-5">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <div>
          <h2 className="text-base font-semibold">
            {LOCALE_NAMES[locale]} <span className="text-muted-foreground">({locale})</span>
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {translation
              ? `Last saved ${new Date(translation.updatedAt).toLocaleString('en-US')}${
                  translation.translatedBy ? ` by ${translation.translatedBy}` : ''
                }`
              : 'No translation stored yet.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isStale ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
              <AlertTriangle className="size-3.5" aria-hidden />
              Source changed since this was written
            </span>
          ) : translation ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              <CheckCircle2 className="size-3.5" aria-hidden />
              Up to date
            </span>
          ) : null}

          {isStale ? (
            <form action={markArticleTranslationCurrentAction}>
              <input type="hidden" name="articleId" value={source.articleId} />
              <input type="hidden" name="locale" value={locale} />
              <Button type="submit" size="sm" variant="outline">
                Mark as up to date
              </Button>
            </form>
          ) : null}

          {translation ? (
            <form action={deleteArticleTranslationAction}>
              <input type="hidden" name="articleId" value={source.articleId} />
              <input type="hidden" name="locale" value={locale} />
              <Button type="submit" size="sm" variant="destructive">
                <Trash2 className="size-3.5" aria-hidden />
                Delete
              </Button>
            </form>
          ) : null}
        </div>
      </header>

      <form action={saveArticleTranslationAction} className="space-y-5">
        <input type="hidden" name="articleId" value={source.articleId} />
        <input type="hidden" name="locale" value={locale} />

        <FieldPair
          label="Slug"
          hint={`Must be unique within ${locale}. Lowercase words separated by hyphens.`}
          sourceValue={source.slug}
          sourceStale={false}
        >
          <Input
            name="slug"
            required
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            defaultValue={translation?.slug ?? suggestedSlug}
          />
        </FieldPair>

        <FieldPair
          label="Title"
          sourceValue={source.title}
          sourceStale={fieldStaleness.title && Boolean(translation)}
        >
          <Input name="title" required defaultValue={translation?.title} lang={locale} />
        </FieldPair>

        <FieldPair
          label="Summary"
          sourceValue={source.summary}
          sourceStale={fieldStaleness.summary && Boolean(translation)}
        >
          <Textarea name="summary" required defaultValue={translation?.summary} lang={locale} />
        </FieldPair>

        <FieldPair
          label="Content"
          sourceValue={source.content}
          sourceStale={fieldStaleness.content && Boolean(translation)}
          monospace
        >
          <Textarea
            name="content"
            required
            className="min-h-80 font-mono text-xs"
            defaultValue={translation?.content}
            lang={locale}
          />
        </FieldPair>

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button type="submit">{translation ? 'Save translation' : 'Create translation'}</Button>
        </div>
      </form>
    </section>
  );
}

interface FieldPairProps {
  label: string;
  hint?: string;
  sourceValue: string;
  sourceStale: boolean;
  monospace?: boolean;
  children: React.ReactNode;
}

/** One source/translation row. The source side never becomes editable. */
function FieldPair({ label, hint, sourceValue, sourceStale, monospace, children }: FieldPairProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label} (source)
          </span>
          {sourceStale ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
              <AlertTriangle className="size-3" aria-hidden />
              changed
            </span>
          ) : null}
        </div>
        <div
          className={`max-h-80 overflow-auto whitespace-pre-wrap rounded-xl border bg-muted/30 p-3 text-sm text-muted-foreground ${
            monospace ? 'font-mono text-xs' : ''
          } ${sourceStale ? 'border-amber-300 dark:border-amber-800' : ''}`}
        >
          {sourceValue}
        </div>
      </div>

      <div className="space-y-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label} (translation)
        </span>
        {children}
        {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
      </div>
    </div>
  );
}
