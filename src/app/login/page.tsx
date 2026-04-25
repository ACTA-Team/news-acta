import { AuthPage } from '@/components/blocks/auth-page';
import { buildMetadata } from '@/lib/seo';
import { siteConfig } from '@/config/site';

export const metadata = buildMetadata({
  title: 'Sign in',
  description: `Sign in to ${siteConfig.name} (preview UI).`,
  path: '/login',
});

/**
 * UI-only sign-in (Efferd auth-5). Renders without the public site header/footer; see `app/(site)/layout.tsx`.
 */
export default function LoginPage() {
  return <AuthPage />;
}
