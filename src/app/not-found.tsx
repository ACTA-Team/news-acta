import { buildMetadata } from '@/lib/seo';
import { NotFoundContent } from '@/components/blocks';
import { SiteFooter, SiteHeader } from '@/layouts';

export const metadata = buildMetadata({
  title: 'Not found',
  description: 'The page you requested could not be found.',
  path: '/404',
});

export default function NotFound() {
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
