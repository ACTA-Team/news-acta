import { buildMetadata } from '@/lib/seo';

export { PrivacyPolicyPageContent } from './pages/PrivacyPage';
export { TermsPageContent } from './pages/TermsPage';

export const termsPageMetadata = buildMetadata({
  title: 'Terms of Service',
  description:
    'Terms governing your use of ACTA News, our editorial and publication services, and related features.',
  path: '/terms',
});

export const privacyPageMetadata = buildMetadata({
  title: 'Privacy Policy',
  description:
    'How ACTA News collects, uses, and protects personal information when you use our website and services.',
  path: '/privacy',
});
