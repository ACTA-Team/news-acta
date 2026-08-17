import type { LocalizedContent } from '@/@types/i18n';

/**
 * An author resolved for one locale. `name` is never translated; `role` and
 * `bio` come from `author_translations` when a row exists.
 */
export interface Author extends Partial<LocalizedContent> {
  id: string;
  slug: string;
  name: string;
  role?: string;
  bio?: string;
  avatarUrl?: string;
  social?: {
    x?: string;
    github?: string;
    linkedin?: string;
  };
}

export interface AuthorCardProps {
  author: Author;
  compact?: boolean;
}
