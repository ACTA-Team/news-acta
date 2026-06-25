import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { buildMetadata } from '@/lib/seo';
import { createClient } from '@/lib/supabase/server';
import { canonicalNewsUrl } from '@/lib/url';
import { computeArticleHash } from '@/lib/stellar/hash';
import { Container } from '@/layouts';

import { NEWS_ROUTES } from '../constants';
import { fetchLatestAttestationByArticleSlug } from '../services/attestation.service';
import { fetchNewsBySlug } from '../services/news.service';
import { NewsDetail } from '../ui/NewsDetail';
import { ShareButtons } from '../../share';
import { TagCloud } from '../../tags';
import { AttestationBadge } from '../ui/AttestationBadge';
import { AttestationPanel } from '../ui/AttestationPanel';
import type { ArticleAttestation } from '@/@types/attestation';

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

  const attestation: ArticleAttestation | null = await fetchLatestAttestationByArticleSlug(
    supabase,
    slug
  );
  const articleHash = computeArticleHash({
    title: article.title,
    summary: article.summary,
    content: article.content,
    published_at: article.publishedAt,
  });

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
        <AttestationBadge attestation={attestation} />
        <AttestationPanel attestation={attestation} articleHash={articleHash} />
      </div>
    </Container>
  );
}
