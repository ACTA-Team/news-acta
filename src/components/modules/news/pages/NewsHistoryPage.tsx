import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getTranslations } from '@/i18n/dictionaries';
import { resolveLocaleParams, type LocaleParams } from '@/i18n/params';
import { withLocale } from '@/i18n';
import { buildMetadata } from '@/lib/seo';
import { createClient } from '@/lib/supabase/server';
import { Container } from '@/layouts';

import { fetchNewsBySlug } from '../services/news.service';
import { fetchArticleVersions } from '../services/versions.service';
import { VersionInteractiveSelector } from '../ui/VersionInteractiveSelector';
import { NEWS_ROUTES } from '../constants';

interface NewsHistoryPageProps {
  params: LocaleParams<{ slug: string }>;
}

export async function generateNewsHistoryMetadata({
  params,
}: NewsHistoryPageProps): Promise<Metadata> {
  const { locale, slug } = await resolveLocaleParams(params);
  const { t } = await getTranslations(locale);

  return buildMetadata({
    title: t('news.history.metaTitle'),
    description: t('news.history.metaDescription'),
    path: NEWS_ROUTES.history(slug),
    locale,
  });
}

export async function NewsHistoryPageContent({ params }: NewsHistoryPageProps) {
  const { locale, slug } = await resolveLocaleParams(params);
  const { t } = await getTranslations(locale);
  const supabase = await createClient();

  const article = await fetchNewsBySlug(supabase, slug, locale);
  if (!article) notFound();

  const versions = await fetchArticleVersions(supabase, article.id);

  return (
    <Container>
      <div className="mx-auto max-w-3xl py-10">
        {/* Breadcrumb */}
        <nav
          className="mb-6 flex items-center gap-2 text-xs text-zinc-400"
          aria-label={t('common.breadcrumb')}
        >
          <Link
            href={withLocale(locale, NEWS_ROUTES.index)}
            className="hover:text-zinc-700 dark:hover:text-zinc-200"
          >
            {t('nav.news')}
          </Link>
          <span>/</span>
          <Link
            href={withLocale(locale, NEWS_ROUTES.detail(article.slug))}
            className="hover:text-zinc-700 dark:hover:text-zinc-200"
          >
            {article.title}
          </Link>
          <span>/</span>
          <span className="text-zinc-600 dark:text-zinc-300">{t('news.history.title')}</span>
        </nav>

        {/* Header */}
        <div className="mb-8 flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            {t('news.history.title')}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {t('news.history.descriptionPrefix')}{' '}
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              &ldquo;{article.title}&rdquo;
            </span>{' '}
            {t('news.history.descriptionSuffix')}
          </p>
        </div>

        {/* Stats bar */}
        <div className="mb-8 flex flex-wrap gap-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900/40">
          <Stat label={t('news.history.totalVersions')} value={versions.length} />
          <Stat
            label={t('news.history.onChain')}
            value={versions.filter((version) => version.stellarTxHash).length}
          />
          <Stat
            label={t('news.history.latestVersion')}
            value={versions[0] ? `v${versions[0].versionNumber}` : t('news.history.empty')}
          />
          <Stat
            label={t('news.history.hashChain')}
            value={
              versions.length > 1 ? t('news.history.hashChainIntact') : t('news.history.empty')
            }
          />
        </div>

        {/* Interactive timeline + comparison */}
        <VersionInteractiveSelector
          versions={versions}
          fullVersions={new Map()}
          articleSlug={slug}
          onRequestVersion={async (versionNumber) => {
            'use server';
            const { fetchArticleVersionByNumber } = await import('../services/versions.service');
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
