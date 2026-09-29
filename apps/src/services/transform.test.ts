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
  deriveSaldoDelta,
  monthLabelPt,
  monthNamePt,
  shiftMonth,
  economiaForPeriod,
  deriveBehavior,
  toInsightDetail,
} from './transform';
import type { BankTotal, CategoryTotal, MonthTotal } from '../data/reports';
import type { BankRecord, CategoryRecord, GoalRecord, TransactionRecord } from '../data/records';
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
  const cats: CategoryRecord[] = [
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
    const b: BankRecord = {
      id: '1', name: 'Dinheiro', short: null, color: '#17A06A', initialBalanceCents: 0, balanceCents: 0,
    };
    const out = toBank(b);
    expect(out.short).toBe('Di');
    expect(out.cash).toBe(true);
    expect(out.ink).toBe('#FFFFFF'); // green is not light enough → white ink
  });
  it('converts cents to reais', () => {
    const b: BankRecord = {
      id: '1', name: 'Nubank', short: 'Nu', color: '#8A05BE', initialBalanceCents: 0, balanceCents: 12345,
    };
    expect(toBank(b).balance).toBeCloseTo(123.45);
  });
});

describe('signedAmount', () => {
  it('negates expenses and keeps income positive', () => {
    expect(signedAmount(TransactionTypeEnum.EXPENSE, 42.9)).toBeCloseTo(-42.9);
    expect(signedAmount(TransactionTypeEnum.INCOME, 6250)).toBeCloseTo(6250);
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
  const local = (y: number, m: number, d: number, h: number, mi: number) => new Date(y, m, d, h, mi).getTime();
  const record = (overrides: Partial<TransactionRecord>): TransactionRecord => ({
    id: 't', bankId: 'b', categoryId: 'c', categoryName: 'Categoria', amountCents: 0,
    type: TransactionTypeEnum.EXPENSE, description: null, occurredAt: 0, isImpulse: false,
    ...overrides,
  });
  const txs: TransactionRecord[] = [
    record({ id: 't1', amountCents: 4290, description: 'iFood', occurredAt: local(2026, 5, 9, 13, 20), isImpulse: true }),
    record({ id: 't2', amountCents: 1850, description: 'Uber', occurredAt: local(2026, 5, 9, 9, 5) }),
    record({
      id: 't3', amountCents: 625000, type: TransactionTypeEnum.INCOME, description: 'Salário',
      occurredAt: local(2026, 5, 8, 8, 0),
    }),
  ];

  it('produces a signed, labeled transaction', () => {
    const t = toTransaction(txs[0], now);
    expect(t.amount).toBeCloseTo(-42.9);
    expect(t.time).toBe('13:20');
    expect(t.when).toBe('Hoje, 13:20');
    expect(t.isImpulse).toBe(true);
  });

  it('falls back to the category name when there is no description', () => {
    const t = toTransaction(record({ description: null, categoryName: 'Compras', occurredAt: local(2026, 5, 9, 10, 0) }), now);
    expect(t.description).toBe('Compras');
  });

  it('groups by day newest-first with Hoje/Ontem labels', () => {
    const groups = groupByDay(txs, now);
    expect(groups.map((g) => g.label)).toEqual(['Hoje', 'Ontem']);
    expect(groups[0].items.map((i) => i.id)).toEqual(['t1', 't2']); // newest first within day
    expect(groups[1].items[0].id).toBe('t3');
  });
});

describe('toGoal / placeholderGoal', () => {
  it('converts cents to reais', () => {
    const g: GoalRecord = { id: 'g', title: 'X', targetCents: 500000, currentCents: 300000, deadline: null, status: GoalStatusEnum.ACTIVE };
    expect(toGoal(g)).toMatchObject({ targetAmount: 5000, currentAmount: 3000 });
  });
  it('placeholder is a zeroed active goal', () => {
    expect(placeholderGoal()).toMatchObject({ targetAmount: 0, currentAmount: 0, status: GoalStatusEnum.ACTIVE });
  });
});

describe('reports transforms', () => {
  it('toSpendSlices converts totalCents to reais and keeps pct', () => {
    const list: CategoryTotal[] = [{ categoryId: 'c', totalCents: 10000, pct: 50 }];
    expect(toSpendSlices(list)).toEqual([{ categoryId: 'c', value: 100, pct: 50 }]);
  });
  it('toBankSpend converts totalCents to reais', () => {
    const list: BankTotal[] = [{ bankId: 'b', totalCents: 20000 }];
    expect(toBankSpend(list)).toEqual([{ bankId: 'b', value: 200 }]);
  });
  it('toMonthPoints uses abbreviated pt-BR month names and converts cents to reais', () => {
    const list: MonthTotal[] = [{ month: '2026-01', receitasCents: 1000, despesasCents: 500 }];
    expect(toMonthPoints(list)).toEqual([{ m: 'Jan', rec: 10, desp: 5 }]);
  });
});

describe('deriveEvolution', () => {
  it('normalizes cumulative net worth to 0..1', () => {
    const list: MonthTotal[] = [
      { month: '2026-01', receitasCents: 10000, despesasCents: 5000 }, // +5000 cumulative 5000
      { month: '2026-02', receitasCents: 10000, despesasCents: 0 }, // +10000 cumulative 15000
    ];
    const e = deriveEvolution(list);
    expect(e[0]).toBeCloseTo(0);
    expect(e[1]).toBeCloseTo(1);
  });
  it('handles a flat series', () => {
    const list: MonthTotal[] = [
      { month: '2026-01', receitasCents: 0, despesasCents: 0 },
      { month: '2026-02', receitasCents: 0, despesasCents: 0 },
    ];
    expect(deriveEvolution(list)).toEqual([0.5, 0.5]);
  });
  it('handles empty input', () => {
    expect(deriveEvolution([])).toEqual([0, 0]);
  });
});

describe('deriveSaldoDelta', () => {
  it('returns null for an all-zero (new account) series', () => {
    const list: MonthTotal[] = [
      { month: '2026-05', receitasCents: 0, despesasCents: 0 },
      { month: '2026-06', receitasCents: 0, despesasCents: 0 },
    ];
    expect(deriveSaldoDelta(list)).toBeNull();
  });
  it('returns null when there is only one month', () => {
    expect(deriveSaldoDelta([{ month: '2026-06', receitasCents: 10000, despesasCents: 0 }])).toBeNull();
  });
  it('computes the change in monthly net vs the previous month, in reais', () => {
    const list: MonthTotal[] = [
      { month: '2026-05', receitasCents: 100000, despesasCents: 40000 }, // net 600
      { month: '2026-06', receitasCents: 120000, despesasCents: 30000 }, // net 900
    ];
    expect(deriveSaldoDelta(list)).toBeCloseTo(300);
  });
});

describe('month helpers', () => {
  it('monthLabelPt formats a full pt-BR month + year', () => {
    expect(monthLabelPt('2026-06')).toBe('Junho 2026');
    expect(monthLabelPt('2026-01')).toBe('Janeiro 2026');
  });
  it('monthNamePt returns the lowercase month name', () => {
    expect(monthNamePt('2026-06')).toBe('junho');
  });
  it('shiftMonth moves across year boundaries', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(shiftMonth('2026-06', -2)).toBe('2026-04');
  });
});

describe('economiaForPeriod', () => {
  const list: MonthTotal[] = [
    { month: '2026-04', receitasCents: 100000, despesasCents: 60000 },
    { month: '2026-05', receitasCents: 100000, despesasCents: 40000 },
    { month: '2026-06', receitasCents: 100000, despesasCents: 20000 }, // net 800
  ];
  it('aggregates only the last month (Mês)', () => {
    expect(economiaForPeriod(list, 1)).toEqual({ value: 800, pct: 80 });
  });
  it('aggregates the last 3 months (Trimestre)', () => {
    // receitas 3000, despesas 1200 → value 1800, pct 60
    expect(economiaForPeriod(list, 3)).toEqual({ value: 1800, pct: 60 });
  });
  it('clamps the window to the available months and is 0% with no income', () => {
    expect(economiaForPeriod(list, 12).value).toBe(1800);
    expect(economiaForPeriod([{ month: '2026-06', receitasCents: 0, despesasCents: 0 }], 1)).toEqual({ value: 0, pct: 0 });
  });
});

describe('deriveBehavior', () => {
  const expense = (impulse: boolean): TransactionRecord => ({
    id: Math.random().toString(), bankId: 'b', categoryId: 'c', categoryName: 'Categoria', amountCents: 1000,
    type: TransactionTypeEnum.EXPENSE, description: null, occurredAt: Date.now(), isImpulse: impulse,
  });

  it('returns placeholders when a month has no expenses', () => {
    expect(deriveBehavior([], [expense(true)])).toEqual({ impulsivity: '—', consistency: '—' });
  });
  it('compares impulse rate month-over-month', () => {
    // current 50% impulse, previous 0% → +50% impulsivity
    const out = deriveBehavior([expense(true), expense(false)], [expense(false), expense(false)]);
    expect(out.impulsivity).toBe('+50%');
    expect(out.consistency).toBe('-50%');
  });
});

describe('toInsightDetail', () => {
  it('returns an honest empty state when there are no insights — no fabricated weeklyPattern/metrics/tip', () => {
    const out = toInsightDetail([]);
    expect(out.title).toBe('Sem insights ainda');
    expect(out.weeklyPattern).toBeUndefined();
    expect(out.metrics).toBeUndefined();
    expect(out.tip).toBeUndefined();
  });

  it('maps the first insight onto the detail shape, without a fabricated weeklyPattern or peak-hour metric', () => {
    const out = toInsightDetail([{ type: InsightTypeEnum.IMPULSIVITY, score: 72, title: 'Gasto por impulso', description: 'desc' }]);
    expect(out.title).toBe('Gasto por impulso');
    // Only the score-derived metric — no invented "Horário de pico" or weeklyPattern.
    expect(out.metrics).toEqual([
      { label: 'Índice de impulso', value: 'Alto', tone: 'orange', sub: 'score 72' },
    ]);
    expect(out.weeklyPattern).toBeUndefined();
    expect(out.tip).toEqual({ title: 'Dica para esta semana', body: 'desc' });
  });
});
