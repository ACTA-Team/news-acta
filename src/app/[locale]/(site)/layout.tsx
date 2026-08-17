import { SiteFooter, SiteHeader } from '@/layouts';

/**
 * Public marketing / blog shell: global nav and footer. Auth routes (e.g. /login) live outside this group.
 */
export default function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
