import type { Metadata } from 'next';
import { AdminLoginPageContent } from '@/components/modules/admin/pages/AdminLoginPage';
import { buildAdminMetadata } from '@/lib/seo';

export const metadata: Metadata = buildAdminMetadata({
  title: 'Admin Login',
  description: 'Secure email-only access for authorized ACTA editors.',
});

export default function AdminLoginPage() {
  return <AdminLoginPageContent />;
}
