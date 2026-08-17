import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';

import { getTranslations } from '@/i18n/dictionaries';
import { resolveLocaleParams, type LocaleParams } from '@/i18n/params';
import { LOCALES, SetAlternateLocalePaths, withLocale } from '@/i18n';
import { buildMetadata } from '@/lib/seo';
import { createClient } from '@/lib/supabase/server';
import { canonicalNewsUrl } from '@/lib/url';
import { computeArticleHash } from '@/lib/stellar/hash';
import { Container } from '@/layouts';

import { NEWS_ROUTES } from '../constants';
import { articleAlternatePaths, articleHreflangPaths } from '../utils';
import { fetchLatestAttestationByArticleSlug } from '../services/attestation.service';
import { fetchNewsBySlug } from '../services/news.service';
import { NewsDetail } from '../ui/NewsDetail';
import { ShareButtons } from '../../share';
import { TagCloud } from '../../tags';
import { AttestationBadge } from '../ui/AttestationBadge';
import { AttestationPanel } from '../ui/AttestationPanel';
import type { ArticleAttestation } from '@/@types/attestation';

interface NewsDetailPageProps {
  params: LocaleParams<{ slug: string }>;
}

export async function generateNewsDetailMetadata({
  params,
}: NewsDetailPageProps): Promise<Metadata> {
  const { locale, slug } = await resolveLocaleParams(params);
  const { t } = await getTranslations(locale);
  const supabase = await createClient();
  const article = await fetchNewsBySlug(supabase, slug, locale);

  if (!article) {
    return buildMetadata({
      title: t('news.metaTitle'),
      path: NEWS_ROUTES.detail(slug),
      locale,
    });
  }

  return buildMetadata({
    title: article.title,
    description: article.summary,
    path: NEWS_ROUTES.detail(article.slug),
    locale,
    image: article.coverImageUrl,
    type: 'article',
    publishedTime: article.publishedAt,
    modifiedTime: article.updatedAt,
    authors: [article.author.name],
    tags: article.tags,
    // Only the locales this article actually exists in get an hreflang entry.
    // Pointing a Spanish alternate at an English article would be a worse
    // signal to a crawler than declaring no Spanish version at all.
    alternatePaths: articleHreflangPaths(article),
  });
}

export async function NewsDetailPageContent({ params }: NewsDetailPageProps) {
  const { locale, slug } = await resolveLocaleParams(params);
  const { t } = await getTranslations(locale);
  const supabase = await createClient();
  const article = await fetchNewsBySlug(supabase, slug, locale);
  if (!article) notFound();

  // The attestation is keyed by the article's canonical (source) slug, which is
  // not the slug in the URL when the reader is on a translation.
  const sourceSlug = article.slugByLocale[article.sourceLocale] ?? article.slug;

  const attestation: ArticleAttestation | null = await fetchLatestAttestationByArticleSlug(
    supabase,
    sourceSlug
  );

  // Hashed from the source text, because that is what was anchored on chain.
  const articleHash = computeArticleHash({
    title: article.title,
    summary: article.summary,
    content: article.content,
    published_at: article.publishedAt,
  });

  // Absolute per-locale paths for the language switcher. A locale with no
  // translation falls back to that locale's news index rather than a dead URL.
  const alternatePaths = articleAlternatePaths(article, LOCALES);
  const switcherPaths = Object.fromEntries(
    LOCALES.map((candidate) => [candidate, withLocale(candidate, alternatePaths[candidate])])
  );

  return (
    <Container>
      <SetAlternateLocalePaths paths={switcherPaths} />

      <NewsDetail article={article} locale={locale} t={t} />

      <div className="mx-auto max-w-3xl flex flex-col gap-6 pb-16">
        <ShareButtons
          url={canonicalNewsUrl(article.slug, locale)}
          title={article.title}
          description={article.summary}
          hashtags={['ACTA', ...article.tags]}
        />
        <TagCloud tags={article.tags.map((tag) => ({ slug: tag, label: tag }))} />
        <AttestationBadge attestation={attestation} />
        <AttestationPanel attestation={attestation} articleHash={articleHash} />

        {/* Version history / audit trail link */}
        <div className="flex items-center gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <Link
            href={withLocale(locale, NEWS_ROUTES.history(article.slug))}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:border-zinc-300 hover:bg-white hover:text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-200"
            id="article-version-history-link"
          >
            <span aria-hidden>✦</span>
            {t('news.detail.historyLink')}
          </Link>
        </div>
      </div>
    </Container>
  );
}
