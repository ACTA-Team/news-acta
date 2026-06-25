/**
 * Display formatting helpers for Stellar embeds. Pure and client-safe.
 */

/** `GABCD…WXYZ` — middle-truncate a long id for compact display. */
export function truncateMiddle(value: string, lead = 4, tail = 4): string {
  if (value.length <= lead + tail + 1) return value;
  return `${value.slice(0, lead)}…${value.slice(-tail)}`;
}

/** Format a decimal amount string (e.g. an XLM balance) with thousands separators. */
export function formatDecimal(value: string): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return n.toLocaleString('en-US', { maximumFractionDigits: 7 });
}

/** Convert a stroops integer (e.g. `fee_charged`) to a formatted XLM amount. */
export function stroopsToXlm(stroops: string): string {
  const n = Number(stroops);
  if (!Number.isFinite(n)) return stroops;
  return (n / 1e7).toLocaleString('en-US', { maximumFractionDigits: 7 });
}

/** Compact integer with thousands separators. */
export function formatCount(value: number): string {
  return value.toLocaleString('en-US');
}

/** Human date + time for a ledger timestamp. */
export function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
