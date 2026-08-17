import { NotFoundContent } from '@/components/blocks';

/**
 * 404 boundary for the public site.
 *
 * Lives inside the `(site)` group so the header, the footer and the language
 * switcher are all still there. The translations provider comes from the
 * `[locale]` root layout above, which is why the copy is in the reader's
 * language rather than always English.
 *
 * Metadata is deliberately absent: Next does not call `generateMetadata` on a
 * `not-found` boundary, so the title comes from the `[locale]` layout's default.
 */
export default function LocaleNotFound() {
  return <NotFoundContent />;
}
