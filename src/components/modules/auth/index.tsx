import type { Metadata } from 'next';

import { AuthPage } from '@/components/blocks';
import { siteConfig } from '@/config/site';
import { getTranslations } from '@/i18n/dictionaries';
import { resolveLocale, type LocaleParams } from '@/i18n/params';
import { buildMetadata } from '@/lib/seo';

interface LoginPageProps {
  params: LocaleParams;
}

export function LoginPageContent() {
  return <AuthPage />;
}

export async function generateLoginMetadata({ params }: LoginPageProps): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const { t } = await getTranslations(locale);

  return buildMetadata({
    title: t('login.metaTitle'),
    description: t('login.metaDescription', { siteName: siteConfig.name }),
    path: '/login',
    locale,
    // A preview sign-in screen has no business in an index.
    noIndex: true,
  });
}
