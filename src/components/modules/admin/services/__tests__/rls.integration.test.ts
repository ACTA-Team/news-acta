import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '@/lib/supabase/database.types';

/**
 * RLS integration tests against a local Supabase.
 *
 * Opt-in, because they need a running database and real auth users:
 *
 *   npm run db:start
 *   npm run db:reset
 *   RUN_RLS_TESTS=1 npm test
 *
 * The pure unit tests cover the same rules from the application side; this
 * suite proves the *database* enforces them even when the REST API is called
 * directly, which is the point of putting the guard in Postgres.
 */

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const enabled = process.env.RUN_RLS_TESTS === '1' && Boolean(URL && ANON_KEY && SERVICE_KEY);

const suffix = Math.random().toString(36).slice(2, 8);
const PASSWORD = 'rls-test-password-1234';

const emails = {
  owner: `rls-owner-${suffix}@acta.test`,
  editor: `rls-editor-${suffix}@acta.test`,
  author: `rls-author-${suffix}@acta.test`,
  contributor: `rls-contributor-${suffix}@acta.test`,
};

type Client = SupabaseClient<Database>;

let admin: Client;
const clients: Record<keyof typeof emails, Client> = {} as never;
const authorIds: { a1: string; a2: string } = { a1: '', a2: '' };
const articleIds: { authorDraft: string; contributorDraft: string } = {
  authorDraft: '',
  contributorDraft: '',
};
const userIds: string[] = [];

async function signIn(email: string): Promise<Client> {
  const client = createClient<Database>(URL!, ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw error;
  return client;
}

describe.skipIf(!enabled)('editorial RLS', () => {
  beforeAll(async () => {
    admin = createClient<Database>(URL!, SERVICE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: authors, error: authorError } = await admin
      .from('authors')
      .insert([
        { slug: `rls-a1-${suffix}`, name: `RLS Author One ${suffix}` },
        { slug: `rls-a2-${suffix}`, name: `RLS Author Two ${suffix}` },
      ])
      .select('id, slug');
    if (authorError) throw authorError;

    authorIds.a1 = authors!.find((a) => a.slug === `rls-a1-${suffix}`)!.id;
    authorIds.a2 = authors!.find((a) => a.slug === `rls-a2-${suffix}`)!.id;

    const roleAuthor: Record<keyof typeof emails, string | null> = {
      owner: null,
      editor: null,
      author: authorIds.a1,
      contributor: authorIds.a2,
    };

    for (const key of Object.keys(emails) as (keyof typeof emails)[]) {
      const { data, error } = await admin.auth.admin.createUser({
        email: emails[key],
        password: PASSWORD,
        email_confirm: true,
      });
      if (error) throw error;
      userIds.push(data.user!.id);

      const { error: rowError } = await admin
        .from('admin_users')
        .insert({ email: emails[key], role: key, author_id: roleAuthor[key] });
      if (rowError) throw rowError;

      clients[key] = await signIn(emails[key]);
    }

    const { data: articles, error: articleError } = await admin
      .from('news_articles')
      .insert([
        {
          slug: `rls-author-draft-${suffix}`,
          title: 'Author draft',
          summary: 's',
          content: 'c',
          category: 'product',
          status: 'draft',
          author_id: authorIds.a1,
        },
        {
          slug: `rls-contributor-draft-${suffix}`,
          title: 'Contributor draft',
          summary: 's',
          content: 'c',
          category: 'product',
          status: 'draft',
          author_id: authorIds.a2,
        },
      ])
      .select('id, slug');
    if (articleError) throw articleError;

    articleIds.authorDraft = articles!.find((a) => a.slug === `rls-author-draft-${suffix}`)!.id;
    articleIds.contributorDraft = articles!.find(
      (a) => a.slug === `rls-contributor-draft-${suffix}`
    )!.id;
  }, 60_000);

  afterAll(async () => {
    if (!admin) return;
    await admin.from('news_articles').delete().like('slug', `rls-%-${suffix}`);
    await admin.from('admin_users').delete().in('email', Object.values(emails));
    await admin.from('authors').delete().in('id', [authorIds.a1, authorIds.a2]);
    for (const id of userIds) await admin.auth.admin.deleteUser(id);
  }, 60_000);

  it('hides another author’s draft from a contributor', async () => {
    const { data, error } = await clients.contributor
      .from('news_articles')
      .select('id, slug')
      .in('id', [articleIds.authorDraft, articleIds.contributorDraft]);

    expect(error).toBeNull();
    expect(data?.map((row) => row.id)).toEqual([articleIds.contributorDraft]);
  });

  it('shows the whole desk to an author', async () => {
    const { data, error } = await clients.author
      .from('news_articles')
      .select('id')
      .in('id', [articleIds.authorDraft, articleIds.contributorDraft]);

    expect(error).toBeNull();
    expect(data).toHaveLength(2);
  });

  it('refuses a contributor editing an article they do not own', async () => {
    const { data } = await clients.contributor
      .from('news_articles')
      .update({ title: 'hijacked' })
      .eq('id', articleIds.authorDraft)
      .select('id');

    expect(data ?? []).toHaveLength(0);
  });

  it('refuses a contributor publishing their own article', async () => {
    const { error } = await clients.contributor
      .from('news_articles')
      .update({ status: 'published' })
      .eq('id', articleIds.contributorDraft);

    expect(error).not.toBeNull();
    expect(error?.message).toContain('insufficient role');
  });

  it('refuses a contributor scheduling their own article', async () => {
    const { error } = await clients.contributor
      .from('news_articles')
      .update({ status: 'scheduled', scheduled_at: new Date().toISOString() })
      .eq('id', articleIds.contributorDraft);

    expect(error).not.toBeNull();
    expect(error?.message).toContain('insufficient role');
  });

  it('rejects an invalid transition even for an owner', async () => {
    await admin
      .from('news_articles')
      .update({ status: 'archived' })
      .eq('id', articleIds.authorDraft);

    const { error } = await clients.owner
      .from('news_articles')
      .update({ status: 'published' })
      .eq('id', articleIds.authorDraft);

    expect(error).not.toBeNull();
    expect(error?.message).toContain('invalid status transition');

    await admin.from('news_articles').update({ status: 'draft' }).eq('id', articleIds.authorDraft);
  });

  it('lets an editor publish and stamps published_at', async () => {
    const { error } = await clients.editor
      .from('news_articles')
      .update({ status: 'published' })
      .eq('id', articleIds.authorDraft);

    expect(error).toBeNull();

    const { data } = await admin
      .from('news_articles')
      .select('status, published_at')
      .eq('id', articleIds.authorDraft)
      .single();

    expect(data?.status).toBe('published');
    expect(data?.published_at).not.toBeNull();
  });

  it('writes an audit row for every status change', async () => {
    const { data } = await admin
      .from('editorial_audit_log')
      .select('actor_email, from_status, to_status')
      .eq('entity_id', articleIds.authorDraft)
      .order('created_at', { ascending: true });

    expect(data?.length).toBeGreaterThan(0);
    expect(data?.at(-1)).toMatchObject({
      actor_email: emails.editor,
      from_status: 'draft',
      to_status: 'published',
    });
  });

  it('keeps article_reviews append-only', async () => {
    const { error: insertError } = await clients.contributor.from('article_reviews').insert({
      article_id: articleIds.contributorDraft,
      state: 'requested',
      requested_by: emails.contributor,
      comment: 'please review',
    });
    expect(insertError).toBeNull();

    const { data: updated } = await clients.owner
      .from('article_reviews')
      .update({ comment: 'tampered' })
      .eq('article_id', articleIds.contributorDraft)
      .select('id');
    expect(updated ?? []).toHaveLength(0);

    const { data: deleted } = await clients.owner
      .from('article_reviews')
      .delete()
      .eq('article_id', articleIds.contributorDraft)
      .select('id');
    expect(deleted ?? []).toHaveLength(0);
  });

  it('refuses a contributor appending an approval', async () => {
    const { error } = await clients.contributor.from('article_reviews').insert({
      article_id: articleIds.contributorDraft,
      state: 'approved',
      requested_by: emails.contributor,
    });

    expect(error).not.toBeNull();
  });

  it('lets only an owner change roles', async () => {
    const { data: denied } = await clients.editor
      .from('admin_users')
      .update({ role: 'owner' })
      .eq('email', emails.editor)
      .select('email');
    expect(denied ?? []).toHaveLength(0);

    const { data: allowed } = await clients.owner
      .from('admin_users')
      .update({ role: 'author' })
      .eq('email', emails.contributor)
      .select('email');
    expect(allowed).toHaveLength(1);
  });
});
