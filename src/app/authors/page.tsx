import { AuthorCard, fetchAuthors } from '@/components/modules/authors';
import { createClient } from '@/lib/supabase/server';
import { Container } from '@/layouts';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Authors',
  description: 'The voices behind the official ACTA blog.',
  path: '/authors',
});

export default async function AuthorsPage() {
  const supabase = await createClient();
  const authors = await fetchAuthors(supabase);

  return (
    <Container className="flex flex-col gap-10 py-16">
      <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
        Authors
      </h1>
      {authors.length === 0 ? (
        <p className="text-zinc-500">No authors yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {authors.map((author) => (
            <AuthorCard key={author.id} author={author} />
          ))}
        </div>
      )}
    </Container>
  );
}
