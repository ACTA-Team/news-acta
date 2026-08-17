import { AdminTranslationsPageContent } from '@/components/modules/admin/pages/AdminTranslationsPage';

interface AdminTranslationsPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminTranslationsPage({ params }: AdminTranslationsPageProps) {
  const { id } = await params;
  return <AdminTranslationsPageContent articleId={id} />;
}
