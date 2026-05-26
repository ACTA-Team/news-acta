'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/supabase';
import { computeArticleDiff } from '@/lib/diff';
import { submitVersionChain } from '@/lib/stellar';
import { requireAdmin } from './services/auth.service';

export interface AdminLoginState {
  type: 'idle' | 'success' | 'error';
  message: string;
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function sendAdminMagicLinkAction(
  _prevState: AdminLoginState,
  formData: FormData,
): Promise<AdminLoginState> {
  const rawEmail = String(formData.get('email') ?? '');
  const email = normalizeEmail(rawEmail);

  if (!isValidEmail(email)) {
    return { type: 'error', message: 'Enter a valid email address.' };
  }

  const adminClient = createAdminClient();
  const { data: adminRow, error: adminError } = await adminClient
    .from('admin_users')
    .select('email')
    .eq('email', email)
    .maybeSingle();

  if (adminError || !adminRow) {
    return {
      type: 'success',
      message: 'If the email is authorized, you will receive a sign-in link.',
    };
  }

  const supabase = await createClient();
  const redirectBase =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';

  await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${redirectBase}/auth/callback?next=/admin`,
      shouldCreateUser: true,
    },
  });

  return {
    type: 'success',
    message: 'If the email is authorized, you will receive a sign-in link.',
  };
}

export async function adminLogoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/admin/login');
}

function parseTags(value: FormDataEntryValue | null): string[] {
  const raw = String(value ?? '');
  return raw
    .split(',')
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => tag.length > 0);
}

export async function saveAdminNewsArticleAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const supabase = await createClient();
  const id = String(formData.get('id') ?? '').trim();
  const title = String(formData.get('title') ?? '').trim();
  const slug = String(formData.get('slug') ?? '').trim();
  const summary = String(formData.get('summary') ?? '').trim();
  const content = String(formData.get('content') ?? '').trim();
  const coverImageUrl = String(formData.get('coverImageUrl') ?? '').trim();
  const category = String(formData.get('category') ?? 'announcement');
  const status = String(formData.get('status') ?? 'draft');
  const authorId = String(formData.get('authorId') ?? '').trim();
  const readingTimeMinutes = Number(formData.get('readingTimeMinutes') ?? 1);
  const publishedAtRaw = String(formData.get('publishedAt') ?? '').trim();
  const tags = parseTags(formData.get('tags'));

  if (!title || !slug || !summary || !content || !authorId) {
    throw new Error('Required fields are missing.');
  }

  const payload = {
    slug,
    title,
    summary,
    content,
    cover_image_url: coverImageUrl || null,
    category: category as 'announcement' | 'product' | 'ecosystem' | 'engineering' | 'community',
    status: status as 'draft' | 'published' | 'archived',
    author_id: authorId,
    reading_time_minutes: Number.isFinite(readingTimeMinutes) ? Math.max(1, readingTimeMinutes) : 1,
    published_at: publishedAtRaw ? new Date(publishedAtRaw).toISOString() : null,
  };

  let articleId = id;

  if (articleId) {
    // -----------------------------------------------------------------------
    // UPDATE path — snapshot happens via DB trigger; we then patch diff_summary
    // and fire the Stellar anchor asynchronously.
    // -----------------------------------------------------------------------

    // 1. Fetch current state BEFORE the update (for diff computation)
    const { data: currentRow, error: fetchError } = await supabase
      .from('news_articles')
      .select('title, summary, content, category, slug')
      .eq('id', articleId)
      .single();

    if (fetchError) throw fetchError;

    // 2. Persist the update (this fires the DB trigger, creating the version row)
    const { error: updateError } = await supabase
      .from('news_articles')
      .update(payload)
      .eq('id', articleId);

    if (updateError) throw updateError;

    // 3. Only patch version metadata if a versioned field actually changed
    const versionedFieldChanged =
      currentRow.title !== title ||
      currentRow.summary !== summary ||
      currentRow.content !== content ||
      currentRow.category !== category;

    if (versionedFieldChanged) {
      // Compute structured diff between old and new
      const diffSummary = computeArticleDiff(
        {
          title: currentRow.title,
          summary: currentRow.summary,
          content: currentRow.content,
          category: currentRow.category,
        },
        { title, summary, content, category },
      );

      // Fetch the version row that was just created by the trigger
      const { data: versionRow } = await supabase
        .from('article_versions')
        .select('id, version_number, content_hash')
        .eq('article_id', articleId)
        .order('version_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (versionRow) {
        // 4. Patch diff_summary onto the new version row
        await supabase
          .from('article_versions')
          .update({ diff_summary: diffSummary as unknown as Json })
          .eq('id', versionRow.id);

        // 5. Fire-and-forget Stellar anchor (non-blocking)
        void submitVersionChain(
          currentRow.slug,
          versionRow.version_number,
          versionRow.content_hash,
        ).then(async (txHash) => {
          if (txHash) {
            await supabase
              .from('article_versions')
              .update({ stellar_tx_hash: txHash })
              .eq('id', versionRow.id);
          }
        });
      }
    }
  } else {
    // -----------------------------------------------------------------------
    // INSERT path — first save; no prior version to diff against.
    // -----------------------------------------------------------------------
    const { data, error } = await supabase
      .from('news_articles')
      .insert(payload)
      .select('id')
      .single();
    if (error) throw error;
    articleId = data.id;
  }

  const { error: deleteTagsError } = await supabase
    .from('news_article_tags')
    .delete()
    .eq('article_id', articleId);

  if (deleteTagsError) throw deleteTagsError;

  if (tags.length > 0) {
    const uniqueTags = [...new Set(tags)];
    const rows = uniqueTags.map((tag) => ({ article_id: articleId, tag_slug: tag }));
    const { error: insertTagsError } = await supabase.from('news_article_tags').insert(rows);
    if (insertTagsError) throw insertTagsError;
  }

  revalidatePath('/admin');
  revalidatePath('/admin/news');
  revalidatePath('/news');
  redirect('/admin/news');
}

export async function deleteAdminNewsArticleAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();
  const id = String(formData.get('id') ?? '').trim();
  if (!id) throw new Error('Invalid ID');

  const { error } = await supabase.from('news_articles').delete().eq('id', id);
  if (error) throw error;

  revalidatePath('/admin');
  revalidatePath('/admin/news');
  revalidatePath('/news');
  redirect('/admin/news');
}

/**
 * Restore a historical version as a new edit (non-destructive).
 * Loads the target version's frozen content and saves it as the current state,
 * which triggers the DB versioning hook and creates a new version entry.
 */
export async function restoreArticleVersionAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const supabase = await createClient();
  const articleId = String(formData.get('articleId') ?? '').trim();
  const versionNumber = Number(formData.get('versionNumber') ?? 0);

  if (!articleId || !versionNumber) throw new Error('Invalid restore parameters.');

  // Fetch the target version
  const { data: version, error: versionError } = await supabase
    .from('article_versions')
    .select('title, summary, content, category')
    .eq('article_id', articleId)
    .eq('version_number', versionNumber)
    .single();

  if (versionError || !version) throw new Error('Version not found.');

  // Fetch the current article to get non-versioned fields
  const { data: article, error: articleError } = await supabase
    .from('news_articles')
    .select('slug, cover_image_url, status, author_id, reading_time_minutes, published_at')
    .eq('id', articleId)
    .single();

  if (articleError || !article) throw new Error('Article not found.');

  // Write the restored content as a new update (triggers versioning)
  const { error: updateError } = await supabase
    .from('news_articles')
    .update({
      title: version.title,
      summary: version.summary,
      content: version.content,
      category: version.category,
    })
    .eq('id', articleId);

  if (updateError) throw updateError;

  revalidatePath('/admin');
  revalidatePath(`/admin/news/${articleId}/edit`);
  revalidatePath('/news');
  redirect(`/admin/news/${articleId}/edit`);
}
