/**
 * Report aggregations — ported from the old API's `ReportsService`, now
 * running in-memory over `TransactionRecord[]` already loaded from SQLite for
 * a given range, instead of a second server round-trip. All money in and out
 * is in **cents**; the transform layer (`services/transform.ts`) converts to
 * reais for the UI.
 */
import { TransactionTypeEnum } from '../services/types';
import type { TransactionRecord } from './records';

export interface SummaryTotals {
  receitasCents: number;
  despesasCents: number;
  saldoCents: number;
  economiaCents: number;
}

/** Same shape as the old `GET /reports/summary` (`economia === saldo`). */
export function summarize(txs: TransactionRecord[]): SummaryTotals {
  let receitasCents = 0;
  let despesasCents = 0;
  for (const t of txs) {
    if (t.type === TransactionTypeEnum.INCOME) receitasCents += t.amountCents;
    else despesasCents += t.amountCents;
  }
  const saldoCents = receitasCents - despesasCents;
  return { receitasCents, despesasCents, saldoCents, economiaCents: saldoCents };
}

export interface CategoryTotal {
  categoryId: string;
  totalCents: number;
  /** 0..100 against `type`'s own grand total, not rounded */
  pct: number;
}

/**
 * Totals per category for transactions of `type`, sorted descending — same
 * shape as the old `GET /reports/by-category`.
 */
export function totalsByCategory(txs: TransactionRecord[], type: TransactionTypeEnum): CategoryTotal[] {
  const filtered = txs.filter((t) => t.type === type);
  const grandTotal = filtered.reduce((s, t) => s + t.amountCents, 0);
  const byId = new Map<string, number>();
  for (const t of filtered) {
    byId.set(t.categoryId, (byId.get(t.categoryId) ?? 0) + t.amountCents);
  }
  return Array.from(byId.entries())
    .map(([categoryId, totalCents]) => ({
      categoryId,
      totalCents,
      pct: grandTotal > 0 ? (totalCents / grandTotal) * 100 : 0,
    }))
    .sort((a, b) => b.totalCents - a.totalCents);
}

export interface BankTotal {
  bankId: string;
  totalCents: number;
}

/** Expense-only totals per bank, sorted descending — old `GET /reports/by-bank`. */
export function totalsByBank(txs: TransactionRecord[]): BankTotal[] {
  const byId = new Map<string, number>();
  for (const t of txs) {
    if (t.type !== TransactionTypeEnum.EXPENSE) continue;
    byId.set(t.bankId, (byId.get(t.bankId) ?? 0) + t.amountCents);
  }
  return Array.from(byId.entries())
    .map(([bankId, totalCents]) => ({ bankId, totalCents }))
    .sort((a, b) => b.totalCents - a.totalCents);
}

export interface MonthTotal {
  /** 'YYYY-MM' */
  month: string;
  receitasCents: number;
  despesasCents: number;
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Zero-filled monthly totals for the `months` buckets ending in the month
 * containing `now`, oldest first — old `GET /reports/monthly-comparison`.
 * `txs` should already cover (at least) that whole window; anything outside
 * it is ignored.
 */
export function monthlyComparison(
  txs: TransactionRecord[],
  months: number,
  now: Date = new Date(),
): MonthTotal[] {
  const buckets = new Map<string, MonthTotal>();
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    const key = monthKey(d);
    buckets.set(key, { month: key, receitasCents: 0, despesasCents: 0 });
  }
  for (const t of txs) {
    const bucket = buckets.get(monthKey(new Date(t.occurredAt)));
    if (!bucket) continue;
    if (t.type === TransactionTypeEnum.INCOME) bucket.receitasCents += t.amountCents;
    else bucket.despesasCents += t.amountCents;
  }
  return Array.from(buckets.values());
}
