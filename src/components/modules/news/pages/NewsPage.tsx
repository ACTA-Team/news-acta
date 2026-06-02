import type { NewsListResponse } from '@/@types/news';
import { hasSupabasePublicEnv } from '@/lib/supabase/env';
import { createClient } from '@/lib/supabase/server';
import { Container } from '@/layouts';

import { NEWS_DEFAULT_PAGE_SIZE } from '../constants';
import { fetchNewsList } from '../services/news.service';
import { NewsHeader } from '../ui/NewsHeader';
import { NewsList } from '../ui/NewsList';

export async function NewsPageContent() {
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
