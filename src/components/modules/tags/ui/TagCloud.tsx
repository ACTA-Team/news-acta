import type { Tag } from '@/@types/tag';
import { TagBadge } from './TagBadge';

interface TagCloudProps {
  tags: Tag[];
}

export function TagCloud({ tags }: TagCloudProps) {
  if (tags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <TagBadge key={tag.slug} tag={tag} />
      ))}
    </div>
  );
}
