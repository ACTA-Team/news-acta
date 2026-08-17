import { notFound } from 'next/navigation';
import { AdminMonthlyReviewEditorPageContent } from '@/components/modules/admin';
import { AdminShell } from '@/components/modules/admin/ui/AdminShell';
import { requireAdmin } from '@/components/modules/admin/services/auth.service';
import {
  fetchAdminReviewById,
  fetchAdminReviewFormOptions,
} from '@/components/modules/admin/services/monthly-review.service';
import { createClient } from '@/lib/supabase/server';

interface AdminEditMonthlyReviewPageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: 'Edit Monthly Review · Admin',
  description: 'Modify monthly ecosystem review details and metrics.',
};

export default async function AdminEditMonthlyReviewPage({
  params,
}: AdminEditMonthlyReviewPageProps) {
  const { id } = await params;
  const admin = await requireAdmin();
  const supabase = await createClient();

  const [review, options] = await Promise.all([
    fetchAdminReviewById(supabase, id),
    fetchAdminReviewFormOptions(supabase),
  ]);

  if (!review) {
    notFound();
  }

  return (
    <AdminShell
      email={admin.email}
      role={admin.role}
      title="Edit Review"
      subtitle={`Editing monthly review for ${review.period}`}
    >
      <AdminMonthlyReviewEditorPageContent review={review} options={options} />
    </AdminShell>
  );
}
