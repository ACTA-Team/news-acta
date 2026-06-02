import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

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
      </div>
    </Container>
  );
}
