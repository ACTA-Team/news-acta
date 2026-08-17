import { NotFoundContent } from '@/components/blocks';
import { SiteFooter, SiteHeader } from '@/layouts';

/**
 * 404 for routes under `[locale]` that sit outside the `(site)` group, such as
 * `/en/login`. It renders the chrome itself because the `(site)` layout is not
 * in its tree.
 */
export default function LocaleNotFound() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <NotFoundContent />
      </main>
      <SiteFooter />
    </>
  );
}
