/**
 * On-chain attestation for newly published articles.
 *
 * Reuses the existing Stellar helpers (`computeArticleHash`, `submitAttestation`)
 * rather than reimplementing anchoring, which is the reason scheduled
 * publishing runs as a Next.js route handler instead of a Deno edge function.
 *
 * The flow is deliberately best-effort: a Stellar outage must never stop an
 * article from going live. Failures are recorded on the attestation row
 * (`status = 'failed'`) and surfaced in the cron response.
 */

import type { PublishedArticle } from './scheduling.service';
import type { TypedSupabaseClient } from '@/lib/supabase';
import { computeArticleHash } from '@/lib/stellar/hash';
import { getActiveNetwork } from '@/lib/stellar/config';

/**
 * Anchor an article's published content hash on Stellar.
 *
 * Idempotent: `article_attestations` is unique on `(article_id, version)`, so
 * a repeat call for a version that was already attested is a no-op.
 */
export async function attestPublishedArticle(
  supabase: TypedSupabaseClient,
  article: PublishedArticle
): Promise<void> {
  const { data: row, error } = await supabase
    .from('news_articles')
    .select('id, slug, title, summary, content, published_at')
    .eq('id', article.id)
    .maybeSingle();

  if (error) throw error;
  if (!row) return;

  const contentHash = computeArticleHash({
    title: row.title,
    summary: row.summary,
    content: row.content,
    published_at: row.published_at ?? '',
  });

  const { data: latestVersion } = await supabase
    .from('article_versions')
    .select('version_number')
    .eq('article_id', article.id)
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  const version = latestVersion?.version_number ?? 1;

  // Claim the (article_id, version) slot. An empty result means another run
  // already attested this version: nothing left to do.
  const { data: claimed, error: claimError } = await supabase
    .from('article_attestations')
    .upsert(
      {
        article_id: article.id,
        version,
        content_hash: contentHash,
        network: getActiveNetwork(),
        status: 'pending',
      },
      { onConflict: 'article_id,version', ignoreDuplicates: true }
    )
    .select('id');

  if (claimError) throw claimError;

  const attestationId = claimed?.[0]?.id;
  if (!attestationId) return;

  if (!process.env.STELLAR_BLOG_SECRET_KEY) {
    console.info('[stellar] STELLAR_BLOG_SECRET_KEY not set. Skipping attestation submission.');
    return;
  }

  try {
    const { submitAttestation } = await import('@/lib/stellar/attestation');
    const result = await submitAttestation(row.slug, contentHash);

    await supabase
      .from('article_attestations')
      .update({
        stellar_tx_hash: result.stellar_tx_hash,
        ledger: result.ledger,
        status: 'confirmed',
      })
      .eq('id', attestationId);
  } catch (err) {
    await supabase
      .from('article_attestations')
      .update({ status: 'failed' })
      .eq('id', attestationId);

    throw err instanceof Error ? err : new Error(String(err));
  }
}
