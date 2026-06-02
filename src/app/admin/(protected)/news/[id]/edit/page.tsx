import { AdminNewsEditorPageContent } from '@/components/modules/admin/pages/AdminNewsEditorPage';

interface AdminNewsEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminNewsEditPage({ params }: AdminNewsEditPageProps) {
  const { id } = await params;
  return <AdminNewsEditorPageContent articleId={id} />;
}
