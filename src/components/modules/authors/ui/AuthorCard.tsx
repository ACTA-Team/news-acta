import Link from 'next/link';
import type { AuthorCardProps } from '@/@types/author';

export function AuthorCard({ author, compact }: AuthorCardProps) {
  return (
    <Link
      href={`/authors/${author.slug}`}
      className="flex items-center gap-3 rounded-2xl border border-zinc-200 p-4 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
    >
      <div className="h-12 w-12 shrink-0 rounded-full bg-zinc-200 dark:bg-zinc-800" />
      <div className="flex flex-col">
        <span className="font-medium text-zinc-900 dark:text-zinc-100">
          {author.name}
        </span>
        {!compact && author.role ? (
          <span className="text-sm text-zinc-500">{author.role}</span>
        ) : null}
      </div>
    </Link>
  );
}
