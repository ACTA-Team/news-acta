import Link from 'next/link';
import { BookOpen, Clock3, Sparkles, Users } from 'lucide-react';

import { buildMetadata } from '@/lib/seo';
import { createClient } from '@/lib/supabase/server';
import { Container } from '@/layouts';
import { Button } from '@/components/ui/button';
import { NewsCard, fetchNewsList, NEWS_ROUTES } from '@/components/modules/news';
import {
  MonthlyReviewCard,
  fetchMonthlyReviews,
  MONTHLY_REVIEW_ROUTES,
} from '@/components/modules/monthly-review';
import { siteConfig } from '@/config/site';

export const metadata = buildMetadata({
  title: 'Home',
  description: siteConfig.description,
  path: '/',
});

const featureItems = [
  {
    title: 'Latest announcements',
    description: 'Track every ACTA launch, milestone and product update in one place.',
    icon: Sparkles,
  },
  {
    title: 'Ecosystem insights',
    description: 'Read editorial deep dives written for builders, contributors, and partners.',
    icon: BookOpen,
  },
  {
    title: 'Authors & voices',
    description: 'Discover the people shaping ACTA with author profiles and featured commentary.',
    icon: Users,
  },
] as const;

export default async function HomePage() {
  const supabase = await createClient();
  const latestNews = await fetchNewsList(supabase, { page: 1, pageSize: 5 });
  const monthlyReviews = await fetchMonthlyReviews(supabase);
  const latestReview = monthlyReviews[0] ?? null;

  return (
    <div className="space-y-24 pb-20">
      <section className="relative overflow-hidden bg-zinc-950 text-white">
        <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-slate-900 via-slate-950 to-transparent opacity-70" />
        <div className="absolute right-0 top-0 h-full w-full bg-[radial-gradient(circle_at_top_right,_rgba(96,165,250,0.18),_transparent_35%)]" />
        <Container className="relative pt-20 pb-16">
          <div className="grid gap-16 lg:grid-cols-[minmax(0,1.2fr)_max(320px,30%)] lg:items-end">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold uppercase tracking-[0.22em] text-slate-200 shadow-sm shadow-slate-950/10">
                ACTA News
              </p>
              <h1 className="mt-8 text-5xl font-semibold tracking-tight text-white sm:text-6xl">
                Built for stories that move the ACTA ecosystem forward.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300 sm:text-xl">
                Official updates, engineering insights, community highlights and monthly reviews
                from the ACTA network — all in one editorial home.
              </p>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link href={NEWS_ROUTES.index} className="w-full sm:w-auto">
                  <Button size="lg">Browse latest stories</Button>
                </Link>
                <Link href={MONTHLY_REVIEW_ROUTES.index} className="w-full sm:w-auto">
                  <Button size="lg">Monthly reviews</Button>
                </Link>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
              <div className="space-y-5">
                <div className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">
                  Start here
                </div>
                <div className="space-y-3">
                  <h2 className="text-3xl font-semibold text-white">
                    Your gateway to ACTA content
                  </h2>
                  <p className="text-sm leading-7 text-slate-300">
                    Discover everything from product announcements to author-led analysis, curated
                    for builders and partners.
                  </p>
                </div>
                <div className="grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
                  {siteConfig.nav.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition hover:border-sky-200/30 hover:bg-white/10"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-white py-16 dark:bg-zinc-950 dark:text-zinc-100">
        <Container className="space-y-10">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-500">
              What ACTA News offers
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-950 dark:text-white">
              The editorial hub for every ACTA update.
            </h2>
            <p className="mt-4 text-base leading-7 text-zinc-600 dark:text-zinc-300">
              Real stories, published once and surfaced everywhere the community needs them —
              product, protocol, strategy, and community coverage.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featureItems.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="rounded-3xl border border-zinc-200 bg-zinc-50 p-8 shadow-sm transition hover:border-sky-300/50 hover:bg-slate-100 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-sky-500/40"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600 dark:bg-sky-400/10 dark:text-sky-300">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold text-zinc-950 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      <section className="py-16">
        <Container className="space-y-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-500">
                Latest articles
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                Fresh ACTA stories from the community.
              </h2>
            </div>
            <Link href={NEWS_ROUTES.index} className="w-full sm:w-auto">
              <Button variant="outline" size="lg">
                View all news
              </Button>
            </Link>
          </div>

          {latestNews.items.length > 0 ? (
            <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {latestNews.items.map((article) => (
                <NewsCard key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-zinc-300 bg-zinc-50 p-12 text-center text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
              No recent articles are available yet.
            </div>
          )}
        </Container>
      </section>

      {latestReview ? (
        <section className="bg-zinc-50 py-16 dark:bg-zinc-950">
          <Container className="grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:items-center">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-500">
                Monthly review
              </p>
              <h2 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-950 dark:text-white">
                Latest ACTA review and featured highlights.
              </h2>
              <p className="mt-5 text-base leading-7 text-zinc-600 dark:text-zinc-300">
                Explore the newest monthly recap, which gathers progress updates, ecosystem metrics,
                and featured stories in one editorial summary.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={MONTHLY_REVIEW_ROUTES.detail(latestReview.period)}
                  className="w-full sm:w-auto"
                >
                  <Button size="lg">Read the latest review</Button>
                </Link>
                <Link href={MONTHLY_REVIEW_ROUTES.index} className="w-full sm:w-auto">
                  <Button variant="outline" size="lg">
                    Browse reviews
                  </Button>
                </Link>
              </div>
            </div>

            <MonthlyReviewCard review={latestReview} />
          </Container>
        </section>
      ) : null}

      <section className="rounded-5xl border border-zinc-200 bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-950 p-10 text-white shadow-2xl shadow-slate-950/20 dark:border-zinc-700">
        <Container className="grid gap-10 lg:grid-cols-[1fr_380px] lg:items-center">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-400">
              Ready to explore
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-white">
              Dive into ACTA News today.
            </h2>
            <p className="max-w-2xl text-base leading-7 text-slate-300">
              Jump straight into the stories, monthly reviews, and author voices that shape the ACTA
              roadmap and community conversation.
            </p>
          </div>

          <div className="grid gap-3 rounded-4xl bg-white/5 p-5 shadow-inner shadow-slate-950/30">
            <Link
              href={NEWS_ROUTES.index}
              className="rounded-3xl bg-slate-950/80 px-5 py-4 transition hover:bg-slate-900"
            >
              <div className="flex items-center gap-3 text-base font-semibold text-white">
                <BookOpen className="h-5 w-5" />
                View all news
              </div>
            </Link>
            <Link
              href={MONTHLY_REVIEW_ROUTES.index}
              className="rounded-3xl bg-slate-950/80 px-5 py-4 transition hover:bg-slate-900"
            >
              <div className="flex items-center gap-3 text-base font-semibold text-white">
                <Clock3 className="h-5 w-5" />
                Review monthly updates
              </div>
            </Link>
            <Link
              href="/authors"
              className="rounded-3xl bg-slate-950/80 px-5 py-4 transition hover:bg-slate-900"
            >
              <div className="flex items-center gap-3 text-base font-semibold text-white">
                <Users className="h-5 w-5" />
                Meet ACTA authors
              </div>
            </Link>
          </div>
        </Container>
      </section>
    </div>
  );
}
