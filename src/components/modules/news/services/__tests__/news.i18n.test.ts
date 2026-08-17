import { describe, expect, it } from 'vitest';
import type { TypedSupabaseClient } from '@/lib/supabase';
import { fetchNewsBySlug, fetchNewsList } from '../news.service';

/**
 * Locale resolution in the news service.
 *
 * The rule under test is the fallback chain: the translation for the requested
 * locale, then the source article, then null. What makes it worth testing is the
 * middle step. An article nobody has translated yet must still appear, in its
 * source language, flagged so the UI can label it. Dropping it instead would
 * leave a Spanish reader looking at an empty archive.
 */

interface Call {
  table?: string;
  rpc?: string;
  args?: Record<string, unknown>;
  filters: [string, string, unknown][];
}

type Resolver = (call: Call) => { data: unknown; error: unknown | null; count?: number };

/**
 * Minimal PostgREST-shaped fake: every builder method is chainable and the whole
 * chain is thenable, so the service can be exercised without a database.
 */
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
      textSearch(column: string, value: unknown) {
        call.filters.push(['textSearch', column, value]);
        return api;
      },
      order: () => api,
      range: () => api,
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
          const call: Call = { table, filters: [] };
          calls.push(call);
          return chain(call);
        },
      };
    },
    rpc(name: string, args: Record<string, unknown>) {
      const call: Call = { rpc: name, args, filters: [] };
      calls.push(call);
      return chain(call);
    },
  };

  return { client: client as unknown as TypedSupabaseClient, calls };
}

const baseArticleRow = {
  id: 'article-1',
  slug: 'verifiable-credentials',
  title: 'Verifiable credentials on Stellar',
  summary: 'How ACTA anchors credentials.',
  content: 'Long English body.',
  cover_image_url: null,
  category: 'product',
  status: 'published',
  source_locale: 'en',
  translation_source_hash: 'hash-v1',
  reading_time_minutes: 5,
  published_at: '2026-03-01T00:00:00.000Z',
  created_at: '2026-02-28T00:00:00.000Z',
  updated_at: '2026-03-02T00:00:00.000Z',
  author_id: 'author-1',
  author: {
    id: 'author-1',
    slug: 'jane',
    name: 'Jane Doe',
    role: 'Editor',
    bio: null,
    avatar_url: null,
    social: {},
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  tags: [{ tag_slug: 'credentials' }],
  translations: [] as unknown[],
};

const spanishTranslation = {
  locale: 'es',
  slug: 'credenciales-verificables',
  title: 'Credenciales verificables en Stellar',
  summary: 'Como ACTA ancla credenciales.',
  content: 'Cuerpo largo en espanol.',
  source_content_hash: 'hash-v1',
};

describe('fetchNewsBySlug fallback chain', () => {
  it('returns the translation when the slug belongs to one', async () => {
    const { client } = createFakeClient((call) => {
      if (call.table === 'article_translations') {
        return { data: { article_id: 'article-1' }, error: null };
      }
      return {
        data: { ...baseArticleRow, translations: [spanishTranslation] },
        error: null,
      };
    });

    const article = await fetchNewsBySlug(client, 'credenciales-verificables', 'es');

    expect(article).not.toBeNull();
    expect(article?.locale).toBe('es');
    expect(article?.isTranslated).toBe(true);
    expect(article?.title).toBe(spanishTranslation.title);
    expect(article?.content).toBe(spanishTranslation.content);
    expect(article?.slug).toBe('credenciales-verificables');
  });

  it('resolves the source slug in the source locale', async () => {
    const { client } = createFakeClient((call) => {
      if (call.table === 'article_translations') return { data: null, error: null };
      return { data: { ...baseArticleRow, translations: [spanishTranslation] }, error: null };
    });

    const article = await fetchNewsBySlug(client, 'verifiable-credentials', 'en');

    expect(article?.locale).toBe('en');
    expect(article?.isTranslated).toBe(false);
    expect(article?.title).toBe(baseArticleRow.title);
  });

  it('falls back to the source when the requested locale has no translation', async () => {
    const { client } = createFakeClient((call) => {
      if (call.table === 'article_translations') return { data: null, error: null };
      return { data: { ...baseArticleRow, translations: [] }, error: null };
    });

    const article = await fetchNewsBySlug(client, 'verifiable-credentials', 'es');

    // Still rendered, still labelled as English: the reader sees the article and
    // the UI can say why it is not in their language.
    expect(article).not.toBeNull();
    expect(article?.locale).toBe('en');
    expect(article?.sourceLocale).toBe('en');
    expect(article?.isTranslated).toBe(false);
    expect(article?.availableLocales).toEqual(['en']);
  });

  it('returns null when neither table matches the slug', async () => {
    const { client } = createFakeClient(() => ({ data: null, error: null }));
    expect(await fetchNewsBySlug(client, 'does-not-exist', 'es')).toBeNull();
  });

  it('prefers the source over a same-locale translation row', async () => {
    // A translation whose locale equals the source locale is a data anomaly, not
    // a reason to shadow the original.
    const { client } = createFakeClient((call) => {
      if (call.table === 'article_translations') return { data: null, error: null };
      return {
        data: {
          ...baseArticleRow,
          translations: [{ ...spanishTranslation, locale: 'en', slug: 'shadow' }],
        },
        error: null,
      };
    });

    const article = await fetchNewsBySlug(client, 'verifiable-credentials', 'en');
    expect(article?.title).toBe(baseArticleRow.title);
    expect(article?.isTranslated).toBe(false);
  });

  it('exposes the slug for each locale the article exists in', async () => {
    const { client } = createFakeClient((call) => {
      if (call.table === 'article_translations') return { data: null, error: null };
      return { data: { ...baseArticleRow, translations: [spanishTranslation] }, error: null };
    });

    const article = await fetchNewsBySlug(client, 'verifiable-credentials', 'en');

    expect(article?.slugByLocale).toEqual({
      en: 'verifiable-credentials',
      es: 'credenciales-verificables',
    });
    expect(article?.availableLocales.sort()).toEqual(['en', 'es']);
  });

  it('queries the translation table with the requested locale', async () => {
    const { client, calls } = createFakeClient((call) => {
      if (call.table === 'article_translations') return { data: null, error: null };
      return { data: { ...baseArticleRow, translations: [] }, error: null };
    });

    await fetchNewsBySlug(client, 'algo', 'es');

    const translationCall = calls.find((call) => call.table === 'article_translations');
    expect(translationCall?.filters).toEqual([
      ['eq', 'locale', 'es'],
      ['eq', 'slug', 'algo'],
    ]);
  });
});

describe('fetchNewsList locale resolution', () => {
  it('renders the translated title in the requested locale', async () => {
    const { client } = createFakeClient(() => ({
      data: [{ ...baseArticleRow, translations: [spanishTranslation] }],
      error: null,
      count: 1,
    }));

    const response = await fetchNewsList(client, { page: 1 }, 'es');

    expect(response.items).toHaveLength(1);
    expect(response.items[0].title).toBe(spanishTranslation.title);
    expect(response.items[0].slug).toBe(spanishTranslation.slug);
    expect(response.items[0].isTranslated).toBe(true);
  });

  it('keeps untranslated articles in the listing, in their source language', async () => {
    const { client } = createFakeClient(() => ({
      data: [{ ...baseArticleRow, translations: [] }],
      error: null,
      count: 1,
    }));

    const response = await fetchNewsList(client, { page: 1 }, 'es');

    expect(response.items).toHaveLength(1);
    expect(response.items[0].locale).toBe('en');
    expect(response.items[0].isTranslated).toBe(false);
  });
});

describe('fetchNewsList search', () => {
  it('routes a search through search_articles with the requested locale', async () => {
    const { client, calls } = createFakeClient((call) => {
      if (call.rpc === 'search_articles') {
        return {
          data: [{ article_id: 'article-1', rank: 0.9, matched_locale: 'es' }],
          error: null,
        };
      }
      return {
        data: [{ ...baseArticleRow, translations: [spanishTranslation] }],
        error: null,
      };
    });

    const response = await fetchNewsList(client, { search: 'credenciales', page: 1 }, 'es');

    const rpcCall = calls.find((call) => call.rpc === 'search_articles');
    expect(rpcCall?.args).toEqual({ p_query: 'credenciales', p_locale: 'es' });
    expect(response.items[0].title).toBe(spanishTranslation.title);
    expect(response.total).toBe(1);
  });

  it('orders results by the rank the database returned, not by the row order', async () => {
    const second = { ...baseArticleRow, id: 'article-2', slug: 'second', title: 'Second' };

    const { client } = createFakeClient((call) => {
      if (call.rpc === 'search_articles') {
        // article-2 ranks first.
        return {
          data: [
            { article_id: 'article-2', rank: 0.9, matched_locale: 'en' },
            { article_id: 'article-1', rank: 0.2, matched_locale: 'en' },
          ],
          error: null,
        };
      }
      // Postgres returns rows in an unspecified order for an `in` filter.
      return { data: [baseArticleRow, second], error: null };
    });

    const response = await fetchNewsList(client, { search: 'stellar', page: 1 }, 'en');

    expect(response.items.map((item) => item.id)).toEqual(['article-2', 'article-1']);
  });

  it('short-circuits when the search matched nothing', async () => {
    const { client, calls } = createFakeClient((call) => {
      if (call.rpc === 'search_articles') return { data: [], error: null };
      return { data: [], error: null };
    });

    const response = await fetchNewsList(client, { search: 'nada', page: 1 }, 'es');

    expect(response.items).toEqual([]);
    expect(response.total).toBe(0);
    // No row query at all: the id list was empty.
    expect(calls.filter((call) => call.table === 'news_articles')).toHaveLength(0);
  });

  it('falls back to a locale-configured textSearch when the function is absent', async () => {
    // A database that has not run 0007_i18n.sql yet. Degrading to the source
    // table beats showing the reader an empty result set.
    const { client, calls } = createFakeClient((call) => {
      if (call.rpc === 'search_articles') {
        return { data: null, error: { code: 'PGRST202', message: 'function not found' } };
      }
      return { data: [baseArticleRow], error: null, count: 1 };
    });

    const response = await fetchNewsList(client, { search: 'credenciales', page: 1 }, 'es');

    const rowCall = calls.find((call) => call.table === 'news_articles');
    expect(rowCall?.filters).toContainEqual(['textSearch', 'search_tsv', 'credenciales']);
    expect(response.items).toHaveLength(1);
  });
});
