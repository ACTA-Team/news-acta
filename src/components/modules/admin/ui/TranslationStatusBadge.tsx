import type { TranslationStatus } from '@/@types/i18n';
import { LOCALE_SHORT_NAMES, type Locale } from '@/i18n/config';

/**
 * Per-locale translation freshness.
 *
 * Three states, and the middle one is the reason this exists: a stale
 * translation still renders on the public site, so nothing on the page tells an
 * editor it has drifted from the source. This does.
 */

const STATUS_STYLES: Record<TranslationStatus, string> = {
  missing: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
  stale: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  current: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
};

const STATUS_LABELS: Record<TranslationStatus, string> = {
  missing: 'missing',
  stale: 'stale',
  current: 'current',
};

interface TranslationStatusBadgeProps {
  locale: Locale;
  status: TranslationStatus;
  className?: string;
}

export function TranslationStatusBadge({ locale, status, className }: TranslationStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]} ${className ?? ''}`}
      title={`${locale}: ${STATUS_LABELS[status]}`}
    >
      <span className="font-semibold">{LOCALE_SHORT_NAMES[locale]}</span>
      <span className="opacity-80">{STATUS_LABELS[status]}</span>
    </span>
  );
}
