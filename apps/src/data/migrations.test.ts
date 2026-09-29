import { createTestDb } from '../test-utils/test-db';
import { SCHEMA_VERSION } from './migrations';
import { DEFAULT_BANKS, DEFAULT_CATEGORIES, seedDefaults } from './seeds';

describe('migrations', () => {
  it('bumps PRAGMA user_version to the schema version', async () => {
    const db = await createTestDb();
    const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    expect(row?.user_version).toBe(SCHEMA_VERSION);
  });

  it('seeds the default categories and banks on a fresh database', async () => {
    const db = await createTestDb();
    const categories = await db.getAllAsync('SELECT id FROM categories');
    const banks = await db.getAllAsync('SELECT id FROM banks');
    expect(categories).toHaveLength(DEFAULT_CATEGORIES.length);
    expect(banks).toHaveLength(DEFAULT_BANKS.length);
  });

  it('seedDefaults is idempotent — running it again creates nothing new', async () => {
    const db = await createTestDb();
    await seedDefaults(db);
    await seedDefaults(db);
    const categories = await db.getAllAsync('SELECT id FROM categories');
    expect(categories).toHaveLength(DEFAULT_CATEGORIES.length);
  });
});
