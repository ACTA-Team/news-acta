'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
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
  const redirectBase = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';

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
    const { error } = await supabase.from('news_articles').update(payload).eq('id', articleId);
    if (error) throw error;
  } else {
    const { data, error } = await supabase.from('news_articles').insert(payload).select('id').single();
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
