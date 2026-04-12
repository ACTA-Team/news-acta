import {
  NewsHeader,
  NewsList,
  fetchNewsList,
} from '@/components/modules/news';
import { createClient } from '@/lib/supabase/server';
import { Container } from '@/layouts';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'News',
  description:
    'Announcements, product updates, engineering deep-dives and community highlights from the ACTA ecosystem.',
  path: '/news',
});

export default async function NewsPage() {
  const supabase = await createClient();
  const initialData = await fetchNewsList(supabase, { page: 1 });

  return (
    <Container className="flex flex-col gap-10 py-16">
      <NewsHeader />
      <NewsList initialData={initialData} initialFilters={{ page: 1 }} />
    </Container>
  );
}
