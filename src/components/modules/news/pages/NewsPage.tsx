import type { Metadata } from 'next';

import type { NewsListResponse } from '@/@types/news';
import { getTranslations } from '@/i18n/dictionaries';
import { resolveLocale, type LocaleParams } from '@/i18n/params';
import { buildMetadata } from '@/lib/seo';
import { hasSupabasePublicEnv } from '@/lib/supabase/env';
import { createClient } from '@/lib/supabase/server';
import { Container } from '@/layouts';

import { NEWS_DEFAULT_PAGE_SIZE, NEWS_ROUTES } from '../constants';
import { fetchNewsList } from '../services/news.service';
import { NewsHeader } from '../ui/NewsHeader';
import { NewsList } from '../ui/NewsList';

interface NewsPageProps {
  params: LocaleParams;
}

export async function generateNewsMetadata({ params }: NewsPageProps): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const { t } = await getTranslations(locale);

  return buildMetadata({
    title: t('news.metaTitle'),
    description: t('news.metaDescription'),
    path: NEWS_ROUTES.index,
    locale,
  });
}

export async function NewsPageContent({ params }: NewsPageProps) {
  const locale = await resolveLocale(params);
  const { t } = await getTranslations(locale);

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
    initialData = await fetchNewsList(supabase, { page: 1 }, locale);
  }

  return (
    <Container className="flex flex-col gap-10 py-16">
      <NewsHeader t={t} />
      <NewsList initialData={initialData} initialFilters={{ page: 1 }} />
    </Container>
  );
}
