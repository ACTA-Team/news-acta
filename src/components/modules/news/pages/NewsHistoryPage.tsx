import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { buildMetadata } from '@/lib/seo';
import { createClient } from '@/lib/supabase/server';
import { Container } from '@/layouts';
import { fetchNewsBySlug } from '../services/news.service';
import { fetchArticleVersions } from '../services/versions.service';
import { VersionInteractiveSelector } from '../ui/VersionInteractiveSelector';
import { NEWS_ROUTES } from '../constants';

interface NewsHistoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateNewsHistoryMetadata({
  params,
}: NewsHistoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  return buildMetadata({
    title: `Version History`,
    description: `Full edit history for this article, anchored on Stellar.`,
    path: `${NEWS_ROUTES.detail(slug)}/history`,
  });
}

export async function NewsHistoryPageContent({ params }: NewsHistoryPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const article = await fetchNewsBySlug(supabase, slug);
  if (!article) notFound();

  const versions = await fetchArticleVersions(supabase, article.id);

  return (
    <Container>
      <div className="mx-auto max-w-3xl py-10">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-xs text-zinc-400" aria-label="Breadcrumb">
          <Link href={NEWS_ROUTES.index} className="hover:text-zinc-700 dark:hover:text-zinc-200">
            News
          </Link>
          <span>/</span>
          <Link
            href={NEWS_ROUTES.detail(slug)}
            className="hover:text-zinc-700 dark:hover:text-zinc-200"
          >
            {article.title}
          </Link>
          <span>/</span>
          <span className="text-zinc-600 dark:text-zinc-300">Version History</span>
        </nav>

        {/* Header */}
        <div className="mb-8 flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Version History
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Every edit to{' '}
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              &ldquo;{article.title}&rdquo;
            </span>{' '}
            is automatically snapshotted and anchored on Stellar. Select any two versions to
            compare them side by side.
          </p>
        </div>

        {/* Stats bar */}
        <div className="mb-8 flex flex-wrap gap-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900/40">
          <Stat label="Total versions" value={versions.length} />
          <Stat
            label="On-chain"
            value={versions.filter((v) => v.stellarTxHash).length}
          />
          <Stat
            label="Latest version"
            value={versions[0] ? `v${versions[0].versionNumber}` : '—'}
          />
          <Stat
            label="Hash chain"
            value={versions.length > 1 ? '✓ intact' : '—'}
          />
        </div>

        {/* Interactive timeline + comparison */}
        <VersionInteractiveSelector
          versions={versions}
          fullVersions={new Map()}
          articleSlug={slug}
          onRequestVersion={async (versionNumber) => {
            'use server';
            const { fetchArticleVersionByNumber } = await import(
              '../services/versions.service'
            );
            const { createClient: mkClient } = await import('@/lib/supabase/server');
            const s = await mkClient();
            return fetchArticleVersionByNumber(s, article.id, versionNumber);
          }}
        />
      </div>
    </Container>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-zinc-400">{label}</span>
      <span className="font-semibold text-zinc-900 dark:text-zinc-100">{value}</span>
    </div>
  );
}
