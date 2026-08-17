import { describe, expect, it } from 'vitest';
import type { TypedSupabaseClient } from '@/lib/supabase';
import { approve, listOpen, listThread, requestChanges, requestReview } from '../reviews.service';

/**
 * Minimal PostgREST-shaped fake.
 *
 * Every builder is thenable and records what it was asked to do, so the tests
 * can assert both the returned data and the exact rows the service tried to
 * write — the version pinning in particular, which is what ties a review to
 * the content it was written against.
 */
interface Call {
  table: string;
  op: 'select' | 'insert' | 'update';
  payload?: Record<string, unknown>;
  filters: [string, string, unknown][];
}

type Resolver = (call: Call) => { data: unknown; error: unknown | null };

function createFakeClient(resolve: Resolver) {
  const calls: Call[] = [];

  function chain(call: Call) {
    const api = {
      eq(column: string, value: unknown) {
        call.filters.push(['eq', column, value]);
        return api;
      },
      in(column: string, value: unknown) {
        call.filters.push(['in', column, value]);
        return api;
      },
      order: () => api,
      limit: () => api,
      select: () => api,
      maybeSingle: () => Promise.resolve(resolve(call)),
      single: () => Promise.resolve(resolve(call)),
      then: (ok: (v: unknown) => unknown, err?: (e: unknown) => unknown) =>
        Promise.resolve(resolve(call)).then(ok, err),
    };
    return api;
  }

  const client = {
    from(table: string) {
      return {
        select() {
          const call: Call = { table, op: 'select', filters: [] };
          calls.push(call);
          return chain(call);
        },
        insert(payload: Record<string, unknown>) {
          const call: Call = { table, op: 'insert', payload, filters: [] };
          calls.push(call);
          return chain(call);
        },
        update(payload: Record<string, unknown>) {
          const call: Call = { table, op: 'update', payload, filters: [] };
          calls.push(call);
          return chain(call);
        },
      };
    },
  };

  return {
    client: client as unknown as TypedSupabaseClient,
    calls,
    inserts: () => calls.filter((c) => c.op === 'insert'),
    updates: () => calls.filter((c) => c.op === 'update'),
  };
}

/** Resolver for the common case: an article at `status` with `version` snapshots. */
function articleAt(status: string, version: number | null): Resolver {
  return (call) => {
    if (call.table === 'news_articles' && call.op === 'select') {
      return { data: { status }, error: null };
    }
    if (call.table === 'article_versions' && call.op === 'select') {
      return { data: version === null ? null : { version_number: version }, error: null };
    }
    return { data: null, error: null };
  };
}

describe('requestReview', () => {
  it('pins the review to the article current version number', async () => {
    const fake = createFakeClient(articleAt('draft', 7));

    await requestReview(fake.client, {
      articleId: 'article-1',
      actorEmail: 'author@acta.dev',
      comment: '  please look at the third paragraph  ',
    });

    const review = fake.inserts().find((c) => c.table === 'article_reviews');
    expect(review?.payload).toEqual({
      article_id: 'article-1',
      version_number: 7,
      state: 'requested',
      requested_by: 'author@acta.dev',
      comment: 'please look at the third paragraph',
    });
  });

  it('moves a draft into in_review', async () => {
    const fake = createFakeClient(articleAt('draft', 2));

    await requestReview(fake.client, { articleId: 'article-1', actorEmail: 'a@acta.dev' });

    const update = fake.updates().find((c) => c.table === 'news_articles');
    expect(update?.payload).toEqual({ status: 'in_review' });
    expect(update?.filters).toContainEqual(['eq', 'id', 'article-1']);
  });

  it('does not re-transition an article already in review', async () => {
    const fake = createFakeClient(articleAt('in_review', 2));

    await requestReview(fake.client, { articleId: 'article-1', actorEmail: 'a@acta.dev' });

    expect(fake.inserts()).toHaveLength(1);
    expect(fake.updates()).toHaveLength(0);
  });

  it('pins null when the article has no version snapshots yet', async () => {
    const fake = createFakeClient(articleAt('draft', null));

    await requestReview(fake.client, { articleId: 'article-1', actorEmail: 'a@acta.dev' });

    expect(fake.inserts()[0].payload?.version_number).toBeNull();
  });

  it('normalises an empty comment to null', async () => {
    const fake = createFakeClient(articleAt('draft', 1));

    await requestReview(fake.client, {
      articleId: 'article-1',
      actorEmail: 'a@acta.dev',
      comment: '   ',
    });

    expect(fake.inserts()[0].payload?.comment).toBeNull();
  });

  for (const status of ['published', 'scheduled', 'archived']) {
    it(`refuses to open a review on a ${status} article`, async () => {
      const fake = createFakeClient(articleAt(status, 1));

      await expect(
        requestReview(fake.client, { articleId: 'article-1', actorEmail: 'a@acta.dev' })
      ).rejects.toThrow(`Cannot request review for an article in "${status}".`);

      expect(fake.inserts()).toHaveLength(0);
    });
  }

  it('throws when the article does not exist', async () => {
    const fake = createFakeClient(() => ({ data: null, error: null }));

    await expect(
      requestReview(fake.client, { articleId: 'missing', actorEmail: 'a@acta.dev' })
    ).rejects.toThrow('Article not found.');
  });

  it('surfaces a write error instead of silently succeeding', async () => {
    const fake = createFakeClient((call) => {
      if (call.table === 'news_articles' && call.op === 'select') {
        return { data: { status: 'draft' }, error: null };
      }
      if (call.table === 'article_versions') return { data: { version_number: 1 }, error: null };
      if (call.table === 'article_reviews') return { data: null, error: { message: 'rls denied' } };
      return { data: null, error: null };
    });

    await expect(
      requestReview(fake.client, { articleId: 'article-1', actorEmail: 'a@acta.dev' })
    ).rejects.toMatchObject({ message: 'rls denied' });
  });
});

describe('approve', () => {
  it('appends a resolved approval without changing the article status', async () => {
    const fake = createFakeClient(articleAt('in_review', 4));

    await approve(fake.client, {
      articleId: 'article-1',
      actorEmail: 'editor@acta.dev',
      comment: 'looks good',
    });

    const review = fake.inserts().find((c) => c.table === 'article_reviews');
    expect(review?.payload).toMatchObject({
      article_id: 'article-1',
      version_number: 4,
      state: 'approved',
      requested_by: 'editor@acta.dev',
      reviewer_email: 'editor@acta.dev',
      comment: 'looks good',
    });
    expect(review?.payload?.resolved_at).toEqual(expect.any(String));

    // Publishing stays an explicit, separate step.
    expect(fake.updates()).toHaveLength(0);
  });
});

describe('requestChanges', () => {
  it('appends the event and sends the article back to draft', async () => {
    const fake = createFakeClient(articleAt('in_review', 3));

    await requestChanges(fake.client, {
      articleId: 'article-1',
      actorEmail: 'editor@acta.dev',
      comment: 'needs sources',
    });

    const review = fake.inserts().find((c) => c.table === 'article_reviews');
    expect(review?.payload).toMatchObject({
      state: 'changes_requested',
      reviewer_email: 'editor@acta.dev',
      comment: 'needs sources',
    });

    const update = fake.updates().find((c) => c.table === 'news_articles');
    expect(update?.payload).toEqual({ status: 'draft' });
  });

  it('leaves the status alone when the article is no longer in review', async () => {
    const fake = createFakeClient(articleAt('draft', 3));

    await requestChanges(fake.client, {
      articleId: 'article-1',
      actorEmail: 'editor@acta.dev',
      comment: 'needs sources',
    });

    expect(fake.inserts()).toHaveLength(1);
    expect(fake.updates()).toHaveLength(0);
  });
});

describe('listThread', () => {
  it('maps rows to the camelCase event shape', async () => {
    const fake = createFakeClient(() => ({
      data: [
        {
          id: 'r1',
          article_id: 'a1',
          version_number: 2,
          state: 'requested',
          requested_by: 'author@acta.dev',
          reviewer_email: null,
          comment: 'ready',
          created_at: '2026-08-16T10:00:00.000Z',
          resolved_at: null,
        },
      ],
      error: null,
    }));

    const thread = await listThread(fake.client, 'a1');

    expect(thread).toEqual([
      {
        id: 'r1',
        articleId: 'a1',
        versionNumber: 2,
        state: 'requested',
        requestedBy: 'author@acta.dev',
        reviewerEmail: null,
        comment: 'ready',
        createdAt: '2026-08-16T10:00:00.000Z',
        resolvedAt: null,
      },
    ]);
  });
});

describe('listOpen', () => {
  const article = (id: string) => ({ id, title: `Title ${id}`, slug: `slug-${id}` });

  function reviewRow(over: Partial<Record<string, unknown>>) {
    return {
      id: 'r',
      article_id: 'a1',
      version_number: 1,
      state: 'requested',
      requested_by: 'author@acta.dev',
      reviewer_email: null,
      comment: null,
      created_at: '2026-08-16T10:00:00.000Z',
      resolved_at: null,
      article: article('a1'),
      ...over,
    };
  }

  /** Rows arrive newest-first, mirroring the service's `order(created_at desc)`. */
  function resolverFor(rows: unknown[], versions: unknown[] = []): Resolver {
    return (call) => {
      if (call.table === 'article_reviews') return { data: rows, error: null };
      if (call.table === 'article_versions') return { data: versions, error: null };
      return { data: null, error: null };
    };
  }

  it('returns an article whose newest event is still requested', async () => {
    const fake = createFakeClient(resolverFor([reviewRow({ id: 'r1' })]));

    const open = await listOpen(fake.client);

    expect(open).toHaveLength(1);
    expect(open[0]).toMatchObject({
      articleId: 'a1',
      articleTitle: 'Title a1',
      articleSlug: 'slug-a1',
      requestedBy: 'author@acta.dev',
      versionNumber: 1,
    });
  });

  it('excludes an article whose newest event resolved it', async () => {
    const fake = createFakeClient(
      resolverFor([
        reviewRow({ id: 'r2', state: 'approved', created_at: '2026-08-16T12:00:00.000Z' }),
        reviewRow({ id: 'r1', state: 'requested', created_at: '2026-08-16T10:00:00.000Z' }),
      ])
    );

    await expect(listOpen(fake.client)).resolves.toEqual([]);
  });

  it('reopens when a newer request follows a resolution', async () => {
    const fake = createFakeClient(
      resolverFor([
        reviewRow({ id: 'r3', state: 'requested', created_at: '2026-08-16T14:00:00.000Z' }),
        reviewRow({
          id: 'r2',
          state: 'changes_requested',
          created_at: '2026-08-16T12:00:00.000Z',
        }),
        reviewRow({ id: 'r1', state: 'requested', created_at: '2026-08-16T10:00:00.000Z' }),
      ])
    );

    const open = await listOpen(fake.client);
    expect(open).toHaveLength(1);
    expect(open[0].requestedAt).toBe('2026-08-16T14:00:00.000Z');
  });

  it('keeps each article separate and orders the queue oldest first', async () => {
    const fake = createFakeClient(
      resolverFor([
        reviewRow({
          id: 'rB',
          article_id: 'a2',
          article: article('a2'),
          created_at: '2026-08-16T13:00:00.000Z',
        }),
        reviewRow({ id: 'rA', article_id: 'a1', created_at: '2026-08-16T09:00:00.000Z' }),
      ])
    );

    const open = await listOpen(fake.client);

    expect(open.map((o) => o.articleId)).toEqual(['a1', 'a2']);
  });

  it('drops rows whose article is not visible to the caller', async () => {
    // RLS nulls the embedded article for a contributor looking at someone else's work.
    const fake = createFakeClient(resolverFor([reviewRow({ id: 'r1', article: null })]));

    await expect(listOpen(fake.client)).resolves.toEqual([]);
  });

  it('attaches the diff of the version the review was filed against', async () => {
    const fake = createFakeClient(
      resolverFor(
        [reviewRow({ id: 'r1', version_number: 3 })],
        [
          {
            article_id: 'a1',
            version_number: 3,
            diff_summary: {
              fieldsChanged: ['content'],
              contentAdded: 120,
              contentRemoved: 8,
              sectionsModified: 2,
            },
          },
          { article_id: 'a1', version_number: 2, diff_summary: null },
        ]
      )
    );

    const open = await listOpen(fake.client);

    expect(open[0].diffSummary).toEqual({
      fieldsChanged: ['content'],
      contentAdded: 120,
      contentRemoved: 8,
      sectionsModified: 2,
    });
  });

  it('falls back to a null diff when the version has none', async () => {
    const fake = createFakeClient(resolverFor([reviewRow({ id: 'r1', version_number: 9 })], []));

    const open = await listOpen(fake.client);
    expect(open[0].diffSummary).toBeNull();
  });

  it('returns an empty queue without querying versions', async () => {
    const fake = createFakeClient(resolverFor([]));

    await expect(listOpen(fake.client)).resolves.toEqual([]);
    expect(fake.calls.filter((c) => c.table === 'article_versions')).toHaveLength(0);
  });
});
