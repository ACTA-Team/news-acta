import { Users } from 'lucide-react';

import { AuthorCard, fetchAuthors } from '@/components/modules/authors';
import { createClient } from '@/lib/supabase/server';
import { Container } from '@/layouts';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Contributors',
  description: 'Writers, editors, and guest voices on the official ACTA blog.',
  path: '/authors',
});

function AuthorsPageHeader() {
  return (
    <header className="border-b border-border/80 pb-8">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">ACTA News</p>
      <h1 className="mt-2 text-3xl font-medium tracking-tight text-foreground sm:text-4xl">Contributors</h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
        People who publish and co-author stories across the ecosystem.
      </p>
    </header>
  );
}

export default async function AuthorsPage() {
  const supabase = await createClient();
  const authors = await fetchAuthors(supabase);

  return (
    <Container className="flex flex-col gap-10 py-12 sm:py-16">
      <AuthorsPageHeader />
      {authors.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-16 text-center sm:py-20">
          <div className="flex size-10 items-center justify-center rounded-full border border-border/60 bg-background/50 text-muted-foreground">
            <Users className="size-5" strokeWidth={1.5} />
          </div>
          <div className="max-w-sm space-y-1.5">
            <p className="text-sm font-medium text-foreground">No profiles yet</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              When contributor pages go live, they will appear here.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {authors.map((author) => (
            <AuthorCard key={author.id} author={author} />
          ))}
        </div>
      )}
    </Container>
  );
}
