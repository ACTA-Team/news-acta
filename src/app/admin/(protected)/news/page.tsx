import { AdminNewsPageContent } from '@/components/modules/admin/pages/AdminNewsPage';

interface AdminNewsPageProps {
  searchParams: Promise<{ status?: 'all' | 'draft' | 'published' | 'archived' }>;
}

export default async function AdminNewsPage({ searchParams }: AdminNewsPageProps) {
  const { status } = await searchParams;
  return <AdminNewsPageContent status={status} />;
}
