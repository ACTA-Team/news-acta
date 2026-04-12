import {
  MonthlyReviewList,
  fetchMonthlyReviews,
} from '@/components/modules/monthly-review';
import { createClient } from '@/lib/supabase/server';
import { Container } from '@/layouts';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Monthly Review',
  description:
    'Monthly reviews of the ACTA ecosystem: milestones, metrics and featured content from the month.',
  path: '/monthly-review',
});

export default async function MonthlyReviewIndexPage() {
  const supabase = await createClient();
  const initialData = await fetchMonthlyReviews(supabase);

  return (
    <Container className="flex flex-col gap-10 py-16">
      <header className="flex flex-col gap-3">
        <p className="text-sm font-medium uppercase tracking-widest text-zinc-500">
          Monthly Review
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          What happened at ACTA, month by month
        </h1>
      </header>
      <MonthlyReviewList initialData={initialData} />
    </Container>
  );
}
