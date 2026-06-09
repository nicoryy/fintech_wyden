import {
  toIconName,
  luminance,
  inkForBackground,
  shortFromName,
  toCategory,
  splitCategories,
  toBank,
  signedAmount,
  timeLabel,
  dayLabel,
  whenLabel,
  toTransaction,
  groupByDay,
  toGoal,
  placeholderGoal,
  toSpendSlices,
  toBankSpend,
  toMonthPoints,
  deriveEvolution,
  economiaFromSummary,
  deriveBehavior,
  toInsightDetail,
} from './transform';
import type {
  ApiBank,
  ApiCategory,
  ApiGoal,
  ApiInsight,
  ApiMonthlyComparison,
  ApiReportByBank,
  ApiReportByCategory,
  ApiReportSummary,
  ApiTransaction,
} from './api-types';
import { CategoryTypeEnum, GoalStatusEnum, InsightTypeEnum, TransactionTypeEnum } from './types';

describe('toIconName', () => {
  it('passes through known icons', () => {
    expect(toIconName('bag')).toBe('bag');
    expect(toIconName('wallet')).toBe('wallet');
  });
  it('falls back to dots for unknown/empty', () => {
    expect(toIconName('not-an-icon')).toBe('dots');
    expect(toIconName(null)).toBe('dots');
    expect(toIconName(undefined)).toBe('dots');
  });
});

describe('luminance / inkForBackground', () => {
  it('reports high luminance for light colors and low for dark', () => {
    expect(luminance('#FFFFFF')).toBeGreaterThan(0.9);
    expect(luminance('#000000')).toBeCloseTo(0);
  });
  it('uses dark ink on a light (yellow BB) tile, white on dark (Nubank purple)', () => {
    expect(inkForBackground('#F4C400')).toBe('#1B1D21');
    expect(inkForBackground('#8A05BE')).toBe('#FFFFFF');
  });
});

describe('shortFromName', () => {
  it('takes the first two letters', () => {
    expect(shortFromName('Banco do Brasil')).toBe('Ba');
    expect(shortFromName('Nubank')).toBe('Nu');
  });
  it('handles empty', () => {
    expect(shortFromName('  ')).toBe('?');
  });
});

describe('toCategory / splitCategories', () => {
  const cats: ApiCategory[] = [
    { id: 'a', name: 'Compras', type: CategoryTypeEnum.EXPENSE, icon: 'bag', color: '#111111' },
    { id: 'b', name: 'Salário', type: CategoryTypeEnum.INCOME, icon: 'wallet', color: '#222222' },
  ];
  it('maps name to label', () => {
    expect(toCategory(cats[0])).toEqual({ id: 'a', label: 'Compras', icon: 'bag', color: '#111111', type: CategoryTypeEnum.EXPENSE });
  });
  it('splits by type', () => {
    const { expense, income } = splitCategories(cats);
    expect(expense.map((c) => c.label)).toEqual(['Compras']);
    expect(income.map((c) => c.label)).toEqual(['Salário']);
  });
});

describe('toBank', () => {
  it('derives short from name when null and computes ink/cash', () => {
    const b: ApiBank = { id: '1', name: 'Dinheiro', short: null, color: '#17A06A', initialBalance: 0, currentBalance: 0 };
    const out = toBank(b);
    expect(out.short).toBe('Di');
    expect(out.cash).toBe(true);
    expect(out.ink).toBe('#FFFFFF'); // green is not light enough → white ink
  });
});

describe('signedAmount', () => {
  it('negates expenses and keeps income positive', () => {
    expect(signedAmount(TransactionTypeEnum.EXPENSE, '42.90')).toBeCloseTo(-42.9);
    expect(signedAmount(TransactionTypeEnum.INCOME, '6250.00')).toBeCloseTo(6250);
  });
});

describe('date labels', () => {
  const now = new Date(2026, 5, 9, 15, 0); // 09 Jun 2026, 15:00 local
  it('timeLabel zero-pads HH:mm', () => {
    expect(timeLabel(new Date(2026, 5, 9, 9, 5))).toBe('09:05');
    expect(timeLabel(new Date(2026, 5, 9, 13, 20))).toBe('13:20');
  });
  it('dayLabel: Hoje / Ontem / DD mmm', () => {
    expect(dayLabel(new Date(2026, 5, 9, 8, 0), now)).toBe('Hoje');
    expect(dayLabel(new Date(2026, 5, 8, 8, 0), now)).toBe('Ontem');
    expect(dayLabel(new Date(2026, 5, 6, 8, 0), now)).toBe('06 jun');
  });
  it('whenLabel combines day + time', () => {
    expect(whenLabel(new Date(2026, 5, 9, 13, 20), now)).toBe('Hoje, 13:20');
  });
});

describe('toTransaction / groupByDay', () => {
  const now = new Date(2026, 5, 9, 23, 59);
  const local = (y: number, m: number, d: number, h: number, mi: number) =>
    new Date(y, m, d, h, mi).toISOString();
  const txs: ApiTransaction[] = [
    { id: 't1', userId: 'u', bankId: 'b', categoryId: 'c', amount: '42.90', type: TransactionTypeEnum.EXPENSE, description: 'iFood', transactionDate: local(2026, 5, 9, 13, 20), isImpulse: true },
    { id: 't2', userId: 'u', bankId: 'b', categoryId: 'c', amount: '18.50', type: TransactionTypeEnum.EXPENSE, description: 'Uber', transactionDate: local(2026, 5, 9, 9, 5) },
    { id: 't3', userId: 'u', bankId: 'b', categoryId: 'c', amount: '6250.00', type: TransactionTypeEnum.INCOME, description: 'Salário', transactionDate: local(2026, 5, 8, 8, 0) },
  ];

  it('produces a signed, labeled transaction', () => {
    const t = toTransaction(txs[0], now);
    expect(t.amount).toBeCloseTo(-42.9);
    expect(t.time).toBe('13:20');
    expect(t.when).toBe('Hoje, 13:20');
    expect(t.isImpulse).toBe(true);
  });

  it('groups by day newest-first with Hoje/Ontem labels', () => {
    const groups = groupByDay(txs, now);
    expect(groups.map((g) => g.label)).toEqual(['Hoje', 'Ontem']);
    expect(groups[0].items.map((i) => i.id)).toEqual(['t1', 't2']); // newest first within day
    expect(groups[1].items[0].id).toBe('t3');
  });
});

describe('toGoal / placeholderGoal', () => {
  it('coerces string amounts to numbers', () => {
    const g: ApiGoal = { id: 'g', title: 'X', targetAmount: '5000', currentAmount: '3000', status: GoalStatusEnum.ACTIVE };
    expect(toGoal(g)).toMatchObject({ targetAmount: 5000, currentAmount: 3000 });
  });
  it('placeholder is a zeroed active goal', () => {
    expect(placeholderGoal()).toMatchObject({ targetAmount: 0, currentAmount: 0, status: GoalStatusEnum.ACTIVE });
  });
});

describe('reports transforms', () => {
  it('toSpendSlices maps total→value', () => {
    const list: ApiReportByCategory[] = [{ categoryId: 'c', name: 'C', icon: 'bag', color: '#000', total: 100, pct: 50 }];
    expect(toSpendSlices(list)).toEqual([{ categoryId: 'c', value: 100, pct: 50 }]);
  });
  it('toBankSpend maps total→value', () => {
    const list: ApiReportByBank[] = [{ bankId: 'b', name: 'B', total: 200 }];
    expect(toBankSpend(list)).toEqual([{ bankId: 'b', value: 200 }]);
  });
  it('toMonthPoints uses abbreviated pt-BR month names', () => {
    const list: ApiMonthlyComparison[] = [{ month: '2026-01', receitas: 10, despesas: 5 }];
    expect(toMonthPoints(list)).toEqual([{ m: 'Jan', rec: 10, desp: 5 }]);
  });
});

describe('deriveEvolution', () => {
  it('normalizes cumulative net worth to 0..1', () => {
    const list: ApiMonthlyComparison[] = [
      { month: '2026-01', receitas: 100, despesas: 50 }, // +50 cumulative 50
      { month: '2026-02', receitas: 100, despesas: 0 },  // +100 cumulative 150
    ];
    const e = deriveEvolution(list);
    expect(e[0]).toBeCloseTo(0);
    expect(e[1]).toBeCloseTo(1);
  });
  it('handles a flat series', () => {
    const list: ApiMonthlyComparison[] = [
      { month: '2026-01', receitas: 0, despesas: 0 },
      { month: '2026-02', receitas: 0, despesas: 0 },
    ];
    expect(deriveEvolution(list)).toEqual([0.5, 0.5]);
  });
  it('handles empty input', () => {
    expect(deriveEvolution([])).toEqual([0, 0]);
  });
});

describe('economiaFromSummary', () => {
  it('computes saved percentage of income', () => {
    const s: ApiReportSummary = { receitas: 6250, despesas: 1899.8, saldo: 4350.2, economia: 4350.2 };
    expect(economiaFromSummary(s)).toEqual({ value: 4350.2, pct: 70 });
  });
  it('is 0% when there is no income', () => {
    const s: ApiReportSummary = { receitas: 0, despesas: 0, saldo: 0, economia: 0 };
    expect(economiaFromSummary(s).pct).toBe(0);
  });
});

describe('deriveBehavior', () => {
  const expense = (impulse: boolean): ApiTransaction => ({
    id: Math.random().toString(), userId: 'u', bankId: 'b', categoryId: 'c',
    amount: '10', type: TransactionTypeEnum.EXPENSE, transactionDate: new Date().toISOString(),
    isImpulse: impulse,
  });

  it('returns placeholders when a month has no expenses', () => {
    expect(deriveBehavior([], [expense(true)])).toEqual({ impulsivity: '—', consistency: '—' });
  });
  it('compares impulse rate month-over-month', () => {
    // current 50% impulse, previous 0% → +50% impulsivity
    const out = deriveBehavior([expense(true), expense(false)], [expense(false), expense(false)]);
    expect(out.impulsivity).toBe('+50%');
    expect(out.consistency).toBe('−50%');
  });
});

describe('toInsightDetail', () => {
  it('returns an empty state when there are no insights', () => {
    const out = toInsightDetail([]);
    expect(out.title).toBe('Sem insights ainda');
    expect(out.weeklyPattern.length).toBe(7);
  });
  it('maps the first insight onto the detail shape', () => {
    const list: ApiInsight[] = [{ id: 'i', type: InsightTypeEnum.IMPULSIVITY, score: 72, title: 'Gasto por impulso', description: 'desc' }];
    const out = toInsightDetail(list);
    expect(out.title).toBe('Gasto por impulso');
    expect(out.metrics[0].value).toBe('Alto'); // score 72 → Alto
  });
});
