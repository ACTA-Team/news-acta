import type { LocalizedContent } from '@/@types/i18n';

/**
 * A tag resolved for one locale. `label` and `description` come from
 * `tag_translations` when a row exists for the requested locale, and from the
 * `tags` row otherwise.
 */
export interface Tag extends Partial<LocalizedContent> {
  slug: string;
  label: string;
  description?: string;
  postCount?: number;
}
