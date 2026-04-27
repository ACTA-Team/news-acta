import { requireAdmin } from '@/components/modules/admin/services/auth.service';
import { AdminShell } from '@/components/modules/admin/ui/AdminShell';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <AdminShell email={admin.email} title="Editorial panel" subtitle="Manage news and publications">
      {children}
    </AdminShell>
  );
}
