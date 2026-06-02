import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { buildMetadata } from '@/lib/seo';
import { createClient } from '@/lib/supabase/server';
import { Container } from '@/layouts';
import { fetchNewsList, NewsList } from '@/components/modules/news';

import { fetchTagBySlug } from '../services/tags.service';

interface TagPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateTagMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const tag = await fetchTagBySlug(supabase, slug);
  return buildMetadata({
    title: tag ? `#${tag.label}` : 'Tag',
    description: tag?.description,
    path: `/tags/${slug}`,
  });
}

export async function TagPageContent({ params }: TagPageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const tag = await fetchTagBySlug(supabase, slug);
  if (!tag) notFound();

  const initialData = await fetchNewsList(supabase, { tag: slug, page: 1 });

  return (
    <Container className="flex flex-col gap-10 py-16">
      <header className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-widest text-zinc-500">Tag</p>
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
