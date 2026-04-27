import Link from 'next/link';
import { adminLogoutAction } from '@/components/modules/admin/actions';
import { Button } from '@/components/ui/button';
import { Container } from '@/layouts';

interface AdminShellProps {
  email: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

const links = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/news', label: 'News' },
  { href: '/admin/news/new', label: 'New article' },
] as const;

export function AdminShell({ email, title, subtitle, children }: AdminShellProps) {
  return (
    <main className="min-h-dvh bg-background pb-16">
      <Container className="grid gap-6 pt-8 md:grid-cols-[220px_1fr]">
        <aside className="rounded-2xl border bg-card p-4">
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Admin panel
          </p>
          <nav className="space-y-1">
            {links.map((link) => (
              <Button key={link.href} asChild variant="ghost" className="w-full justify-start">
                <Link href={link.href}>{link.label}</Link>
              </Button>
            ))}
          </nav>
          <div className="mt-6 border-t pt-4">
            <p className="truncate text-xs text-muted-foreground">{email}</p>
            <form action={adminLogoutAction} className="mt-2">
              <Button type="submit" variant="outline" className="w-full">
                Log out
              </Button>
            </form>
          </div>
        </aside>

        <section className="space-y-6">
          <header className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
            {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
          </header>
          {children}
        </section>
      </Container>
    </main>
  );
}
