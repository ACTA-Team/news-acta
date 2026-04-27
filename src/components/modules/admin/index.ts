import { buildMetadata } from '@/lib/seo';

export { AdminShell } from './ui/AdminShell';
export { AdminLoginPageContent } from './pages/AdminLoginPage';
export { AdminDashboardPageContent } from './pages/AdminDashboardPage';
export { AdminNewsPageContent } from './pages/AdminNewsPage';
export { AdminNewsEditorPageContent } from './pages/AdminNewsEditorPage';

export const adminLoginMetadata = buildMetadata({
  title: 'Admin Login',
  description: 'Secure email-only access for authorized ACTA editors.',
  path: '/admin/login',
});
