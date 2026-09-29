import { summarize, totalsByCategory, totalsByBank, monthlyComparison } from './reports';
import type { TransactionRecord } from './records';
import { TransactionTypeEnum } from '../services/types';

let seq = 0;
function tx(overrides: Partial<TransactionRecord>): TransactionRecord {
  seq += 1;
  return {
    id: `t${seq}`,
    bankId: 'nubank',
    categoryId: 'compras',
    categoryName: 'Compras',
    amountCents: 0,
    type: TransactionTypeEnum.EXPENSE,
    description: null,
    occurredAt: Date.now(),
    isImpulse: false,
    ...overrides,
  };
}

describe('summarize', () => {
  it('sums income and expense separately; saldo = economia = receitas - despesas', () => {
    const txs = [
      tx({ type: TransactionTypeEnum.INCOME, amountCents: 100_000 }),
      tx({ type: TransactionTypeEnum.EXPENSE, amountCents: 25_000 }),
      tx({ type: TransactionTypeEnum.EXPENSE, amountCents: 5_000 }),
    ];
    expect(summarize(txs)).toEqual({
      receitasCents: 100_000,
      despesasCents: 30_000,
      saldoCents: 70_000,
      economiaCents: 70_000,
    });
  });

  it('is all zeros for an empty list', () => {
    expect(summarize([])).toEqual({ receitasCents: 0, despesasCents: 0, saldoCents: 0, economiaCents: 0 });
  });
});

describe('totalsByCategory', () => {
  it("sums per category for the given type, pct against that type's own grand total, sorted desc", () => {
    const txs = [
      tx({ categoryId: 'alimentacao', amountCents: 10_000, type: TransactionTypeEnum.EXPENSE }),
      tx({ categoryId: 'alimentacao', amountCents: 20_000, type: TransactionTypeEnum.EXPENSE }),
      tx({ categoryId: 'transporte', amountCents: 10_000, type: TransactionTypeEnum.EXPENSE }),
      tx({ categoryId: 'salario', amountCents: 999_999, type: TransactionTypeEnum.INCOME }), // ignored (wrong type)
    ];
    expect(totalsByCategory(txs, TransactionTypeEnum.EXPENSE)).toEqual([
      { categoryId: 'alimentacao', totalCents: 30_000, pct: 75 },
      { categoryId: 'transporte', totalCents: 10_000, pct: 25 },
    ]);
  });

  it('returns [] when there is nothing of that type', () => {
    expect(totalsByCategory([], TransactionTypeEnum.EXPENSE)).toEqual([]);
  });
});

describe('totalsByBank', () => {
  it('sums expenses per bank (income ignored), sorted desc', () => {
    const txs = [
      tx({ bankId: 'nubank', amountCents: 10_000, type: TransactionTypeEnum.EXPENSE }),
      tx({ bankId: 'itau', amountCents: 40_000, type: TransactionTypeEnum.EXPENSE }),
      tx({ bankId: 'nubank', amountCents: 5_000, type: TransactionTypeEnum.EXPENSE }),
      tx({ bankId: 'nubank', amountCents: 999_999, type: TransactionTypeEnum.INCOME }), // ignored
    ];
    expect(totalsByBank(txs)).toEqual([
      { bankId: 'itau', totalCents: 40_000 },
      { bankId: 'nubank', totalCents: 15_000 },
    ]);
  });
});

describe('monthlyComparison', () => {
  it('zero-fills N months ending at `now`, oldest first', () => {
    const now = new Date(2026, 5, 15); // Jun 2026
    const out = monthlyComparison([], 3, now);
    expect(out.map((m) => m.month)).toEqual(['2026-04', '2026-05', '2026-06']);
    expect(out.every((m) => m.receitasCents === 0 && m.despesasCents === 0)).toBe(true);
  });

  it('buckets transactions into their own month and drops anything outside the window', () => {
    const now = new Date(2026, 5, 15);
    const txs = [
      tx({ type: TransactionTypeEnum.INCOME, amountCents: 100_000, occurredAt: new Date(2026, 5, 1).getTime() }),
      tx({ type: TransactionTypeEnum.EXPENSE, amountCents: 20_000, occurredAt: new Date(2026, 5, 10).getTime() }),
      tx({ type: TransactionTypeEnum.EXPENSE, amountCents: 999_999, occurredAt: new Date(2025, 0, 1).getTime() }), // far outside
    ];
    const out = monthlyComparison(txs, 3, now);
    expect(out.find((m) => m.month === '2026-06')).toEqual({ month: '2026-06', receitasCents: 100_000, despesasCents: 20_000 });
    const totalDespesas = out.reduce((s, m) => s + m.despesasCents, 0);
    expect(totalDespesas).toBe(20_000); // the far-outside expense never lands in any bucket
  });
});
