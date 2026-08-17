import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getTranslations } from '@/i18n/dictionaries';
import { resolveLocaleParams, type LocaleParams } from '@/i18n/params';
import { buildMetadata } from '@/lib/seo';
import { createClient } from '@/lib/supabase/server';
import { Container } from '@/layouts';

import { AUTHOR_ROUTES } from '../constants';
import { fetchAuthorBySlug } from '../services/authors.service';
import { AuthorProfile } from '../ui/AuthorProfile';

interface AuthorDetailPageProps {
  params: LocaleParams<{ slug: string }>;
}

export async function generateAuthorDetailMetadata({
  params,
}: AuthorDetailPageProps): Promise<Metadata> {
  const { locale, slug } = await resolveLocaleParams(params);
  const { t } = await getTranslations(locale);
  const supabase = await createClient();
  const author = await fetchAuthorBySlug(supabase, slug, locale);

  if (!author) {
    return buildMetadata({
      title: t('authors.fallbackTitle'),
      path: AUTHOR_ROUTES.detail(slug),
      locale,
    });
  }

  // An author's slug is the same in every language, so the default prefix swap
  // produces the correct alternates.
  return buildMetadata({
    title: author.name,
    description: author.bio,
    path: AUTHOR_ROUTES.detail(author.slug),
    locale,
    image: author.avatarUrl,
  });
}

export async function AuthorDetailPageContent({ params }: AuthorDetailPageProps) {
  const { locale, slug } = await resolveLocaleParams(params);
  const { t } = await getTranslations(locale);
  const supabase = await createClient();
  const author = await fetchAuthorBySlug(supabase, slug, locale);
  if (!author) notFound();

  return (
    <Container className="py-16">
      <AuthorProfile author={author} t={t} />
    </Container>
  );
}
