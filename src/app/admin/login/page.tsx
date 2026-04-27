import type { Metadata } from 'next';
import { AdminLoginPageContent } from '@/components/modules/admin/pages/AdminLoginPage';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Admin Login',
  description: 'Secure email-only access for authorized ACTA editors.',
  path: '/admin/login',
});

export default function AdminLoginPage() {
  return <AdminLoginPageContent />;
}
