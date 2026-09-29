/**
 * Profile — the single `settings` row that replaced user accounts: just the
 * display name collected once by the Welcome onboarding screen. There is no
 * login anymore (see the root CLAUDE.md), so this is the entire "identity"
 * the app has.
 */
import { getDb } from './db';
import { DataError } from './errors';
import type { ProfileRecord } from './records';

const NAME_KEY = 'profile.name';

export async function getProfile(): Promise<ProfileRecord> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', [NAME_KEY]);
  return { name: row?.value ?? null };
}

/** Trims `name`; throws `DataError` if it's empty after trimming. */
export async function saveName(name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) throw new DataError('Informe um nome.');
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [NAME_KEY, trimmed],
  );
}
