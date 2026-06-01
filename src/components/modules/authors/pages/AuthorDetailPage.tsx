import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { buildMetadata } from '@/lib/seo';
import { createClient } from '@/lib/supabase/server';
import { Container } from '@/layouts';

import { fetchAuthorBySlug } from '../services/authors.service';
import { AuthorProfile } from '../ui/AuthorProfile';

interface AuthorDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateAuthorDetailMetadata({
  params,
}: AuthorDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const author = await fetchAuthorBySlug(supabase, slug);
  if (!author) return buildMetadata({ title: 'Author', path: `/authors/${slug}` });
  return buildMetadata({
    title: author.name,
    description: author.bio,
    path: `/authors/${author.slug}`,
    image: author.avatarUrl,
  });
}

export async function AuthorDetailPageContent({ params }: AuthorDetailPageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const author = await fetchAuthorBySlug(supabase, slug);
  if (!author) notFound();

  return (
    <Container className="py-16">
      <AuthorProfile author={author} />
    </Container>
  );
}
