import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { AuthorProfile, fetchAuthorBySlug } from '@/components/modules/authors';
import { createClient } from '@/lib/supabase/server';
import { Container } from '@/layouts';
import { buildMetadata } from '@/lib/seo';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
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

export default async function AuthorDetailPage({ params }: PageProps) {
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
