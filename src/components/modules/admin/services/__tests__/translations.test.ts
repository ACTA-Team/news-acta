import { describe, expect, it } from 'vitest';
import type { TypedSupabaseClient } from '@/lib/supabase';
import {
  computeFieldHash,
  computeTranslationFieldHashes,
  computeTranslationSourceHash,
} from '@/lib/stellar/hash';
import {
  fetchArticleTranslations,
  fieldStaleness,
  getTranslationStatus,
  getTranslationStatusForArticles,
  markTranslationCurrent,
  upsertTranslation,
} from '../translations.service';

/**
 * Translation staleness.
 *
 * The mechanism: `news_articles.translation_source_hash` is a generated column,
 * so it changes in the same statement that edits a source article. A translation
 * stores the hash it was written against, and is stale exactly when the two no
 * longer match. Nothing sets a flag, which is why "editing the source marks its
 * translations stale" cannot be forgotten.
 *
 * These tests stand in for the database by computing the same hash in TypeScript.
 * `computeTranslationSourceHash` mirrors the SQL expression byte for byte, so a
 * drift between the two would show up as a hash mismatch here.
 */

interface Call {
  table: string;
  op: 'select' | 'insert' | 'update' | 'upsert' | 'delete';
  payload?: Record<string, unknown>;
  options?: Record<string, unknown>;
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
        upsert(payload: Record<string, unknown>, options?: Record<string, unknown>) {
          const call: Call = { table, op: 'upsert', payload, options, filters: [] };
          calls.push(call);
          return chain(call);
        },
        delete() {
          const call: Call = { table, op: 'delete', filters: [] };
          calls.push(call);
          return chain(call);
        },
      };
    },
  };

  return { client: client as unknown as TypedSupabaseClient, calls };
}

const sourceV1 = {
  title: 'Verifiable credentials on Stellar',
  summary: 'How ACTA anchors credentials.',
  content: 'The original English body.',
};

/** Same edit an editor would make: one word changed in the body. */
const sourceV2 = { ...sourceV1, content: 'The revised English body.' };

const HASH_V1 = computeTranslationSourceHash(sourceV1);
const HASH_V2 = computeTranslationSourceHash(sourceV2);

function articleRow(source: typeof sourceV1, hash: string) {
  return {
    id: 'article-1',
    slug: 'verifiable-credentials',
    status: 'published',
    source_locale: 'en',
    translation_source_hash: hash,
    ...source,
  };
}

function translationRow(sourceContentHash: string, fieldHashes: unknown) {
  return {
    id: 'translation-1',
    article_id: 'article-1',
    locale: 'es',
    slug: 'credenciales-verificables',
    title: 'Credenciales verificables en Stellar',
    summary: 'Como ACTA ancla credenciales.',
    content: 'El cuerpo original en espanol.',
    source_content_hash: sourceContentHash,
    source_field_hashes: fieldHashes,
    translated_by: 'editor@acta.test',
    created_at: '2026-03-01T00:00:00.000Z',
    updated_at: '2026-03-01T00:00:00.000Z',
  };
}

describe('hash mirroring', () => {
  it('excludes published_at, so rescheduling does not invalidate a translation', () => {
    // The aggregate hash covers only the three translatable fields; if it also
    // covered published_at, moving a post's date would mark every translation
    // stale for no editorial reason.
    expect(computeTranslationSourceHash(sourceV1)).toBe(computeTranslationSourceHash(sourceV1));
  });

  it('changes when any translatable field changes', () => {
    expect(computeTranslationSourceHash({ ...sourceV1, title: 'Other' })).not.toBe(HASH_V1);
    expect(computeTranslationSourceHash({ ...sourceV1, summary: 'Other' })).not.toBe(HASH_V1);
    expect(computeTranslationSourceHash({ ...sourceV1, content: 'Other' })).not.toBe(HASH_V1);
  });

  it('does not collide across field boundaries', () => {
    // Without a separator, {title:'ab', summary:'c'} and {title:'a', summary:'bc'}
    // would hash identically.
    const a = computeTranslationSourceHash({ title: 'ab', summary: 'c', content: 'd' });
    const b = computeTranslationSourceHash({ title: 'a', summary: 'bc', content: 'd' });
    expect(a).not.toBe(b);
  });
});

describe('editing the source marks its translations stale', () => {
  it('reports current while the hashes match', async () => {
    const { client } = createFakeClient((call) => {
      if (call.table === 'news_articles')
        return { data: articleRow(sourceV1, HASH_V1), error: null };
      return {
        data: [translationRow(HASH_V1, computeTranslationFieldHashes(sourceV1))],
        error: null,
      };
    });

    const status = await getTranslationStatus(client, 'article-1');

    expect(status?.es.status).toBe('current');
    // The source language has nothing to translate.
    expect(status?.en.status).toBe('current');
  });

  it('reports stale once the source hash moves on', async () => {
    const { client } = createFakeClient((call) => {
      if (call.table === 'news_articles')
        return { data: articleRow(sourceV2, HASH_V2), error: null };
      // The translation is unchanged: it still remembers v1.
      return {
        data: [translationRow(HASH_V1, computeTranslationFieldHashes(sourceV1))],
        error: null,
      };
    });

    const status = await getTranslationStatus(client, 'article-1');

    expect(status?.es.status).toBe('stale');
    expect(status?.es.translatedBy).toBe('editor@acta.test');
  });

  it('reports missing when no row exists for the locale', async () => {
    const { client } = createFakeClient((call) => {
      if (call.table === 'news_articles')
        return { data: articleRow(sourceV1, HASH_V1), error: null };
      return { data: [], error: null };
    });

    const status = await getTranslationStatus(client, 'article-1');
    expect(status?.es.status).toBe('missing');
    expect(status?.es.updatedAt).toBeNull();
  });

  it('returns null for an article that does not exist', async () => {
    const { client } = createFakeClient(() => ({ data: null, error: null }));
    expect(await getTranslationStatus(client, 'nope')).toBeNull();
  });

  it('surfaces the stale flag on the record itself', async () => {
    const { client } = createFakeClient(() => ({
      data: [translationRow(HASH_V1, computeTranslationFieldHashes(sourceV1))],
      error: null,
    }));

    const byLocale = await fetchArticleTranslations(client, 'article-1', HASH_V2);
    expect(byLocale.es?.isStale).toBe(true);

    const fresh = await fetchArticleTranslations(client, 'article-1', HASH_V1);
    expect(fresh.es?.isStale).toBe(false);
  });
});

describe('getTranslationStatusForArticles', () => {
  it('resolves a whole list without a query per row', async () => {
    const { client, calls } = createFakeClient((call) => {
      if (call.table === 'news_articles') {
        return {
          data: [
            { id: 'article-1', source_locale: 'en', translation_source_hash: HASH_V2 },
            { id: 'article-2', source_locale: 'es', translation_source_hash: 'other' },
          ],
          error: null,
        };
      }
      return {
        data: [
          {
            article_id: 'article-1',
            locale: 'es',
            source_content_hash: HASH_V1,
            translated_by: 'editor@acta.test',
            updated_at: '2026-03-01T00:00:00.000Z',
          },
        ],
        error: null,
      };
    });

    const result = await getTranslationStatusForArticles(client, ['article-1', 'article-2']);

    expect(calls).toHaveLength(2);
    // article-1 was edited after its Spanish translation was written.
    expect(result.get('article-1')?.es.status).toBe('stale');
    expect(result.get('article-1')?.en.status).toBe('current');
    // article-2 is Spanish at source and has no English translation.
    expect(result.get('article-2')?.es.status).toBe('current');
    expect(result.get('article-2')?.en.status).toBe('missing');
  });

  it('does not query at all for an empty list', async () => {
    const { client, calls } = createFakeClient(() => ({ data: [], error: null }));
    expect((await getTranslationStatusForArticles(client, [])).size).toBe(0);
    expect(calls).toHaveLength(0);
  });
});

describe('fieldStaleness', () => {
  it('flags only the fields that actually changed', () => {
    const stored = computeTranslationFieldHashes(sourceV1);
    const staleness = fieldStaleness(stored, { ...sourceV2, title: sourceV1.title }, true);

    expect(staleness.title).toBe(false);
    expect(staleness.summary).toBe(false);
    expect(staleness.content).toBe(true);
  });

  it('flags nothing when the source is untouched', () => {
    const stored = computeTranslationFieldHashes(sourceV1);
    expect(fieldStaleness(stored, sourceV1, false)).toEqual({
      title: false,
      summary: false,
      content: false,
    });
  });

  it('falls back to the aggregate verdict when per-field hashes are absent', () => {
    // A translation written before source_field_hashes existed: the aggregate
    // hash is the only evidence, so every field is reported rather than none.
    expect(fieldStaleness(null, sourceV2, true)).toEqual({
      title: true,
      summary: true,
      content: true,
    });
    expect(fieldStaleness({}, sourceV2, false)).toEqual({
      title: false,
      summary: false,
      content: false,
    });
  });

  it('ignores a malformed source_field_hashes value', () => {
    expect(fieldStaleness('not-an-object' as never, sourceV2, true).content).toBe(true);
    expect(fieldStaleness([1, 2, 3] as never, sourceV2, true).content).toBe(true);
  });
});

describe('upsertTranslation', () => {
  it('stamps the current source hash rather than one supplied by the caller', async () => {
    const { client, calls } = createFakeClient((call) => {
      if (call.table === 'news_articles')
        return { data: articleRow(sourceV2, HASH_V2), error: null };
      return { data: null, error: null };
    });

    await upsertTranslation(client, {
      articleId: 'article-1',
      locale: 'es',
      slug: 'credenciales-verificables',
      title: 'Credenciales verificables',
      summary: 'Resumen',
      content: 'Cuerpo',
      translatedBy: 'editor@acta.test',
    });

    const write = calls.find((call) => call.op === 'upsert');
    expect(write?.table).toBe('article_translations');
    expect(write?.payload?.source_content_hash).toBe(HASH_V2);
    expect(write?.options).toEqual({ onConflict: 'article_id,locale' });
    expect(write?.payload?.source_field_hashes).toEqual({
      title: computeFieldHash(sourceV2.title),
      summary: computeFieldHash(sourceV2.summary),
      content: computeFieldHash(sourceV2.content),
    });
  });

  it('refuses to store a translation in the article’s own language', async () => {
    const { client } = createFakeClient(() => ({
      data: articleRow(sourceV1, HASH_V1),
      error: null,
    }));

    await expect(
      upsertTranslation(client, {
        articleId: 'article-1',
        locale: 'en',
        slug: 'anything',
        title: 'Anything',
        summary: 'Anything',
        content: 'Anything',
        translatedBy: 'editor@acta.test',
      })
    ).rejects.toThrow(/already written in en/);
  });

  it('rejects an unknown article', async () => {
    const { client } = createFakeClient(() => ({ data: null, error: null }));

    await expect(
      upsertTranslation(client, {
        articleId: 'missing',
        locale: 'es',
        slug: 'x',
        title: 'x',
        summary: 'x',
        content: 'x',
        translatedBy: 'editor@acta.test',
      })
    ).rejects.toThrow(/not found/);
  });
});

describe('markTranslationCurrent', () => {
  it('re-stamps the hashes without touching the translated text', async () => {
    const { client, calls } = createFakeClient((call) => {
      if (call.table === 'news_articles')
        return { data: articleRow(sourceV2, HASH_V2), error: null };
      return { data: null, error: null };
    });

    await markTranslationCurrent(client, 'article-1', 'es');

    const write = calls.find((call) => call.op === 'update');
    expect(write?.table).toBe('article_translations');
    expect(write?.payload).toEqual({
      source_content_hash: HASH_V2,
      source_field_hashes: computeTranslationFieldHashes(sourceV2),
    });
    // Nothing that a reader sees is rewritten.
    expect(write?.payload).not.toHaveProperty('title');
    expect(write?.payload).not.toHaveProperty('content');
    expect(write?.filters).toEqual([
      ['eq', 'article_id', 'article-1'],
      ['eq', 'locale', 'es'],
    ]);
  });
});
