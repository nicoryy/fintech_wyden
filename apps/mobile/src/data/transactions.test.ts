import { setupTestDb } from '../test-utils/test-db';
import { createTransaction, listRecentTransactions, listTransactions } from './transactions';
import { listBanks } from './catalog';
import { DataError } from './errors';
import { TransactionTypeEnum } from '../services/types';

setupTestDb();

describe('createTransaction', () => {
  it('rejects a non-positive amount', async () => {
    await expect(
      createTransaction({ bankId: 'nubank', categoryId: 'compras', amountCents: 0, type: TransactionTypeEnum.EXPENSE }),
    ).rejects.toThrow(DataError);
  });

  it('rejects an unknown bank', async () => {
    await expect(
      createTransaction({
        bankId: 'does-not-exist', categoryId: 'compras', amountCents: 1000, type: TransactionTypeEnum.EXPENSE,
      }),
    ).rejects.toThrow('Conta não encontrada.');
  });

  it('rejects an unknown category', async () => {
    await expect(
      createTransaction({
        bankId: 'nubank', categoryId: 'does-not-exist', amountCents: 1000, type: TransactionTypeEnum.EXPENSE,
      }),
    ).rejects.toThrow('Categoria não encontrada.');
  });

  it('trims a blank description down to null', async () => {
    const record = await createTransaction({
      bankId: 'nubank', categoryId: 'compras', amountCents: 1000, type: TransactionTypeEnum.EXPENSE, description: '   ',
    });
    expect(record.description).toBeNull();
  });

  it('persists the computed isImpulse flag', async () => {
    const saturdayNight = new Date(2026, 0, 17, 22, 0).getTime();
    const record = await createTransaction({
      bankId: 'nubank', categoryId: 'compras', amountCents: 50_000, type: TransactionTypeEnum.EXPENSE, occurredAt: saturdayNight,
    });
    expect(record.isImpulse).toBe(true);

    const [stored] = await listTransactions({ from: saturdayNight, to: saturdayNight + 1 });
    expect(stored.isImpulse).toBe(true);
  });
});

describe('bank balances (computed from transactions)', () => {
  it('starts at zero and reflects income/expense as they are written', async () => {
    await createTransaction({ bankId: 'nubank', categoryId: 'salario', amountCents: 100_000, type: TransactionTypeEnum.INCOME });
    await createTransaction({ bankId: 'nubank', categoryId: 'compras', amountCents: 30_000, type: TransactionTypeEnum.EXPENSE });

    const banks = await listBanks();
    const nubank = banks.find((b) => b.id === 'nubank')!;
    expect(nubank.balanceCents).toBe(70_000);

    const untouched = banks.find((b) => b.id === 'itau')!;
    expect(untouched.balanceCents).toBe(0);
  });
});

describe('listTransactions', () => {
  it('returns only transactions within [from, to), newest first', async () => {
    const day1 = new Date(2026, 0, 1, 12).getTime();
    const day2 = new Date(2026, 0, 15, 12).getTime();
    const nextMonth = new Date(2026, 1, 1, 12).getTime();
    await createTransaction({ bankId: 'nubank', categoryId: 'compras', amountCents: 1000, type: TransactionTypeEnum.EXPENSE, occurredAt: day1 });
    await createTransaction({ bankId: 'nubank', categoryId: 'compras', amountCents: 2000, type: TransactionTypeEnum.EXPENSE, occurredAt: day2 });
    await createTransaction({ bankId: 'nubank', categoryId: 'compras', amountCents: 3000, type: TransactionTypeEnum.EXPENSE, occurredAt: nextMonth });

    const out = await listTransactions({ from: new Date(2026, 0, 1).getTime(), to: new Date(2026, 1, 1).getTime() });
    expect(out.map((t) => t.amountCents)).toEqual([2000, 1000]); // newest first; nextMonth excluded
  });
});

describe('listRecentTransactions', () => {
  it('limits and orders newest-first, with the category name denormalized', async () => {
    for (let i = 0; i < 3; i++) {
      await createTransaction({
        bankId: 'nubank',
        categoryId: 'compras',
        amountCents: 1000 * (i + 1),
        type: TransactionTypeEnum.EXPENSE,
        occurredAt: new Date(2026, 0, i + 1).getTime(),
      });
    }
    const out = await listRecentTransactions(2);
    expect(out.map((t) => t.amountCents)).toEqual([3000, 2000]);
    expect(out[0].categoryName).toBe('Compras');
  });
});
