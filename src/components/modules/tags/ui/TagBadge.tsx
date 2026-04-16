import Link from 'next/link';
import type { Tag } from '@/@types/tag';

interface TagBadgeProps {
  tag: Pick<Tag, 'slug' | 'label'>;
}

export function TagBadge({ tag }: TagBadgeProps) {
  return (
    <Link
      href={`/tags/${tag.slug}`}
      className="rounded-full border border-zinc-200 px-2 py-0.5 text-xs text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100"
    >
      #{tag.label}
    </Link>
  );
}
