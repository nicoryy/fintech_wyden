/**
 * In-memory SQLite for tests — swaps `expo-sqlite` for `sql.js` (SQLite
 * compiled to asm.js, no native module, no filesystem) behind the same
 * `SqlDb` interface `src/data/db.ts` defines, via `setDbForTests`. Real SQL
 * runs against a real (if temporary) database, so `src/data/*` is exercised
 * exactly as it runs on-device.
 */
import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js';

import { setDbForTests, type SqlDb, type SqlExecutor, type SqlParam } from '../data/db';
import { runMigrations } from '../data/migrations';

let sqlJsPromise: Promise<SqlJsStatic> | null = null;

function loadSqlJs(): Promise<SqlJsStatic> {
  if (!sqlJsPromise) sqlJsPromise = initSqlJs();
  return sqlJsPromise;
}

function wrap(database: Database): SqlDb {
  const execAsync: SqlExecutor['execAsync'] = (source) => {
    database.run(source);
    return Promise.resolve();
  };

  const runAsync: SqlExecutor['runAsync'] = (source, params: SqlParam[] = []) => {
    const stmt = database.prepare(source);
    try {
      stmt.bind(params);
      stmt.step();
    } finally {
      stmt.free();
    }
    const changes = database.getRowsModified();
    const idResult = database.exec('SELECT last_insert_rowid() AS id');
    const lastInsertRowId = Number(idResult[0]?.values[0]?.[0] ?? 0);
    return Promise.resolve({ lastInsertRowId, changes });
  };

  function getAllAsync<T>(source: string, params: SqlParam[] = []): Promise<T[]> {
    const stmt = database.prepare(source);
    const rows: T[] = [];
    try {
      stmt.bind(params);
      while (stmt.step()) {
        rows.push(stmt.getAsObject() as T);
      }
    } finally {
      stmt.free();
    }
    return Promise.resolve(rows);
  }

  function getFirstAsync<T>(source: string, params: SqlParam[] = []): Promise<T | null> {
    const stmt = database.prepare(source);
    let row: T | null = null;
    try {
      stmt.bind(params);
      if (stmt.step()) row = stmt.getAsObject() as T;
    } finally {
      stmt.free();
    }
    return Promise.resolve(row);
  }

  const withExclusiveTransactionAsync = async (task: (txn: SqlExecutor) => Promise<void>): Promise<void> => {
    await execAsync('BEGIN');
    try {
      await task({ execAsync, runAsync, getAllAsync, getFirstAsync });
      await execAsync('COMMIT');
    } catch (err) {
      await execAsync('ROLLBACK');
      throw err;
    }
  };

  return { execAsync, runAsync, getAllAsync, getFirstAsync, withExclusiveTransactionAsync };
}

/** A fresh, migrated (and therefore seeded — see `data/seeds.ts`) in-memory database. */
export async function createTestDb(): Promise<SqlDb> {
  const SQL = await loadSqlJs();
  const db = wrap(new SQL.Database());
  // Same as the real `openDb()` in `data/db.ts` — needed for the backup
  // rollback-on-FK-violation tests to mean anything.
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await runMigrations(db);
  return db;
}

/**
 * Test-suite setup: creates a fresh migrated database before each test and
 * installs it via `setDbForTests`, so every `src/data/*` call made during
 * that test — directly, or through a hook/screen — transparently uses it.
 * Call once at the top of a test file, outside any `describe`/`it`.
 */
export function setupTestDb(): void {
  beforeEach(async () => {
    setDbForTests(await createTestDb());
  });
  afterEach(() => {
    setDbForTests(null);
  });
}
