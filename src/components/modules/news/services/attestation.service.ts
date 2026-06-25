import type { TypedSupabaseClient } from '@/lib/supabase';
import type { ArticleAttestation } from '@/@types/attestation';

export async function fetchLatestAttestationByArticleSlug(
  supabase: TypedSupabaseClient,
  slug: string
): Promise<ArticleAttestation | null> {
  const { data: article, error: articleError } = await supabase
    .from('news_articles')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (articleError || !article) return null;

  const { data, error } = await supabase
    .from('article_attestations')
    .select('*')
    .eq('article_id', article.id)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data as ArticleAttestation;
}
