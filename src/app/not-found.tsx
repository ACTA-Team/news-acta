import { buildMetadata } from '@/lib/seo';
import { NotFoundContent } from '@/components/blocks/not-found-content';

export const metadata = buildMetadata({
  title: 'Not found',
  description: 'The page you requested could not be found.',
  path: '/404',
});

export default function NotFound() {
  return <NotFoundContent />;
}
