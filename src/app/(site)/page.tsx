import Link from 'next/link';
import { BookOpen, Clock3, Sparkles, Users } from 'lucide-react';

import { HomeHero } from '@/components/blocks';
import { buildMetadata } from '@/lib/seo';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/Button';
import { NewsCard, fetchNewsList, NEWS_ROUTES } from '@/components/modules/news';
import {
  MonthlyReviewCard,
  fetchMonthlyReviews,
  MONTHLY_REVIEW_ROUTES,
} from '@/components/modules/monthly-review';
import { siteConfig } from '@/config/site';
import { Container } from '@/layouts';

export const metadata = buildMetadata({
  title: 'Home',
  description: siteConfig.description,
  path: '/',
});

const featureItems = [
  {
    title: 'Latest announcements',
    description: 'Product launches, milestones and protocol news in one stream.',
    icon: Sparkles,
  },
  {
    title: 'Ecosystem & engineering',
    description: 'Editorial deep dives for builders, contributors, and partners.',
    icon: BookOpen,
  },
  {
    title: 'Authors & monthly reviews',
    description: 'Voices from the community and structured monthly recaps.',
    icon: Users,
  },
] as const;

export default async function HomePage() {
  const supabase = await createClient();
  const latestNews = await fetchNewsList(supabase, { page: 1, pageSize: 5 });
  const monthlyReviews = await fetchMonthlyReviews(supabase);
  const latestReview = monthlyReviews[0] ?? null;

  return (
    <div>
      <HomeHero />

      <div className="space-y-20 pb-20 pt-4">
        <section>
          <Container>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Why it exists
              </p>
              <h2 className="mt-3 text-3xl font-medium tracking-tight text-foreground md:text-4xl">
                One minimal feed for the whole story.
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                {siteConfig.name} is the public editorial layer for the ACTA network — so nothing
                important gets lost in chat or social noise.
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featureItems.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="rounded-2xl border border-border/80 bg-card/40 p-7 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/60 bg-muted/50 text-foreground">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-5 text-base font-semibold text-foreground">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {feature.description}
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
                  Latest
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                  New articles
                </h2>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={NEWS_ROUTES.index}>View all</Link>
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
                No articles yet. Check back soon.
              </div>
            )}
          </Container>
        </section>

        {latestReview ? (
          <section className="border-y border-border/60 bg-muted/15 py-16">
            <Container className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  Monthly review
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                  Ecosystem progress in one place.
                </h2>
                <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
                  Each issue collects highlights, metrics, and community notes — a stable reference
                  for what changed last month.
                </p>
                <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:gap-3">
                  <Button asChild>
                    <Link href={MONTHLY_REVIEW_ROUTES.detail(latestReview.period)}>
                      Latest issue
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href={MONTHLY_REVIEW_ROUTES.index}>All reviews</Link>
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
                <h2 className="text-lg font-semibold text-foreground">Keep exploring</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Jump to the most-used destinations.
                </p>
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:gap-2">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="justify-start sm:justify-center"
                >
                  <Link href={NEWS_ROUTES.index}>
                    <BookOpen className="size-4" />
                    News
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="justify-start sm:justify-center"
                >
                  <Link href={MONTHLY_REVIEW_ROUTES.index}>
                    <Clock3 className="size-4" />
                    Reviews
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="justify-start sm:justify-center"
                >
                  <Link href="/authors">
                    <Users className="size-4" />
                    Authors
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
