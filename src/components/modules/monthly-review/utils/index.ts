import { DEFAULT_LOCALE, type Locale } from '@/i18n/config';
import { formatMonthYear } from '@/i18n/format';

/**
 * Pure utilities for the `monthly-review` module.
 *
 * `formatPeriodLabel` takes a `Locale`, not a BCP 47 string: the mapping from
 * one to the other lives in `src/i18n/config.ts` and nothing else should have to
 * know that 'es' means 'es-CR'.
 */

/** "2026-03" -> "March 2026" / "marzo de 2026" */
export function formatPeriodLabel(period: string, locale: Locale = DEFAULT_LOCALE): string {
  const [yearStr, monthStr] = period.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (!year || !month) return period;
  return formatMonthYear(new Date(year, month - 1, 1), locale);
}

/** Sorts YYYY-MM periods chronologically, newest first. */
export function sortPeriodsDesc(periods: string[]): string[] {
  return [...periods].sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
}

/** Given a YYYY-MM period, returns the previous period, e.g. "2026-05" -> "2026-04" */
export function getPreviousPeriod(period: string): string {
  const [yearStr, monthStr] = period.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10);

  if (isNaN(year) || isNaN(month)) return period;

  month -= 1;
  if (month === 0) {
    month = 12;
    year -= 1;
  }

  return `${year}-${String(month).padStart(2, '0')}`;
}
