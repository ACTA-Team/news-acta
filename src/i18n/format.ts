/**
 * Locale-aware date and number formatting.
 *
 * Every `toLocaleDateString` / `toLocaleString` / `toLocaleString()` call in the
 * app funnels through here, so a locale is always an explicit argument and never
 * the server's ambient default. `Intl.*Format` instances are cached because
 * constructing one is the expensive part.
 */

import { LOCALE_TAGS, type Locale } from './config';

const dateFormatters = new Map<string, Intl.DateTimeFormat>();
const numberFormatters = new Map<string, Intl.NumberFormat>();

function dateFormatter(locale: Locale, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${locale}:${JSON.stringify(options)}`;
  let formatter = dateFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(LOCALE_TAGS[locale], options);
    dateFormatters.set(key, formatter);
  }
  return formatter;
}

function numberFormatter(locale: Locale, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = `${locale}:${JSON.stringify(options)}`;
  let formatter = numberFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(LOCALE_TAGS[locale], options);
    numberFormatters.set(key, formatter);
  }
  return formatter;
}

/** Parses an ISO string, returning null when it is not a usable date. */
function parseDate(value: string | number | Date): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** "Apr 24, 2026" / "24 abr 2026". Falls back to the raw input on a bad date. */
export function formatDate(value: string, locale: Locale): string {
  const date = parseDate(value);
  if (!date) return value;
  return dateFormatter(locale, { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
}

/** "April 24, 2026" / "24 de abril de 2026". */
export function formatLongDate(value: string, locale: Locale): string {
  const date = parseDate(value);
  if (!date) return value;
  return dateFormatter(locale, { year: 'numeric', month: 'long', day: 'numeric' }).format(date);
}

/** Date plus time, used in the admin tables and the scheduling UI. */
export function formatDateTime(value: string, locale: Locale): string {
  const date = parseDate(value);
  if (!date) return value;
  return dateFormatter(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/** "March 2026" / "marzo de 2026", from a `Date` built for the first of the month. */
export function formatMonthYear(date: Date, locale: Locale): string {
  return dateFormatter(locale, { month: 'long', year: 'numeric' }).format(date);
}

/** Thousands separators per locale: 1,234,567 vs 1.234.567. */
export function formatNumber(value: number, locale: Locale): string {
  if (!Number.isFinite(value)) return String(value);
  return numberFormatter(locale, {}).format(value);
}

/** A signed percentage with one decimal, used by the metric delta badges. */
export function formatSignedPercent(value: number, locale: Locale): string {
  if (!Number.isFinite(value)) return String(value);
  return numberFormatter(locale, {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    signDisplay: 'exceptZero',
  }).format(value / 100);
}

/** An unsigned percentage with one decimal. */
export function formatPercent(value: number, locale: Locale): string {
  if (!Number.isFinite(value)) return String(value);
  return numberFormatter(locale, {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
}
