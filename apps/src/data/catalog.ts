/**
 * Catalog reads — categories & banks. Replaces the old `GET /categories` and
 * `GET /banks`. There's no `current_balance` column to keep in sync on every
 * transaction write (contrast the old `TransactionsService`'s rebalancing
 * dance): a bank's balance is computed here, at read time, as
 * `initial + Σincome − Σexpense`, so it's always correct and there's nothing
 * to invalidate but the transaction that changed it.
 */
import { getDb } from './db';
import type { BankRecord, CategoryRecord } from './records';

/** All categories, in seed order (both expense and income). */
export async function listCategories(): Promise<CategoryRecord[]> {
  const db = await getDb();
  return db.getAllAsync<CategoryRecord>('SELECT id, name, type, icon, color FROM categories ORDER BY rowid');
}

interface BankRow {
  id: string;
  name: string;
  short: string | null;
  color: string | null;
  initial_balance_cents: number;
  balance_cents: number;
}

/** All banks, in seed order, each with its balance computed from transactions. */
export async function listBanks(): Promise<BankRecord[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<BankRow>(`
    SELECT
      b.id, b.name, b.short, b.color, b.initial_balance_cents,
      b.initial_balance_cents
        + COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount_cents ELSE 0 END), 0)
        - COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount_cents ELSE 0 END), 0)
        AS balance_cents
    FROM banks b
    LEFT JOIN transactions t ON t.bank_id = b.id
    GROUP BY b.id
    ORDER BY b.rowid
  `);
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    short: r.short,
    color: r.color,
    initialBalanceCents: r.initial_balance_cents,
    balanceCents: r.balance_cents,
  }));
}
