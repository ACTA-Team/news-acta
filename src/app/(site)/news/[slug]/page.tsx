import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { NewsDetail, fetchNewsBySlug, NEWS_ROUTES } from '@/components/modules/news';
import { ShareButtons } from '@/components/modules/share';
import { TagCloud } from '@/components/modules/tags';
import { createClient } from '@/lib/supabase/server';
import { Container } from '@/layouts';
import { buildMetadata } from '@/lib/seo';
import { canonicalNewsUrl } from '@/lib/url';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
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

export default async function NewsDetailPage({ params }: PageProps) {
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
