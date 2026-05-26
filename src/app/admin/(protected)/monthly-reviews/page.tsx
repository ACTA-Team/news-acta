import { AdminMonthlyReviewsPageContent } from '@/components/modules/admin';
import { AdminShell } from '@/components/modules/admin/ui/AdminShell';
import { requireAdmin } from '@/components/modules/admin/services/auth.service';

export const metadata = {
  title: 'Manage Monthly Reviews · Admin',
  description: 'Manage ACTA Monthly Reviews and ecosystem live metrics.',
};

export default async function AdminMonthlyReviewsPage() {
  const admin = await requireAdmin();

  return (
    <AdminShell email={admin.email} title="Monthly Reviews" subtitle="Manage and publish monthly ACTA reviews.">
      <AdminMonthlyReviewsPageContent />
    </AdminShell>
  );
}
