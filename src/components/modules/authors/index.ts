import { buildMetadata } from '@/lib/seo';

export { AuthorCard } from './ui/AuthorCard';
export { AuthorProfile } from './ui/AuthorProfile';
export { fetchAuthors, fetchAuthorBySlug } from './services/authors.service';
export { AuthorsPageContent } from './pages/AuthorsPage';
export { AuthorDetailPageContent, generateAuthorDetailMetadata } from './pages/AuthorDetailPage';

export const authorsPageMetadata = buildMetadata({
  title: 'Contributors',
  description: 'Writers, editors, and guest voices on the official ACTA blog.',
  path: '/authors',
});
