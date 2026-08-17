import type { Metadata } from 'next';

import { LegalDocPage } from '@/components/blocks';
import { LEGAL_LAST_UPDATED_ISO, legalRoutes, privacyDocument } from '@/config/legal';
import { getTranslations } from '@/i18n/dictionaries';
import { formatLongDate } from '@/i18n/format';
import { resolveLocale, type LocaleParams } from '@/i18n/params';
import { buildMetadata } from '@/lib/seo';

interface PrivacyPageProps {
  params: LocaleParams;
}

export async function generatePrivacyMetadata({ params }: PrivacyPageProps): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const { t } = await getTranslations(locale);

  return buildMetadata({
    title: t('legal.privacyTitle'),
    description: t('legal.privacyDescription'),
    path: legalRoutes.privacy,
    locale,
  });
}

export async function PrivacyPolicyPageContent({ params }: PrivacyPageProps) {
  const locale = await resolveLocale(params);
  const { t } = await getTranslations(locale);

  return (
    <LegalDocPage
      document={privacyDocument(locale)}
      eyebrow={t('common.eyebrow')}
      lastUpdatedLabel={t('legal.lastUpdated', {
        date: formatLongDate(LEGAL_LAST_UPDATED_ISO, locale),
      })}
    />
  );
}
