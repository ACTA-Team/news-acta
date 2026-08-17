import {
  AdminNewsPageContent,
  type AdminNewsFilterStatus,
} from '@/components/modules/admin/pages/AdminNewsPage';

interface AdminNewsPageProps {
  searchParams: Promise<{ status?: AdminNewsFilterStatus }>;
}

export default async function AdminNewsPage({ searchParams }: AdminNewsPageProps) {
  const { status } = await searchParams;
  return <AdminNewsPageContent status={status} />;
}
