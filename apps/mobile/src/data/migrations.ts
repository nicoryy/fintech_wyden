/**
 * Schema migrations, tracked via `PRAGMA user_version` (the pattern Expo's own
 * SQLite docs recommend). Each entry runs once, in order; `runMigrations`
 * applies whatever the current database hasn't seen yet. There is no `user_id`
 * anywhere — the app is single-user by design (see the root CLAUDE.md) — and
 * no `insights` table: the old API never generated insights either (it only
 * ever read an always-empty table), so there is nothing to port yet.
 */
import type { SqlExecutor } from './db';
import { seedDefaults } from './seeds';

type Migration = (db: SqlExecutor) => Promise<void>;

const MIGRATIONS: Migration[] = [
  // v1 — initial schema + default categories/banks seed.
  async (db) => {
    await db.execAsync(`
      CREATE TABLE settings (
        key   TEXT PRIMARY KEY NOT NULL,
        value TEXT
      );

      CREATE TABLE categories (
        id         TEXT PRIMARY KEY NOT NULL,
        name       TEXT NOT NULL,
        type       TEXT NOT NULL CHECK (type IN ('income', 'expense')),
        icon       TEXT,
        color      TEXT,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE banks (
        id                    TEXT PRIMARY KEY NOT NULL,
        name                  TEXT NOT NULL,
        short                 TEXT,
        color                 TEXT,
        initial_balance_cents INTEGER NOT NULL DEFAULT 0,
        created_at            INTEGER NOT NULL
      );

      CREATE TABLE transactions (
        id           TEXT PRIMARY KEY NOT NULL,
        bank_id      TEXT NOT NULL REFERENCES banks(id),
        category_id  TEXT NOT NULL REFERENCES categories(id),
        amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
        type         TEXT NOT NULL CHECK (type IN ('income', 'expense')),
        description  TEXT,
        occurred_at  INTEGER NOT NULL,
        is_impulse   INTEGER NOT NULL DEFAULT 0,
        created_at   INTEGER NOT NULL
      );
      CREATE INDEX idx_transactions_occurred_at ON transactions(occurred_at);

      CREATE TABLE goals (
        id            TEXT PRIMARY KEY NOT NULL,
        title         TEXT NOT NULL,
        target_cents  INTEGER NOT NULL,
        current_cents INTEGER NOT NULL DEFAULT 0,
        deadline      INTEGER,
        status        TEXT NOT NULL CHECK (status IN ('active', 'completed', 'paused')) DEFAULT 'active',
        created_at    INTEGER NOT NULL,
        updated_at    INTEGER NOT NULL
      );
    `);
    await seedDefaults(db);
  },
];

export const SCHEMA_VERSION = MIGRATIONS.length;

/** Applies pending migrations in order, tracked via `PRAGMA user_version`. */
export async function runMigrations(db: SqlExecutor): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;
  for (let i = version; i < MIGRATIONS.length; i++) {
    await MIGRATIONS[i](db);
    version = i + 1;
    await db.execAsync(`PRAGMA user_version = ${version}`);
  }
}
