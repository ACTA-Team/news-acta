import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getTranslations } from '@/i18n/dictionaries';
import { resolveLocaleParams, type LocaleParams } from '@/i18n/params';
import { buildMetadata } from '@/lib/seo';
import { createClient } from '@/lib/supabase/server';
import { Container } from '@/layouts';
import { fetchNewsList, NewsList } from '@/components/modules/news';

import { TAG_ROUTES } from '../constants';
import { fetchTagBySlug } from '../services/tags.service';

interface TagPageProps {
  params: LocaleParams<{ slug: string }>;
}

export async function generateTagMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { locale, slug } = await resolveLocaleParams(params);
  const { t } = await getTranslations(locale);
  const supabase = await createClient();
  const tag = await fetchTagBySlug(supabase, slug, locale);

  // The tag slug is the identity in every language; only the label is translated,
  // so the alternates are the plain prefix swap.
  return buildMetadata({
    title: tag ? `#${tag.label}` : t('tags.fallbackTitle'),
    description: tag?.description,
    path: TAG_ROUTES.detail(slug),
    locale,
  });
}

export async function TagPageContent({ params }: TagPageProps) {
  const { locale, slug } = await resolveLocaleParams(params);
  const { t } = await getTranslations(locale);
  const supabase = await createClient();
  const tag = await fetchTagBySlug(supabase, slug, locale);
  if (!tag) notFound();

  const initialData = await fetchNewsList(supabase, { tag: slug, page: 1 }, locale);

  return (
    <Container className="flex flex-col gap-10 py-16">
      <header className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-widest text-zinc-500">{t('tags.eyebrow')}</p>
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          #{tag.label}
        </h1>
        {tag.description ? (
          <p className="max-w-2xl text-zinc-600 dark:text-zinc-400">{tag.description}</p>
        ) : null}
      </header>
      <NewsList initialData={initialData} initialFilters={{ tag: slug, page: 1 }} />
    </Container>
  );
}
