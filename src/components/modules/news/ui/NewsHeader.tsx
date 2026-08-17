import type { Translator } from '@/i18n/translate';

/**
 * Presentational header for the News module.
 * Server Component: no state and no handlers here.
 */
export function NewsHeader({ t }: { t: Translator }) {
  return (
    <header className="flex flex-col gap-3 border-b border-zinc-200 pb-8 dark:border-zinc-800">
      <p className="text-sm font-medium uppercase tracking-widest text-zinc-500">
        {t('news.header.eyebrow')}
      </p>
      <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
        {t('news.header.title')}
      </h1>
      <p className="max-w-2xl text-base text-zinc-600 dark:text-zinc-400">
        {t('news.header.description')}
      </p>
    </header>
  );
}
