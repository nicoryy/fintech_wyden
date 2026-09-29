/**
 * Backup — export/import the whole local database as one JSON file. There's
 * no server to back anything up to anymore (see the root CLAUDE.md), so this
 * *is* the backup story: the user shares the file themselves (AirDrop, cloud
 * drive, email, …) and imports it back on a new device.
 *
 * `restoreBackup` and `resetAll` replace *everything*, atomically — a bad
 * file, or a crash mid-restore, rolls back instead of leaving a half-written
 * database.
 */
import { z } from 'zod';

import { getDb, type SqlExecutor } from './db';
import { DataError } from './errors';
import { seedDefaults } from './seeds';
import { CategoryTypeEnum, GoalStatusEnum, TransactionTypeEnum } from '../services/types';

const BACKUP_FORMAT = 1;

const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.nativeEnum(CategoryTypeEnum),
  icon: z.string().nullable(),
  color: z.string().nullable(),
});

const bankSchema = z.object({
  id: z.string(),
  name: z.string(),
  short: z.string().nullable(),
  color: z.string().nullable(),
  initialBalanceCents: z.number().int(),
});

const transactionSchema = z.object({
  id: z.string(),
  bankId: z.string(),
  categoryId: z.string(),
  amountCents: z.number().int().positive(),
  type: z.nativeEnum(TransactionTypeEnum),
  description: z.string().nullable(),
  occurredAt: z.number().int(),
  isImpulse: z.boolean(),
});

const goalSchema = z.object({
  id: z.string(),
  title: z.string(),
  targetCents: z.number().int(),
  currentCents: z.number().int(),
  deadline: z.number().int().nullable(),
  status: z.nativeEnum(GoalStatusEnum),
});

const backupSchema = z.object({
  app: z.literal('wyden'),
  format: z.literal(BACKUP_FORMAT),
  exportedAt: z.number().int(),
  profile: z.object({ name: z.string().nullable() }),
  categories: z.array(categorySchema),
  banks: z.array(bankSchema),
  transactions: z.array(transactionSchema),
  goals: z.array(goalSchema),
});

export type Backup = z.infer<typeof backupSchema>;

/** Builds a full snapshot of the local database. */
export async function buildBackup(): Promise<Backup> {
  const db = await getDb();
  const [categories, bankRows, txRows, goalRows, profileRow] = await Promise.all([
    db.getAllAsync<{
      id: string;
      name: string;
      type: CategoryTypeEnum;
      icon: string | null;
      color: string | null;
    }>('SELECT id, name, type, icon, color FROM categories ORDER BY rowid'),
    db.getAllAsync<{
      id: string;
      name: string;
      short: string | null;
      color: string | null;
      initial_balance_cents: number;
    }>('SELECT id, name, short, color, initial_balance_cents FROM banks ORDER BY rowid'),
    db.getAllAsync<{
      id: string;
      bank_id: string;
      category_id: string;
      amount_cents: number;
      type: TransactionTypeEnum;
      description: string | null;
      occurred_at: number;
      is_impulse: number;
    }>('SELECT id, bank_id, category_id, amount_cents, type, description, occurred_at, is_impulse FROM transactions'),
    db.getAllAsync<{
      id: string;
      title: string;
      target_cents: number;
      current_cents: number;
      deadline: number | null;
      status: GoalStatusEnum;
    }>('SELECT id, title, target_cents, current_cents, deadline, status FROM goals'),
    db.getFirstAsync<{ value: string }>("SELECT value FROM settings WHERE key = 'profile.name'"),
  ]);

  return {
    app: 'wyden',
    format: BACKUP_FORMAT,
    exportedAt: Date.now(),
    profile: { name: profileRow?.value ?? null },
    categories,
    banks: bankRows.map((b) => ({
      id: b.id,
      name: b.name,
      short: b.short,
      color: b.color,
      initialBalanceCents: b.initial_balance_cents,
    })),
    transactions: txRows.map((t) => ({
      id: t.id,
      bankId: t.bank_id,
      categoryId: t.category_id,
      amountCents: t.amount_cents,
      type: t.type,
      description: t.description,
      occurredAt: t.occurred_at,
      isImpulse: t.is_impulse === 1,
    })),
    goals: goalRows.map((g) => ({
      id: g.id,
      title: g.title,
      targetCents: g.target_cents,
      currentCents: g.current_cents,
      deadline: g.deadline,
      status: g.status,
    })),
  };
}

/** Parses and validates a backup file's text content. */
export function parseBackup(json: string): Backup {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    throw new DataError('Arquivo não é um backup válido do Wyden.');
  }
  const result = backupSchema.safeParse(data);
  if (!result.success) throw new DataError('Arquivo não é um backup válido do Wyden.');
  return result.data;
}

/** Deletes every row from every table, in FK-safe order. */
async function clearAll(db: SqlExecutor): Promise<void> {
  await db.execAsync(
    'DELETE FROM transactions; DELETE FROM goals; DELETE FROM banks; DELETE FROM categories; DELETE FROM settings;',
  );
}

async function insertBackup(db: SqlExecutor, backup: Backup): Promise<void> {
  const now = Date.now();
  for (const c of backup.categories) {
    await db.runAsync(
      'INSERT INTO categories (id, name, type, icon, color, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [c.id, c.name, c.type, c.icon, c.color, now],
    );
  }
  for (const b of backup.banks) {
    await db.runAsync(
      'INSERT INTO banks (id, name, short, color, initial_balance_cents, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [b.id, b.name, b.short, b.color, b.initialBalanceCents, now],
    );
  }
  for (const t of backup.transactions) {
    await db.runAsync(
      `INSERT INTO transactions
         (id, bank_id, category_id, amount_cents, type, description, occurred_at, is_impulse, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [t.id, t.bankId, t.categoryId, t.amountCents, t.type, t.description, t.occurredAt, t.isImpulse ? 1 : 0, now],
    );
  }
  for (const g of backup.goals) {
    await db.runAsync(
      `INSERT INTO goals (id, title, target_cents, current_cents, deadline, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [g.id, g.title, g.targetCents, g.currentCents, g.deadline, g.status, now, now],
    );
  }
  if (backup.profile.name) {
    await db.runAsync('INSERT INTO settings (key, value) VALUES (?, ?)', ['profile.name', backup.profile.name]);
  }
}

/** Replaces the whole database with `backup`'s contents, atomically. */
export async function restoreBackup(backup: Backup): Promise<void> {
  const db = await getDb();
  await db.withExclusiveTransactionAsync(async (txn) => {
    await clearAll(txn);
    await insertBackup(txn, backup);
  });
}

/** Wipes all data and reseeds the defaults (categories/banks), atomically. */
export async function resetAll(): Promise<void> {
  const db = await getDb();
  await db.withExclusiveTransactionAsync(async (txn) => {
    await clearAll(txn);
    await seedDefaults(txn);
  });
}
