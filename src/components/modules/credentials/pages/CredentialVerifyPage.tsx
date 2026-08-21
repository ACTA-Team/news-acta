import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getTranslations } from '@/i18n/dictionaries';
import { resolveLocaleParams, type LocaleParams } from '@/i18n/params';
import { buildMetadata } from '@/lib/seo';
import { Container } from '@/layouts';

import { CREDENTIAL_ROUTES } from '../constants';
import { fetchCredentialVerification } from '../services/verify.service';
import { CredentialVerifyCard } from '../ui/CredentialVerifyCard';

interface CredentialVerifyPageProps {
  params: LocaleParams<{ vcId: string }>;
}

export async function credentialVerifyMetadata({
  params,
}: CredentialVerifyPageProps): Promise<Metadata> {
  const { locale, vcId } = await resolveLocaleParams(params);
  const { t } = await getTranslations(locale);

  return buildMetadata({
    title: t('credential.verify.metaTitle'),
    description: t('credential.verify.metaDescription'),
    path: CREDENTIAL_ROUTES.verify(vcId),
    locale,
    noIndex: true,
  });
}

export async function CredentialVerifyPageContent({ params }: CredentialVerifyPageProps) {
  const { locale, vcId } = await resolveLocaleParams(params);
  const { t } = await getTranslations(locale);
  const verification = await fetchCredentialVerification(vcId);

  // `invalid` covers both "no such vc_id" and "vault says not found": either
  // way there is nothing to show. A verification service outage (`null`)
  // also lands here rather than exposing an ambiguous "maybe valid" page.
  if (!verification || verification.status === 'invalid') notFound();

  return (
    <Container className="py-16">
      <div className="mx-auto flex max-w-xl flex-col gap-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            {t('credential.verify.title')}
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {t('credential.verify.description')}
          </p>
        </div>
        <CredentialVerifyCard vcId={vcId} verification={verification} t={t} />
      </div>
    </Container>
  );
}
