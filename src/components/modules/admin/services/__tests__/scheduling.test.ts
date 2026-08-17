import { describe, expect, it, vi } from 'vitest';
import type { TypedSupabaseClient } from '@/lib/supabase';
import {
  publishScheduledArticles,
  schedule,
  type PublishedArticle,
  type SchedulingDeps,
} from '../scheduling.service';

/**
 * A fake `news_articles` table that reproduces the two Postgres behaviours the
 * cron relies on:
 *
 *  1. A conditional `UPDATE ... WHERE status='scheduled'` re-evaluates its
 *     predicate *after* acquiring the row lock, so a second concurrent
 *     statement sees the committed result of the first and matches nothing.
 *  2. `published_at` is stamped by the trigger on the way to `published`.
 *
 * Statements are serialised through a lock and yield to the event loop before
 * applying, so two overlapping `publishScheduledArticles()` calls genuinely
 * interleave rather than running one after the other.
 */
interface FakeRow {
  id: string;
  slug: string;
  status: string;
  scheduled_at: string | null;
  published_at: string | null;
}

type Filter = ['eq' | 'lte', string, string];

function createFakeClient(rows: FakeRow[]) {
  const statements: Filter[][] = [];
  let lock: Promise<void> = Promise.resolve();

  function matches(row: FakeRow, filters: Filter[]): boolean {
    return filters.every(([op, column, value]) => {
      const current = row[column as keyof FakeRow];
      if (op === 'eq') return current === value;
      return current !== null && String(current) <= value;
    });
  }

  const client = {
    from() {
      return {
        update(patch: Record<string, unknown>) {
          const filters: Filter[] = [];

          const builder = {
            eq(column: string, value: string) {
              filters.push(['eq', column, value]);
              return builder;
            },
            lte(column: string, value: string) {
              filters.push(['lte', column, value]);
              return builder;
            },
            select() {
              const previous = lock;
              let release!: () => void;
              lock = new Promise<void>((resolve) => {
                release = resolve;
              });

              return (async () => {
                await previous; // row lock
                await new Promise((resolve) => setTimeout(resolve, 0)); // real interleaving
                statements.push(filters);

                const matched = rows.filter((row) => matches(row, filters));
                for (const row of matched) {
                  Object.assign(row, patch);
                  if (patch.status === 'published' && row.published_at === null) {
                    row.published_at = new Date().toISOString();
                  }
                }

                release();
                return {
                  data: matched.map((row) => ({ id: row.id, slug: row.slug })),
                  error: null,
                };
              })();
            },
          };

          return builder;
        },
      };
    },
  };

  return { client: client as unknown as TypedSupabaseClient, rows, statements };
}

function createDeps(rows: FakeRow[], now = new Date('2026-08-16T12:00:00.000Z')) {
  const fake = createFakeClient(rows);
  const attested: string[] = [];
  const revalidated: string[] = [];

  const deps: SchedulingDeps = {
    client: fake.client,
    revalidate: (path) => {
      revalidated.push(path);
    },
    attest: async (article: PublishedArticle) => {
      attested.push(article.slug);
    },
    now: () => now,
  };

  return { deps, fake, attested, revalidated };
}

function scheduledRow(id: string, offsetMinutes: number): FakeRow {
  return {
    id,
    slug: `article-${id}`,
    status: 'scheduled',
    scheduled_at: new Date(
      new Date('2026-08-16T12:00:00.000Z').getTime() + offsetMinutes * 60_000
    ).toISOString(),
    published_at: null,
  };
}

describe('publishScheduledArticles', () => {
  it('publishes only articles whose time has arrived', async () => {
    const rows = [scheduledRow('a', -10), scheduledRow('b', -1), scheduledRow('c', 60)];
    const { deps, attested } = createDeps(rows);

    const result = await publishScheduledArticles(deps);

    expect(result.publishedCount).toBe(2);
    expect(result.published.map((a) => a.id).sort()).toEqual(['a', 'b']);
    expect(attested.sort()).toEqual(['article-a', 'article-b']);
    expect(rows.find((r) => r.id === 'c')?.status).toBe('scheduled');
  });

  it('stamps published_at on the rows it publishes', async () => {
    const rows = [scheduledRow('a', -5)];
    const { deps } = createDeps(rows);

    await publishScheduledArticles(deps);

    expect(rows[0].status).toBe('published');
    expect(rows[0].published_at).not.toBeNull();
  });

  it('filters on status=scheduled so the update is conditional, not read-then-write', async () => {
    const { deps, fake } = createDeps([scheduledRow('a', -5)]);

    await publishScheduledArticles(deps);

    expect(fake.statements).toHaveLength(1);
    expect(fake.statements[0]).toContainEqual(['eq', 'status', 'scheduled']);
    expect(
      fake.statements[0].some(([op, column]) => op === 'lte' && column === 'scheduled_at')
    ).toBe(true);
  });

  it('is idempotent: a second sequential run publishes nothing', async () => {
    const rows = [scheduledRow('a', -5), scheduledRow('b', -5)];
    const { deps, attested } = createDeps(rows);

    const first = await publishScheduledArticles(deps);
    const second = await publishScheduledArticles(deps);

    expect(first.publishedCount).toBe(2);
    expect(second.publishedCount).toBe(0);
    expect(second.published).toEqual([]);
    expect(attested).toHaveLength(2);
  });

  it('never publishes the same article twice under two overlapping runs', async () => {
    const rows = [scheduledRow('a', -5), scheduledRow('b', -5), scheduledRow('c', -5)];
    const { deps, attested, revalidated } = createDeps(rows);

    // Both runs start before either completes.
    const [first, second] = await Promise.all([
      publishScheduledArticles(deps),
      publishScheduledArticles(deps),
    ]);

    const publishedIds = [...first.published, ...second.published].map((a) => a.id);

    expect(publishedIds).toHaveLength(3);
    expect(new Set(publishedIds).size).toBe(3); // no duplicates
    expect(first.publishedCount + second.publishedCount).toBe(3);

    // Exactly one of the two runs did the work; the other was a no-op.
    expect([first.publishedCount, second.publishedCount].sort()).toEqual([0, 3]);

    // Follow-up work also happens exactly once per article.
    expect(attested.sort()).toEqual(['article-a', 'article-b', 'article-c']);
    expect(revalidated.filter((p) => p === '/news/article-a')).toHaveLength(1);
  });

  it('does no follow-up work when nothing is due', async () => {
    const { deps, attested, revalidated } = createDeps([scheduledRow('a', 120)]);

    const result = await publishScheduledArticles(deps);

    expect(result).toEqual({ publishedCount: 0, published: [], errors: [] });
    expect(attested).toEqual([]);
    expect(revalidated).toEqual([]);
  });

  it('revalidates the home page, the index and each published article', async () => {
    const { deps, revalidated } = createDeps([scheduledRow('a', -5), scheduledRow('b', -5)]);

    await publishScheduledArticles(deps);

    expect(revalidated).toEqual(['/', '/news', '/news/article-a', '/news/article-b']);
  });

  it('reports attestation failures without unpublishing the article', async () => {
    const rows = [scheduledRow('a', -5)];
    const { deps } = createDeps(rows);
    deps.attest = vi.fn().mockRejectedValue(new Error('horizon unreachable'));

    const result = await publishScheduledArticles(deps);

    expect(result.publishedCount).toBe(1);
    expect(rows[0].status).toBe('published');
    expect(result.errors).toEqual(['attestation failed for article-a: horizon unreachable']);
  });

  it('surfaces a query error instead of throwing', async () => {
    const failing = {
      from: () => ({
        update: () => ({
          eq: () => ({
            lte: () => ({
              select: async () => ({ data: null, error: { message: 'permission denied' } }),
            }),
          }),
        }),
      }),
    } as unknown as TypedSupabaseClient;

    const result = await publishScheduledArticles({
      client: failing,
      revalidate: () => {},
      attest: async () => {},
      now: () => new Date(),
    });

    expect(result).toEqual({ publishedCount: 0, published: [], errors: ['permission denied'] });
  });
});

describe('schedule', () => {
  it('rejects an invalid date before touching the database', async () => {
    const client = {
      from: () => {
        throw new Error('should not be called');
      },
    } as unknown as TypedSupabaseClient;

    await expect(
      schedule(client, { articleId: 'a', scheduledAt: new Date('not-a-date') })
    ).rejects.toThrow('Invalid schedule date.');
  });

  it('writes status=scheduled and the ISO timestamp', async () => {
    const update = vi.fn().mockReturnValue({ eq: async () => ({ error: null }) });
    const client = { from: () => ({ update }) } as unknown as TypedSupabaseClient;
    const when = new Date('2026-09-01T09:30:00.000Z');

    await schedule(client, { articleId: 'a', scheduledAt: when });

    expect(update).toHaveBeenCalledWith({
      status: 'scheduled',
      scheduled_at: '2026-09-01T09:30:00.000Z',
    });
  });
});
