import { setupTestDb } from '../test-utils/test-db';
import { buildBackup, parseBackup, restoreBackup, resetAll, type Backup } from './backup';
import { createTransaction } from './transactions';
import { saveName } from './profile';
import { DEFAULT_BANKS, DEFAULT_CATEGORIES } from './seeds';
import { DataError } from './errors';
import { TransactionTypeEnum } from '../services/types';

setupTestDb();

describe('buildBackup / restoreBackup', () => {
  it('round-trips a full snapshot: export, wipe, import gives the data back', async () => {
    await saveName('Ana');
    await createTransaction({
      bankId: 'nubank', categoryId: 'compras', amountCents: 5000, type: TransactionTypeEnum.EXPENSE, description: 'Mercado',
    });

    const backup = await buildBackup();
    expect(backup.app).toBe('wyden');
    expect(backup.profile.name).toBe('Ana');
    expect(backup.transactions).toHaveLength(1);
    expect(backup.categories).toHaveLength(DEFAULT_CATEGORIES.length);
    expect(backup.banks).toHaveLength(DEFAULT_BANKS.length);

    await resetAll(); // wipe + reseed with no name, to prove restore isn't a no-op
    await restoreBackup(backup);

    const restored = await buildBackup();
    expect(restored.profile.name).toBe('Ana');
    expect(restored.transactions).toHaveLength(1);
    expect(restored.transactions[0].description).toBe('Mercado');
  });

  it('rolls back on a foreign-key violation instead of leaving a half-restored database', async () => {
    const before = await buildBackup();
    const bad: Backup = {
      ...before,
      transactions: [
        {
          id: 'bad-tx',
          bankId: 'does-not-exist',
          categoryId: 'compras',
          amountCents: 1000,
          type: TransactionTypeEnum.EXPENSE,
          description: null,
          occurredAt: Date.now(),
          isImpulse: false,
        },
      ],
    };

    await expect(restoreBackup(bad)).rejects.toThrow();

    // The restore clears everything before reinserting — a real rollback means
    // categories/banks are back, not left empty.
    const after = await buildBackup();
    expect(after.categories).toHaveLength(DEFAULT_CATEGORIES.length);
    expect(after.banks).toHaveLength(DEFAULT_BANKS.length);
    expect(after.transactions).toHaveLength(0);
  });
});

describe('parseBackup', () => {
  it('rejects invalid JSON', () => {
    expect(() => parseBackup('{not json')).toThrow(DataError);
  });

  it('rejects well-formed JSON with the wrong shape', () => {
    expect(() => parseBackup(JSON.stringify({ hello: 'world' }))).toThrow(DataError);
  });

  it('accepts a backup built by buildBackup, round-tripped through JSON', async () => {
    const backup = await buildBackup();
    expect(parseBackup(JSON.stringify(backup))).toEqual(backup);
  });
});

describe('resetAll', () => {
  it('wipes transactions and the saved name, and reseeds the defaults', async () => {
    await saveName('Ana');
    await createTransaction({ bankId: 'nubank', categoryId: 'compras', amountCents: 5000, type: TransactionTypeEnum.EXPENSE });

    await resetAll();

    const after = await buildBackup();
    expect(after.profile.name).toBeNull();
    expect(after.transactions).toHaveLength(0);
    expect(after.categories).toHaveLength(DEFAULT_CATEGORIES.length);
    expect(after.banks).toHaveLength(DEFAULT_BANKS.length);
  });
});
