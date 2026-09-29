/**
 * SQLite access — the on-device database that replaced the Postgres+NestJS API
 * (see the root CLAUDE.md). `SqlExecutor`/`SqlDb` are a small interface over
 * the handful of `expo-sqlite` methods the app actually uses, so tests can
 * swap in a sql.js adapter (`test-utils/test-db.ts`) without touching any
 * call site in `src/data/*`.
 */
import * as SQLite from 'expo-sqlite';
import type { SQLiteDatabase } from 'expo-sqlite';

import { runMigrations } from './migrations';

export type SqlParam = string | number | null;

export interface SqlExecutor {
  execAsync(source: string): Promise<void>;
  runAsync(source: string, params?: SqlParam[]): Promise<{ lastInsertRowId: number; changes: number }>;
  getAllAsync<T>(source: string, params?: SqlParam[]): Promise<T[]>;
  getFirstAsync<T>(source: string, params?: SqlParam[]): Promise<T | null>;
}

export interface SqlDb extends SqlExecutor {
  /** Runs `task` inside a real SQL transaction; rolls back on a thrown error. */
  withExclusiveTransactionAsync(task: (txn: SqlExecutor) => Promise<void>): Promise<void>;
}

const DATABASE_NAME = 'wyden.db';

let dbPromise: Promise<SqlDb> | null = null;
let testOverride: SqlDb | null = null;

/**
 * Adapts `expo-sqlite`'s richer (overloaded, variadic-params) API down to our
 * own narrower `SqlDb` shape, so the rest of `src/data/*` — and the sql.js
 * test adapter in `test-utils/test-db.ts` — only ever deal with one simple
 * interface.
 */
function adapt(db: SQLiteDatabase): SqlDb {
  return {
    execAsync: (source) => db.execAsync(source),
    runAsync: (source, params = []) => db.runAsync(source, params),
    getAllAsync: (source, params = []) => db.getAllAsync(source, params),
    getFirstAsync: (source, params = []) => db.getFirstAsync(source, params),
    // `withExclusiveTransactionAsync` hands the task its own `Transaction`
    // (a `SQLiteDatabase` subclass scoped to the transaction) — adapt it the
    // same way so the task only ever sees our own `SqlExecutor` shape.
    withExclusiveTransactionAsync: (task) => db.withExclusiveTransactionAsync((txn) => task(adapt(txn))),
  };
}

async function openDb(): Promise<SqlDb> {
  const native = await SQLite.openDatabaseAsync(DATABASE_NAME);
  // WAL for normal app usage; foreign_keys is off by default in SQLite and
  // must be turned on per-connection — it's what makes the FKs in the schema
  // (transactions → banks/categories) actually enforced.
  await native.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const db = adapt(native);
  await runMigrations(db);
  return db;
}

/**
 * Lazily opens (and migrates) the on-device database. Safe to call repeatedly
 * — the first caller pays for opening it, everyone else awaits the same
 * promise.
 */
export function getDb(): Promise<SqlDb> {
  if (testOverride) return Promise.resolve(testOverride);
  if (!dbPromise) {
    dbPromise = openDb().catch((err: unknown) => {
      // Let a failed open be retried (e.g. the root layout's "Tentar
      // novamente") instead of caching the rejection forever.
      dbPromise = null;
      throw err;
    });
  }
  return dbPromise;
}

/**
 * Test-only: swap the singleton for an in-memory adapter (see
 * `test-utils/test-db.ts`), or pass `null` to go back to the real thing.
 */
export function setDbForTests(db: SqlDb | null): void {
  testOverride = db;
  dbPromise = null;
}
