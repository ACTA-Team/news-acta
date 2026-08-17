import { AdminCalendarPageContent } from '@/components/modules/admin/pages/AdminCalendarPage';

interface AdminCalendarPageProps {
  searchParams: Promise<{ month?: string }>;
}

export default async function AdminCalendarPage({ searchParams }: AdminCalendarPageProps) {
  const { month } = await searchParams;
  return <AdminCalendarPageContent month={month} />;
}
