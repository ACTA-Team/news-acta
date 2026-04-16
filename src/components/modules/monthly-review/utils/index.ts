/**
 * Pure utilities for the `monthly-review` module.
 */

/** "2026-03" -> "March 2026" */
export function formatPeriodLabel(period: string, locale: string = 'en-US'): string {
  const [yearStr, monthStr] = period.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (!year || !month) return period;
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
}

/** Sorts YYYY-MM periods chronologically, newest first. */
export function sortPeriodsDesc(periods: string[]): string[] {
  return [...periods].sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
}
