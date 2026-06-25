'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/supabase';
import { computeArticleDiff } from '@/lib/diff';
import { submitVersionChain } from '@/lib/stellar/client';
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
  formData: FormData
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
        { title, summary, content, category }
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
          versionRow.content_hash
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

export async function saveAdminMonthlyReviewAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const supabase = await createClient();
  const id = String(formData.get('id') ?? '').trim();
  const period = String(formData.get('period') ?? '').trim();
  const title = String(formData.get('title') ?? '').trim();
  const summary = String(formData.get('summary') ?? '').trim();
  const coverImageUrl = String(formData.get('coverImageUrl') ?? '').trim();
  const publishedAtRaw = String(formData.get('publishedAt') ?? '').trim();

  const highlightsJson = String(formData.get('highlights') ?? '[]');
  const metricsJson = String(formData.get('metrics') ?? '[]');
  const featuredArticlesRaw = String(formData.get('featuredArticles') ?? '');

  if (!period || !title || !summary) {
    throw new Error('Required fields are missing.');
  }

  const payload = {
    period,
    title,
    summary,
    cover_image_url: coverImageUrl || null,
    highlights: JSON.parse(highlightsJson),
    metrics: JSON.parse(metricsJson),
    published_at: publishedAtRaw
      ? new Date(publishedAtRaw).toISOString()
      : new Date().toISOString(),
  };

  let reviewId = id;

  if (reviewId) {
    const { error } = await supabase.from('monthly_reviews').update(payload).eq('id', reviewId);
    if (error) throw error;
  } else {
    const { data, error } = await supabase
      .from('monthly_reviews')
      .insert(payload)
      .select('id')
      .single();
    if (error) throw error;
    reviewId = data.id;
  }

  // Clear existing featured articles
  const { error: deleteFeaturedError } = await supabase
    .from('monthly_review_articles')
    .delete()
    .eq('review_id', reviewId);

  if (deleteFeaturedError) throw deleteFeaturedError;

  // Insert new featured articles
  const articleIds = featuredArticlesRaw
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id.length > 0);

  if (articleIds.length > 0) {
    const rows = articleIds.map((articleId, index) => ({
      review_id: reviewId,
      article_id: articleId,
      position: index,
    }));
    const { error: insertFeaturedError } = await supabase
      .from('monthly_review_articles')
      .insert(rows);
    if (insertFeaturedError) throw insertFeaturedError;
  }

  revalidatePath('/admin');
  revalidatePath('/admin/monthly-reviews');
  revalidatePath('/monthly-review');
  revalidatePath(`/monthly-review/${period}`);
  revalidatePath('/');
  redirect('/admin/monthly-reviews');
}

export async function deleteAdminMonthlyReviewAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();
  const id = String(formData.get('id') ?? '').trim();
  const period = String(formData.get('period') ?? '').trim();
  if (!id) throw new Error('Invalid ID');

  const { error } = await supabase.from('monthly_reviews').delete().eq('id', id);
  if (error) throw error;

  revalidatePath('/admin');
  revalidatePath('/admin/monthly-reviews');
  revalidatePath('/monthly-review');
  if (period) {
    revalidatePath(`/monthly-review/${period}`);
  }
  revalidatePath('/');
  redirect('/admin/monthly-reviews');
}

export async function fetchMetricsForPeriodAction(period: string, network: string) {
  await requireAdmin();
  const supabase = await createClient();

  // 1. Try to fetch from stored snapshots
  const { data: snapshot, error: snapshotError } = await supabase
    .from('ecosystem_snapshots')
    .select('*')
    .eq('period', period)
    .eq('network', network)
    .maybeSingle();

  if (snapshot && !snapshotError) {
    return {
      success: true,
      source: 'database',
      horizon: snapshot.horizon_metrics,
      soroban: snapshot.soroban_metrics,
      collectedAt: snapshot.collected_at,
    };
  }

  // 2. Fetch live metrics from APIs
  try {
    const horizonUrl =
      network === 'mainnet' ? 'https://horizon.stellar.org' : 'https://horizon-testnet.stellar.org';
    const sorobanUrl =
      network === 'mainnet'
        ? 'https://soroban-rpc.stellar.org' // Or custom if any
        : 'https://soroban-testnet.stellar.org';

    const [horizon, soroban] = await Promise.all([
      import('@/lib/stellar/horizon').then((m) => m.fetchAllHorizonMetrics(horizonUrl)),
      import('@/lib/stellar/soroban').then((m) => m.fetchAllSorobanMetrics(sorobanUrl)),
    ]);

    return {
      success: true,
      source: 'live_api',
      horizon,
      soroban,
      collectedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error('Error in fetchMetricsForPeriodAction:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to fetch metrics from Stellar network.',
    };
  }
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
