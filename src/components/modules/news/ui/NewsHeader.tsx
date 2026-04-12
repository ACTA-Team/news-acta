/**
 * Presentational header for the News module.
 * Server Component — no state and no handlers here.
 */
export function NewsHeader() {
  return (
    <header className="flex flex-col gap-3 border-b border-zinc-200 pb-8 dark:border-zinc-800">
      <p className="text-sm font-medium uppercase tracking-widest text-zinc-500">
        ACTA News
      </p>
      <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
        What&apos;s happening in the ACTA ecosystem
      </h1>
      <p className="max-w-2xl text-base text-zinc-600 dark:text-zinc-400">
        Announcements, product updates, engineering deep-dives and community
        highlights from the teams building ACTA.
      </p>
    </header>
  );
}
