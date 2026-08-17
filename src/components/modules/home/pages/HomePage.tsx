import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, Clock3, Sparkles, Users } from 'lucide-react';

import { HomeHero } from '@/components/blocks';
import { Button } from '@/components/ui/button';
import { siteConfig } from '@/config/site';
import { getTranslations } from '@/i18n/dictionaries';
import { resolveLocale, type LocaleParams } from '@/i18n/params';
import { withLocale } from '@/i18n';
import type { DictionaryKey } from '@/i18n/translate';
import { buildMetadata } from '@/lib/seo';
import { Container } from '@/layouts';
import { createClient } from '@/lib/supabase/server';
import { AUTHOR_ROUTES } from '@/components/modules/authors';
import {
  MonthlyReviewCard,
  MONTHLY_REVIEW_ROUTES,
  fetchMonthlyReviews,
} from '@/components/modules/monthly-review';
import { NEWS_ROUTES, NewsCard, fetchNewsList } from '@/components/modules/news';

interface HomePageProps {
  params: LocaleParams;
}

export async function generateHomeMetadata({ params }: HomePageProps): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const { t } = await getTranslations(locale);

  return buildMetadata({
    title: t('home.metaTitle'),
    path: '/',
    locale,
  });
}

/**
 * The three value-proposition cards. Icons live in code, copy lives in the
 * dictionary, and the pairing is by key so a translator never has to know which
 * card they are editing.
 */
const featureItems: ReadonlyArray<{
  titleKey: DictionaryKey;
  descriptionKey: DictionaryKey;
  icon: typeof Sparkles;
}> = [
  {
    titleKey: 'home.features.announcements.title',
    descriptionKey: 'home.features.announcements.description',
    icon: Sparkles,
  },
  {
    titleKey: 'home.features.ecosystem.title',
    descriptionKey: 'home.features.ecosystem.description',
    icon: BookOpen,
  },
  {
    titleKey: 'home.features.authors.title',
    descriptionKey: 'home.features.authors.description',
    icon: Users,
  },
] as const;

export async function HomePageContent({ params }: HomePageProps) {
  const locale = await resolveLocale(params);
  const { t } = await getTranslations(locale);
  const href = (path: string) => withLocale(locale, path);

  const supabase = await createClient();
  const latestNews = await fetchNewsList(supabase, { page: 1, pageSize: 5 }, locale);
  const monthlyReviews = await fetchMonthlyReviews(supabase, locale);
  const latestReview = monthlyReviews[0] ?? null;

  return (
    <div>
      <HomeHero locale={locale} />

      <div className="space-y-20 pb-20 pt-4">
        <section>
          <Container>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
                {t('home.why.eyebrow')}
              </p>
              <h2 className="mt-3 text-3xl font-medium tracking-tight text-foreground md:text-4xl">
                {t('home.why.title')}
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                {t('home.why.description', { siteName: siteConfig.name })}
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featureItems.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.titleKey}
                    className="rounded-2xl border border-border/80 bg-card/40 p-7 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/60 bg-muted/50 text-foreground">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-5 text-base font-semibold text-foreground">
                      {t(feature.titleKey)}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {t(feature.descriptionKey)}
                    </p>
                  </div>
                );
              })}
            </div>
          </Container>
        </section>

        <section>
          <Container className="space-y-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  {t('home.latest.eyebrow')}
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                  {t('home.latest.title')}
                </h2>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={href(NEWS_ROUTES.index)}>{t('common.viewAll')}</Link>
              </Button>
            </div>

            {latestNews.items.length > 0 ? (
              <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
                {latestNews.items.map((article) => (
                  <NewsCard key={article.id} article={article} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 p-12 text-center text-sm text-muted-foreground">
                {t('home.latest.empty')}
              </div>
            )}
          </Container>
        </section>

        {latestReview ? (
          <section className="border-y border-border/60 bg-muted/15 py-16">
            <Container className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  {t('home.review.eyebrow')}
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                  {t('home.review.title')}
                </h2>
                <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {t('home.review.description')}
                </p>
                <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:gap-3">
                  <Button asChild>
                    <Link href={href(MONTHLY_REVIEW_ROUTES.detail(latestReview.period))}>
                      {t('home.review.latestIssue')}
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href={href(MONTHLY_REVIEW_ROUTES.index)}>
                      {t('home.review.allReviews')}
                    </Link>
                  </Button>
                </div>
              </div>
              <MonthlyReviewCard review={latestReview} />
            </Container>
          </section>
        ) : null}

        <section>
          <Container>
            <div className="flex flex-col items-start justify-between gap-6 rounded-2xl border border-border/80 bg-card/30 px-6 py-8 sm:flex-row sm:items-center sm:px-10">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{t('home.explore.title')}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('home.explore.description')}
                </p>
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:gap-2">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="justify-start sm:justify-center"
                >
                  <Link href={href(NEWS_ROUTES.index)}>
                    <BookOpen className="size-4" />
                    {t('home.explore.news')}
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="justify-start sm:justify-center"
                >
                  <Link href={href(MONTHLY_REVIEW_ROUTES.index)}>
                    <Clock3 className="size-4" />
                    {t('home.explore.reviews')}
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="justify-start sm:justify-center"
                >
                  <Link href={href(AUTHOR_ROUTES.index)}>
                    <Users className="size-4" />
                    {t('home.explore.authors')}
                  </Link>
                </Button>
              </div>
            </div>
          </Container>
        </section>
      </div>
    </div>
  );
}
