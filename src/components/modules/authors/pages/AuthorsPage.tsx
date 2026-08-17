import type { Metadata } from 'next';
import { Users } from 'lucide-react';

import { getTranslations } from '@/i18n/dictionaries';
import { resolveLocale, type LocaleParams } from '@/i18n/params';
import type { Translator } from '@/i18n/translate';
import { buildMetadata } from '@/lib/seo';
import { createClient } from '@/lib/supabase/server';
import { Container } from '@/layouts';

import { AUTHOR_ROUTES } from '../constants';
import { fetchAuthors } from '../services/authors.service';
import { AuthorCard } from '../ui/AuthorCard';

interface AuthorsPageProps {
  params: LocaleParams;
}

export async function generateAuthorsMetadata({ params }: AuthorsPageProps): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const { t } = await getTranslations(locale);

  return buildMetadata({
    title: t('authors.metaTitle'),
    description: t('authors.metaDescription'),
    path: AUTHOR_ROUTES.index,
    locale,
  });
}

function AuthorsPageHeader({ t }: { t: Translator }) {
  return (
    <header className="border-b border-border/80 pb-8">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
        {t('authors.header.eyebrow')}
      </p>
      <h1 className="mt-2 text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
        {t('authors.header.title')}
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
        {t('authors.header.description')}
      </p>
    </header>
  );
}

export async function AuthorsPageContent({ params }: AuthorsPageProps) {
  const locale = await resolveLocale(params);
  const { t } = await getTranslations(locale);
  const supabase = await createClient();
  const authors = await fetchAuthors(supabase, locale);

  return (
    <Container className="flex flex-col gap-10 py-12 sm:py-16">
      <AuthorsPageHeader t={t} />
      {authors.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-16 text-center sm:py-20">
          <div className="flex size-10 items-center justify-center rounded-full border border-border/60 bg-background/50 text-muted-foreground">
            <Users className="size-5" strokeWidth={1.5} />
          </div>
          <div className="max-w-sm space-y-1.5">
            <p className="text-sm font-medium text-foreground">{t('authors.empty.title')}</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t('authors.empty.description')}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {authors.map((author) => (
            <AuthorCard key={author.id} author={author} locale={locale} />
          ))}
        </div>
      )}
    </Container>
  );
}
