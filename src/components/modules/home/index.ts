import { siteConfig } from '@/config/site';
import { buildMetadata } from '@/lib/seo';

export { HomePageContent } from './pages/HomePage';

export const homePageMetadata = buildMetadata({
  title: 'Home',
  description: siteConfig.description,
  path: '/',
});
