import Link from 'next/link';
import { Container } from '@/layouts';

export default function NotFound() {
  return (
    <Container className="flex min-h-[60vh] flex-col items-start justify-center gap-6 py-24">
      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">404</p>
      <div className="border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Page not found
        </h1>
        <p className="mt-3 text-zinc-500 dark:text-zinc-400">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
      </div>
      <div className="flex gap-3">
        <Link
          href="/"
          className="inline-flex h-9 items-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Go home
        </Link>
        <Link
          href="/news"
          className="inline-flex h-9 items-center rounded-lg border border-zinc-200 px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Browse news
        </Link>
      </div>
    </Container>
  );
}
