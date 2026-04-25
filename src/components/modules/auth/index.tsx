import { AuthPage } from '@/components/blocks';
import { siteConfig } from '@/config/site';
import { buildMetadata } from '@/lib/seo';

export function LoginPageContent() {
  return <AuthPage />;
}

export const loginPageMetadata = buildMetadata({
  title: 'Sign in',
  description: `Sign in to ${siteConfig.name} (preview UI).`,
  path: '/login',
});
