import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';

import { buildMetadata } from '@/lib/seo';
import { createClient } from '@/lib/supabase/server';
import { canonicalNewsUrl } from '@/lib/url';
import { Container } from '@/layouts';

import { NEWS_ROUTES } from '../constants';
import { fetchNewsBySlug } from '../services/news.service';
import { NewsDetail } from '../ui/NewsDetail';
import { ShareButtons } from '../../share';
import { TagCloud } from '../../tags';

interface NewsDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateNewsDetailMetadata({
  params,
}: NewsDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const article = await fetchNewsBySlug(supabase, slug);
  if (!article) {
    return buildMetadata({ title: 'News', path: NEWS_ROUTES.detail(slug) });
  }
  return buildMetadata({
    title: article.title,
    description: article.summary,
    path: NEWS_ROUTES.detail(article.slug),
    image: article.coverImageUrl,
    type: 'article',
    publishedTime: article.publishedAt,
    modifiedTime: article.updatedAt,
    authors: [article.author.name],
    tags: article.tags,
  });
}

export async function NewsDetailPageContent({ params }: NewsDetailPageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const article = await fetchNewsBySlug(supabase, slug);
  if (!article) notFound();

  return (
    <Container>
      <NewsDetail article={article} />

      <div className="mx-auto max-w-3xl flex flex-col gap-6 pb-16">
        <ShareButtons
          url={canonicalNewsUrl(article.slug)}
          title={article.title}
          description={article.summary}
          hashtags={['ACTA', ...article.tags]}
        />
        <TagCloud tags={article.tags.map((t) => ({ slug: t, label: t }))} />

        {/* Version history / audit trail link */}
        <div className="flex items-center gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <Link
            href={`${NEWS_ROUTES.detail(article.slug)}/history`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:border-zinc-300 hover:bg-white hover:text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-200"
            id="article-version-history-link"
          >
            <span aria-hidden>✦</span>
            View version history &amp; on-chain audit trail
          </Link>
        </div>
      </div>
    </Container>
  );
}
