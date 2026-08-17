/**
 * Scheduled publishing.
 *
 * `publishScheduledArticles()` is the body of the Vercel Cron route
 * (`/api/cron/publish-scheduled`). It runs with the service-role client so it
 * can flip rows the signed-in editor is not present for, and it must be
 * idempotent: two overlapping cron runs must never publish the same article
 * twice.
 *
 * Idempotency comes from the update predicate, not from application state. The
 * statement is `set status='published' where status='scheduled' and
 * scheduled_at <= now()`, so under READ COMMITTED a second concurrent run
 * blocks on the row lock, re-checks the predicate once the first commits, sees
 * `status='published'`, and skips the row. `.select()` therefore returns only
 * the rows *this* run actually changed, and that set is what drives the
 * follow-up work (attestation, revalidation).
 *
 * `published_at` and the audit row are stamped by the database trigger
 * (`enforce_status_transition`), so they are written exactly once per
 * transition no matter who performs it.
 *
 * Dependencies are injected so the cron logic can be tested without Supabase,
 * Stellar or a Next.js request context.
 */

import type { CalendarEntry } from '@/@types/editorial';
import type { TypedSupabaseClient } from '@/lib/supabase';

export interface PublishedArticle {
  id: string;
  slug: string;
}

export interface PublishScheduledResult {
  publishedCount: number;
  published: PublishedArticle[];
  errors: string[];
}

export interface SchedulingDeps {
  /** Service-role client: bypasses RLS. */
  client: TypedSupabaseClient;
  /** Invalidates a Next.js route cache entry. */
  revalidate: (path: string) => void;
  /** Anchors the published article on Stellar. Must never throw. */
  attest: (article: PublishedArticle) => Promise<void>;
  now: () => Date;
}

/**
 * Publish every article whose scheduled time has arrived.
 *
 * Safe to call concurrently; see the module docblock.
 */
export async function publishScheduledArticles(
  overrides: Partial<SchedulingDeps> = {}
): Promise<PublishScheduledResult> {
  const deps = await resolveDeps(overrides);
  const errors: string[] = [];

  const { data, error } = await deps.client
    .from('news_articles')
    .update({ status: 'published' })
    .eq('status', 'scheduled')
    .lte('scheduled_at', deps.now().toISOString())
    .select('id, slug');

  if (error) {
    return { publishedCount: 0, published: [], errors: [error.message] };
  }

  const published: PublishedArticle[] = (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
  }));

  if (published.length === 0) {
    return { publishedCount: 0, published: [], errors };
  }

  // Anchor each article on-chain. Attestation failures are recorded but never
  // roll back a publication: the article is already live.
  for (const article of published) {
    try {
      await deps.attest(article);
    } catch (err) {
      errors.push(
        `attestation failed for ${article.slug}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  for (const path of ['/', '/news', ...published.map((a) => `/news/${a.slug}`)]) {
    try {
      deps.revalidate(path);
    } catch (err) {
      errors.push(
        `revalidate failed for ${path}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  return { publishedCount: published.length, published, errors };
}

/**
 * Fill in whatever the caller did not supply.
 *
 * Each default is imported lazily *and only when missing*: `@/lib/supabase/admin`
 * pulls in `server-only` and `next/cache` needs a request context, so eagerly
 * resolving them would make this module unusable from a plain Node test runner
 * even when the test injects every dependency.
 */
async function resolveDeps(overrides: Partial<SchedulingDeps>): Promise<SchedulingDeps> {
  let client = overrides.client;
  if (!client) {
    const { createAdminClient } = await import('@/lib/supabase/admin');
    client = createAdminClient() as unknown as TypedSupabaseClient;
  }

  let revalidate = overrides.revalidate;
  if (!revalidate) {
    const { revalidatePath } = await import('next/cache');
    revalidate = (path: string) => revalidatePath(path);
  }

  let attest = overrides.attest;
  if (!attest) {
    const resolvedClient = client;
    attest = async (article: PublishedArticle) => {
      const { attestPublishedArticle } = await import('./attestation.service');
      await attestPublishedArticle(resolvedClient, article);
    };
  }

  return { client, revalidate, attest, now: overrides.now ?? (() => new Date()) };
}

/** Queue an article for automatic publication at `scheduledAt`. */
export async function schedule(
  supabase: TypedSupabaseClient,
  params: { articleId: string; scheduledAt: Date }
): Promise<void> {
  if (Number.isNaN(params.scheduledAt.getTime())) {
    throw new Error('Invalid schedule date.');
  }

  const { error } = await supabase
    .from('news_articles')
    .update({ status: 'scheduled', scheduled_at: params.scheduledAt.toISOString() })
    .eq('id', params.articleId);

  if (error) throw error;
}

/** Pull an article back out of the schedule. The database trigger clears
 *  `scheduled_at` on the way to `draft`. */
export async function unschedule(
  supabase: TypedSupabaseClient,
  params: { articleId: string }
): Promise<void> {
  const { error } = await supabase
    .from('news_articles')
    .update({ status: 'draft' })
    .eq('id', params.articleId);

  if (error) throw error;
}

/** Scheduled and published articles falling inside `[from, to)`, for the calendar. */
export async function listCalendarEntries(
  supabase: TypedSupabaseClient,
  range: { from: Date; to: Date }
): Promise<CalendarEntry[]> {
  const fromIso = range.from.toISOString();
  const toIso = range.to.toISOString();

  const [scheduled, published] = await Promise.all([
    supabase
      .from('news_articles')
      .select('id, title, slug, scheduled_at, author:authors ( name )')
      .eq('status', 'scheduled')
      .gte('scheduled_at', fromIso)
      .lt('scheduled_at', toIso),
    supabase
      .from('news_articles')
      .select('id, title, slug, published_at, author:authors ( name )')
      .eq('status', 'published')
      .gte('published_at', fromIso)
      .lt('published_at', toIso),
  ]);

  if (scheduled.error) throw scheduled.error;
  if (published.error) throw published.error;

  type Row = {
    id: string;
    title: string;
    slug: string;
    scheduled_at?: string | null;
    published_at?: string | null;
    author: { name: string } | null;
  };

  const entries: CalendarEntry[] = [];

  for (const row of (scheduled.data ?? []) as unknown as Row[]) {
    if (!row.scheduled_at) continue;
    entries.push({
      articleId: row.id,
      title: row.title,
      slug: row.slug,
      status: 'scheduled',
      date: row.scheduled_at,
      authorName: row.author?.name ?? null,
    });
  }

  for (const row of (published.data ?? []) as unknown as Row[]) {
    if (!row.published_at) continue;
    entries.push({
      articleId: row.id,
      title: row.title,
      slug: row.slug,
      status: 'published',
      date: row.published_at,
      authorName: row.author?.name ?? null,
    });
  }

  return entries.sort((a, b) => a.date.localeCompare(b.date));
}
