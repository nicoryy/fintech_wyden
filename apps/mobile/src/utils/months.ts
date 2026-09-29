/**
 * Month/date-range helpers, in device local time. Moved here from
 * `services/hooks.ts` (which used them to build API query params) now that
 * the same math also drives the SQLite range queries in `src/data`.
 */

/** Current month as 'YYYY-MM'. */
export function currentMonth(now: Date = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/** Previous month as 'YYYY-MM'. */
export function previousMonth(now: Date = new Date()): string {
  return currentMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1));
}

/** The `n` months ending in the current one, oldest first, as 'YYYY-MM'. */
export function lastNMonths(n: number, now: Date = new Date()): string[] {
  return Array.from({ length: n }, (_, i) => currentMonth(new Date(now.getFullYear(), now.getMonth() - (n - 1 - i), 1)));
}

export interface EpochRange {
  /** inclusive, epoch ms */
  from: number;
  /** exclusive, epoch ms */
  to: number;
}

/** `[start, end)` epoch-ms bounds for a single 'YYYY-MM' month. */
export function monthBounds(month: string): EpochRange {
  const [y, m] = month.split('-').map(Number);
  return { from: new Date(y, m - 1, 1).getTime(), to: new Date(y, m, 1).getTime() };
}

/** `[start, end)` epoch-ms bounds for the `n` months ending in `month`. */
export function lastNMonthsBounds(month: string, n: number): EpochRange {
  const [y, m] = month.split('-').map(Number);
  return { from: new Date(y, m - n, 1).getTime(), to: new Date(y, m, 1).getTime() };
}
