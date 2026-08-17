import type { Metadata } from 'next';
import { NewsHistoryPageContent, generateNewsHistoryMetadata } from '@/components/modules/news';
import type { LocaleParams } from '@/i18n';

interface Props {
  params: LocaleParams<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return generateNewsHistoryMetadata({ params });
}

export default function NewsHistoryPage({ params }: Props) {
  return <NewsHistoryPageContent params={params} />;
}
