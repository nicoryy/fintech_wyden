/**
 * Transaction reads/writes — replaces the old API's `TransactionsController` +
 * `TransactionsService`. There's no `current_balance` column to keep in sync
 * (see `catalog.ts`: balances are computed at read time), so `createTransaction`
 * is one validated INSERT plus the impulse-detection read, not the old
 * read-bank → rebalance → save dance.
 */
import * as Crypto from 'expo-crypto';

import { getDb } from './db';
import { DataError } from './errors';
import { detectImpulse, sevenDaysBefore } from './impulse';
import type { TransactionRecord } from './records';
import { TransactionTypeEnum } from '../services/types';

interface TransactionRow {
  id: string;
  bank_id: string;
  category_id: string;
  category_name: string;
  amount_cents: number;
  type: TransactionTypeEnum;
  description: string | null;
  occurred_at: number;
  is_impulse: number;
}

function toRecord(row: TransactionRow): TransactionRecord {
  return {
    id: row.id,
    bankId: row.bank_id,
    categoryId: row.category_id,
    categoryName: row.category_name,
    amountCents: row.amount_cents,
    type: row.type,
    description: row.description,
    occurredAt: row.occurred_at,
    isImpulse: row.is_impulse === 1,
  };
}

const SELECT = `
  SELECT t.id, t.bank_id, t.category_id, c.name AS category_name, t.amount_cents,
         t.type, t.description, t.occurred_at, t.is_impulse
  FROM transactions t
  JOIN categories c ON c.id = t.category_id
`;

export interface DateRange {
  /** inclusive, epoch ms */
  from: number;
  /** exclusive, epoch ms */
  to: number;
}

/** Transactions in `[from, to)`, newest first. */
export async function listTransactions(range: DateRange): Promise<TransactionRecord[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<TransactionRow>(
    `${SELECT} WHERE t.occurred_at >= ? AND t.occurred_at < ? ORDER BY t.occurred_at DESC`,
    [range.from, range.to],
  );
  return rows.map(toRecord);
}

/** The `limit` most recent transactions overall, newest first. */
export async function listRecentTransactions(limit: number): Promise<TransactionRecord[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<TransactionRow>(`${SELECT} ORDER BY t.occurred_at DESC LIMIT ?`, [limit]);
  return rows.map(toRecord);
}

export interface CreateTransactionInput {
  bankId: string;
  categoryId: string;
  amountCents: number;
  type: TransactionTypeEnum;
  description?: string;
  /** epoch ms; defaults to now */
  occurredAt?: number;
}

/**
 * Validates the bank/category exist and the amount is positive, computes
 * `isImpulse` against the 7 days before `occurredAt`, and inserts. Throws
 * `DataError` for anything the UI should show a message for.
 */
export async function createTransaction(input: CreateTransactionInput): Promise<TransactionRecord> {
  if (input.amountCents <= 0) throw new DataError('Informe um valor maior que zero.');

  const db = await getDb();
  const bank = await db.getFirstAsync<{ id: string }>('SELECT id FROM banks WHERE id = ?', [input.bankId]);
  if (!bank) throw new DataError('Conta não encontrada.');
  const category = await db.getFirstAsync<{ id: string; name: string }>(
    'SELECT id, name FROM categories WHERE id = ?',
    [input.categoryId],
  );
  if (!category) throw new DataError('Categoria não encontrada.');

  const occurredAt = input.occurredAt ?? Date.now();
  const description = input.description?.trim() || null;

  let isImpulse = false;
  if (input.type === TransactionTypeEnum.EXPENSE) {
    const recent = await db.getAllAsync<{ amount_cents: number }>(
      `SELECT amount_cents FROM transactions
       WHERE type = 'expense' AND occurred_at >= ? AND occurred_at < ?`,
      [sevenDaysBefore(occurredAt), occurredAt],
    );
    isImpulse = detectImpulse(
      { type: input.type, amountCents: input.amountCents, occurredAt },
      recent.map((r) => r.amount_cents),
    );
  }

  const id = Crypto.randomUUID();
  const now = Date.now();
  await db.runAsync(
    `INSERT INTO transactions
       (id, bank_id, category_id, amount_cents, type, description, occurred_at, is_impulse, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.bankId,
      input.categoryId,
      input.amountCents,
      input.type,
      description,
      occurredAt,
      isImpulse ? 1 : 0,
      now,
    ],
  );

  return {
    id,
    bankId: input.bankId,
    categoryId: input.categoryId,
    categoryName: category.name,
    amountCents: input.amountCents,
    type: input.type,
    description,
    occurredAt,
    isImpulse,
  };
}
