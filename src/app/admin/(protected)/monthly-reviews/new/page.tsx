import { AdminMonthlyReviewEditorPageContent } from '@/components/modules/admin';
import { AdminShell } from '@/components/modules/admin/ui/AdminShell';
import { requireAdmin } from '@/components/modules/admin/services/auth.service';
import { fetchAdminReviewFormOptions } from '@/components/modules/admin/services/monthly-review.service';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Create Monthly Review · Admin',
  description: 'Draft a new monthly ACTA review with live metrics.',
};

export default async function AdminNewMonthlyReviewPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const options = await fetchAdminReviewFormOptions(supabase);

  return (
    <AdminShell
      email={admin.email}
      role={admin.role}
      title="Create Review"
      subtitle="Create a new monthly ecosystem review."
    >
      <AdminMonthlyReviewEditorPageContent review={null} options={options} />
    </AdminShell>
  );
}
