import type { Metadata } from 'next';

import { LegalDocPage } from '@/components/blocks';
import { LEGAL_LAST_UPDATED_ISO, legalRoutes, termsDocument } from '@/config/legal';
import { getTranslations } from '@/i18n/dictionaries';
import { formatLongDate } from '@/i18n/format';
import { resolveLocale, type LocaleParams } from '@/i18n/params';
import { buildMetadata } from '@/lib/seo';

interface TermsPageProps {
  params: LocaleParams;
}

export async function generateTermsMetadata({ params }: TermsPageProps): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const { t } = await getTranslations(locale);

  return buildMetadata({
    title: t('legal.termsTitle'),
    description: t('legal.termsDescription'),
    path: legalRoutes.terms,
    locale,
  });
}

export async function TermsPageContent({ params }: TermsPageProps) {
  const locale = await resolveLocale(params);
  const { t } = await getTranslations(locale);

  return (
    <LegalDocPage
      document={termsDocument(locale)}
      eyebrow={t('common.eyebrow')}
      lastUpdatedLabel={t('legal.lastUpdated', {
        date: formatLongDate(LEGAL_LAST_UPDATED_ISO, locale),
      })}
    />
  );
}
