import type { NewsListResponse } from '@/@types/news';
import {
  NEWS_DEFAULT_PAGE_SIZE,
  NewsHeader,
  NewsList,
  fetchNewsList,
} from '@/components/modules/news';
import { hasSupabasePublicEnv } from '@/lib/supabase/env';
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
  let initialData: NewsListResponse;

  if (!hasSupabasePublicEnv() && process.env.NODE_ENV === 'development') {
    initialData = {
      items: [],
      total: 0,
      page: 1,
      pageSize: NEWS_DEFAULT_PAGE_SIZE,
    };
  } else {
    const supabase = await createClient();
    initialData = await fetchNewsList(supabase, { page: 1 });
  }

  return (
    <Container className="flex flex-col gap-10 py-16">
      <NewsHeader />
      <NewsList initialData={initialData} initialFilters={{ page: 1 }} />
    </Container>
  );
}
