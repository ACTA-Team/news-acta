import type { Metadata } from 'next';
import { NewsHistoryPageContent, generateNewsHistoryMetadata } from '@/components/modules/news';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return generateNewsHistoryMetadata({ params });
}

export default function NewsHistoryPage({ params }: Props) {
  return <NewsHistoryPageContent params={params} />;
}
