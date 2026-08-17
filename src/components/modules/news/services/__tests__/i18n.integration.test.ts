import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '@/lib/supabase/database.types';
import { computeTranslationSourceHash } from '@/lib/stellar/hash';

/**
 * Bilingual schema integration tests against a local Supabase.
 *
 * Opt-in, because they need a running database:
 *
 *   npm run db:start
 *   npm run db:reset
 *   RUN_RLS_TESTS=1 npm test
 *
 * These cover the three things only Postgres can answer, and that the unit tests
 * therefore have to take on faith:
 *
 *   1. Spanish search really stems. "credenciales" has to match an article about
 *      a "credencial", which the previous 'simple' configuration could not do in
 *      any language.
 *   2. Slugs are unique per locale across both tables, so two articles can never
 *      claim the same Spanish URL.
 *   3. `translation_source_hash` is generated, so editing a source article
 *      changes it in the same statement, and its value matches the TypeScript
 *      mirror in `computeTranslationSourceHash`.
 */

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const enabled = process.env.RUN_RLS_TESTS === '1' && Boolean(URL && ANON_KEY && SERVICE_KEY);

type Client = SupabaseClient<Database>;

const suffix = Math.random().toString(36).slice(2, 8);

let admin: Client;
let anon: Client;

const ids = { author: '', articleEn: '', articleEs: '' };

const spanishSource = {
  title: `Nueva credencial verificable ${suffix}`,
  summary: 'ACTA emite una credencial verificable anclada en Stellar.',
  content:
    'La credencial se emite desde una boveda dedicada y queda anclada en la red Stellar. ' +
    'Cualquier verificador puede comprobar la credencial sin contactar al emisor.',
};

const englishSource = {
  title: `Verifiable credential release ${suffix}`,
  summary: 'ACTA issues a verifiable credential anchored on Stellar.',
  content:
    'The credential is issued from a dedicated vault and anchored on the Stellar network. ' +
    'Any verifier can check the credential without contacting the issuer.',
};

describe.skipIf(!enabled)('bilingual schema', () => {
  beforeAll(async () => {
    admin = createClient<Database>(URL!, SERVICE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    anon = createClient<Database>(URL!, ANON_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: author, error: authorError } = await admin
      .from('authors')
      .insert({ slug: `i18n-author-${suffix}`, name: 'i18n Test Author' })
      .select('id')
      .single();
    if (authorError) throw authorError;
    ids.author = author.id;

    // An English article with a Spanish translation.
    const { data: articleEn, error: articleEnError } = await admin
      .from('news_articles')
      .insert({
        slug: `i18n-en-${suffix}`,
        title: englishSource.title,
        summary: englishSource.summary,
        content: englishSource.content,
        category: 'product',
        status: 'published',
        source_locale: 'en',
        author_id: ids.author,
        published_at: new Date('2026-03-01T00:00:00.000Z').toISOString(),
      })
      .select('id, translation_source_hash')
      .single();
    if (articleEnError) throw articleEnError;
    ids.articleEn = articleEn.id;

    const { error: translationError } = await admin.from('article_translations').insert({
      article_id: ids.articleEn,
      locale: 'es',
      slug: `i18n-es-${suffix}`,
      title: spanishSource.title,
      summary: spanishSource.summary,
      content: spanishSource.content,
      source_content_hash: articleEn.translation_source_hash,
    });
    if (translationError) throw translationError;

    // A second article written in Spanish at source, with no translation.
    const { data: articleEs, error: articleEsError } = await admin
      .from('news_articles')
      .insert({
        slug: `i18n-src-es-${suffix}`,
        title: `Actualizacion de credenciales ${suffix}`,
        summary: 'Resumen en espanol sobre credenciales.',
        content: 'Contenido en espanol que menciona credenciales verificables.',
        category: 'ecosystem',
        status: 'published',
        source_locale: 'es',
        author_id: ids.author,
        published_at: new Date('2026-03-02T00:00:00.000Z').toISOString(),
      })
      .select('id')
      .single();
    if (articleEsError) throw articleEsError;
    ids.articleEs = articleEs.id;
  });

  afterAll(async () => {
    if (!enabled) return;
    for (const id of [ids.articleEn, ids.articleEs].filter(Boolean)) {
      await admin.from('news_articles').delete().eq('id', id);
    }
    if (ids.author) await admin.from('authors').delete().eq('id', ids.author);
  });

  describe('language-aware search', () => {
    it('stems Spanish: "credenciales" matches an article about a "credencial"', async () => {
      const { data, error } = await anon.rpc('search_articles', {
        p_query: 'credenciales',
        p_locale: 'es',
      });

      expect(error).toBeNull();
      const matched = (data ?? []).map((row) => row.article_id);
      expect(matched).toContain(ids.articleEn);
    });

    it('stems Spanish verbs and plurals in the source-language article too', async () => {
      const { data, error } = await anon.rpc('search_articles', {
        p_query: 'actualizaciones',
        p_locale: 'es',
      });

      expect(error).toBeNull();
      expect((data ?? []).map((row) => row.article_id)).toContain(ids.articleEs);
    });

    it('stems English: "credentials" matches "credential"', async () => {
      const { data, error } = await anon.rpc('search_articles', {
        p_query: 'credentials',
        p_locale: 'en',
      });

      expect(error).toBeNull();
      expect((data ?? []).map((row) => row.article_id)).toContain(ids.articleEn);
    });

    it('tells the caller which locale each hit matched in', async () => {
      const { data } = await anon.rpc('search_articles', {
        p_query: 'credenciales',
        p_locale: 'es',
      });

      const hit = (data ?? []).find((row) => row.article_id === ids.articleEn);
      expect(hit?.matched_locale).toBe('es');
    });

    it('ranks hits, highest first', async () => {
      const { data } = await anon.rpc('search_articles', {
        p_query: 'credenciales',
        p_locale: 'es',
      });

      const ranks = (data ?? []).map((row) => row.rank);
      expect(ranks).toEqual([...ranks].sort((a, b) => b - a));
    });

    it('never returns an unpublished article', async () => {
      await admin.from('news_articles').update({ status: 'draft' }).eq('id', ids.articleEs);

      const { data } = await anon.rpc('search_articles', {
        p_query: 'credenciales',
        p_locale: 'es',
      });
      expect((data ?? []).map((row) => row.article_id)).not.toContain(ids.articleEs);

      await admin.from('news_articles').update({ status: 'published' }).eq('id', ids.articleEs);
    });
  });

  describe('per-locale slug uniqueness', () => {
    it('rejects two translations sharing a slug in the same locale', async () => {
      const { data: other, error: insertError } = await admin
        .from('news_articles')
        .insert({
          slug: `i18n-other-${suffix}`,
          title: 'Other article',
          summary: 'Other',
          content: 'Other',
          category: 'product',
          status: 'published',
          source_locale: 'en',
          author_id: ids.author,
        })
        .select('id')
        .single();
      if (insertError) throw insertError;

      const { error } = await admin.from('article_translations').insert({
        article_id: other.id,
        locale: 'es',
        // Already taken by the first article's Spanish translation.
        slug: `i18n-es-${suffix}`,
        title: 'Duplicado',
        summary: 'Duplicado',
        content: 'Duplicado',
        source_content_hash: 'whatever',
      });

      expect(error).not.toBeNull();
      expect(error?.code).toBe('23505');

      await admin.from('news_articles').delete().eq('id', other.id);
    });

    it('allows the same slug in different locales', async () => {
      const { error } = await admin.from('article_translations').insert({
        article_id: ids.articleEs,
        locale: 'en',
        // The Spanish namespace already uses this slug; English is free.
        slug: `i18n-es-${suffix}`,
        title: 'Credentials update',
        summary: 'Summary',
        content: 'Content',
        source_content_hash: 'whatever',
      });

      expect(error).toBeNull();
      await admin
        .from('article_translations')
        .delete()
        .eq('article_id', ids.articleEs)
        .eq('locale', 'en');
    });

    it('rejects a translation slug already used by a source article in that locale', async () => {
      // `i18n-src-es-<suffix>` belongs to an article whose source_locale is 'es',
      // so a Spanish translation cannot claim it: both resolve /es/news/<slug>.
      const { error } = await admin.from('article_translations').insert({
        article_id: ids.articleEn,
        locale: 'es',
        slug: `i18n-src-es-${suffix}`,
        title: 'Colision',
        summary: 'Colision',
        content: 'Colision',
        source_content_hash: 'whatever',
      });

      expect(error).not.toBeNull();
      expect(error?.code).toBe('23505');
    });

    it('rejects renaming a source article onto an existing translation slug', async () => {
      const { error } = await admin
        .from('news_articles')
        .update({ slug: `i18n-es-${suffix}`, source_locale: 'es' })
        .eq('id', ids.articleEs);

      expect(error).not.toBeNull();
      expect(error?.code).toBe('23505');
    });
  });

  describe('translation_source_hash', () => {
    it('matches the TypeScript mirror exactly', async () => {
      const { data } = await admin
        .from('news_articles')
        .select('title, summary, content, translation_source_hash')
        .eq('id', ids.articleEn)
        .single();

      expect(data?.translation_source_hash).toBe(
        computeTranslationSourceHash({
          title: data!.title,
          summary: data!.summary,
          content: data!.content,
        })
      );
    });

    it('changes when the source is edited, making its translations stale', async () => {
      const { data: before } = await admin
        .from('news_articles')
        .select('translation_source_hash')
        .eq('id', ids.articleEn)
        .single();

      const { data: translationBefore } = await admin
        .from('article_translations')
        .select('source_content_hash')
        .eq('article_id', ids.articleEn)
        .eq('locale', 'es')
        .single();

      expect(translationBefore?.source_content_hash).toBe(before?.translation_source_hash);

      await admin
        .from('news_articles')
        .update({ content: `${englishSource.content} One more paragraph.` })
        .eq('id', ids.articleEn);

      const { data: after } = await admin
        .from('news_articles')
        .select('translation_source_hash')
        .eq('id', ids.articleEn)
        .single();

      expect(after?.translation_source_hash).not.toBe(before?.translation_source_hash);
      // The translation still points at the old hash: it is now stale, and
      // nothing had to remember to mark it.
      expect(translationBefore?.source_content_hash).not.toBe(after?.translation_source_hash);
    });

    it('does not change when a non-translatable column is edited', async () => {
      const { data: before } = await admin
        .from('news_articles')
        .select('translation_source_hash')
        .eq('id', ids.articleEn)
        .single();

      await admin
        .from('news_articles')
        .update({ published_at: new Date('2026-04-01T00:00:00.000Z').toISOString() })
        .eq('id', ids.articleEn);

      const { data: after } = await admin
        .from('news_articles')
        .select('translation_source_hash')
        .eq('id', ids.articleEn)
        .single();

      // Rescheduling a post changes nothing a reader sees, so it must not
      // invalidate the translations.
      expect(after?.translation_source_hash).toBe(before?.translation_source_hash);
    });
  });

  describe('row level security', () => {
    it('lets anonymous readers see translations of published articles', async () => {
      const { data, error } = await anon
        .from('article_translations')
        .select('slug, title')
        .eq('article_id', ids.articleEn)
        .eq('locale', 'es');

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
    });

    it('hides translations of an unpublished article', async () => {
      await admin.from('news_articles').update({ status: 'draft' }).eq('id', ids.articleEn);

      const { data } = await anon
        .from('article_translations')
        .select('slug')
        .eq('article_id', ids.articleEn);
      expect(data).toEqual([]);

      await admin.from('news_articles').update({ status: 'published' }).eq('id', ids.articleEn);
    });

    it('refuses an anonymous write', async () => {
      const { error } = await anon.from('article_translations').insert({
        article_id: ids.articleEn,
        locale: 'es',
        slug: `anon-${suffix}`,
        title: 'nope',
        summary: 'nope',
        content: 'nope',
        source_content_hash: 'nope',
      });

      expect(error).not.toBeNull();
    });
  });
});
