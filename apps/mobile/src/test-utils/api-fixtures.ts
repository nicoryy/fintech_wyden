/**
 * Raw API fixtures + a mocked-axios router for tests. `mockApiGet`/`mockApiPost`
 * return canned `{ data }` responses keyed by the request URL so hooks/screens
 * exercise the real transform pipeline against deterministic data.
 */
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
} from '../services/api-types';
import { CategoryTypeEnum, GoalStatusEnum, InsightTypeEnum, TransactionTypeEnum } from '../services/types';

export const FIX_CATEGORIES: ApiCategory[] = [
  { id: 'cat-compras', name: 'Compras', type: CategoryTypeEnum.EXPENSE, icon: 'bag', color: '#22B07D' },
  { id: 'cat-aliment', name: 'Alimentação', type: CategoryTypeEnum.EXPENSE, icon: 'food', color: '#F4762B' },
  { id: 'cat-transporte', name: 'Transporte', type: CategoryTypeEnum.EXPENSE, icon: 'car', color: '#8B5CF6' },
  { id: 'cat-salario', name: 'Salário', type: CategoryTypeEnum.INCOME, icon: 'wallet', color: '#17A06A' },
  { id: 'cat-freelance', name: 'Freelance', type: CategoryTypeEnum.INCOME, icon: 'pencil', color: '#0EA5A0' },
];

export const FIX_BANKS: ApiBank[] = [
  { id: 'bank-nubank', name: 'Nubank', short: 'Nu', color: '#8A05BE', initialBalance: '0', currentBalance: '100' },
  { id: 'bank-bb', name: 'Banco do Brasil', short: 'BB', color: '#F4C400', initialBalance: '0', currentBalance: '200' },
  { id: 'bank-dinheiro', name: 'Dinheiro', short: '$', color: '#17A06A', initialBalance: '0', currentBalance: '50' },
];

export const FIX_SUMMARY: ApiReportSummary = {
  receitas: 6250, despesas: 1899.8, saldo: 4350.2, economia: 4350.2,
};

export const FIX_BY_CATEGORY: ApiReportByCategory[] = [
  { categoryId: 'cat-compras', name: 'Compras', icon: 'bag', color: '#22B07D', total: 712.4, pct: 37 },
  { categoryId: 'cat-aliment', name: 'Alimentação', icon: 'food', color: '#F4762B', total: 459.3, pct: 24 },
];

export const FIX_BY_BANK: ApiReportByBank[] = [
  { bankId: 'bank-nubank', name: 'Nubank', total: 842.3 },
  { bankId: 'bank-bb', name: 'Banco do Brasil', total: 99.4 },
];

export const FIX_MONTHLY: ApiMonthlyComparison[] = [
  { month: '2026-01', receitas: 5800, despesas: 2100 },
  { month: '2026-02', receitas: 6000, despesas: 2450 },
  { month: '2026-03', receitas: 5900, despesas: 1980 },
  { month: '2026-04', receitas: 6100, despesas: 2300 },
  { month: '2026-05', receitas: 6250, despesas: 2520 },
  { month: '2026-06', receitas: 6250, despesas: 1899.8 },
];

export const FIX_TRANSACTIONS: ApiTransaction[] = [
  {
    id: 'tx1', userId: 'u1', bankId: 'bank-nubank', categoryId: 'cat-aliment',
    amount: '42.90', type: TransactionTypeEnum.EXPENSE, description: 'iFood',
    transactionDate: '2026-06-09T13:20:00.000Z', isImpulse: true,
  },
  {
    id: 'tx2', userId: 'u1', bankId: 'bank-bb', categoryId: 'cat-salario',
    amount: '6250.00', type: TransactionTypeEnum.INCOME, description: 'Salário',
    transactionDate: '2026-06-08T08:00:00.000Z', isImpulse: false,
  },
];

export const FIX_GOALS: ApiGoal[] = [
  { id: 'goal1', title: 'Reserva de emergência', targetAmount: '5000', currentAmount: '3000', status: GoalStatusEnum.ACTIVE },
];

export const FIX_INSIGHTS: ApiInsight[] = [
  { id: 'ins1', type: InsightTypeEnum.IMPULSIVITY, score: 72, title: 'Gasto por impulso', description: 'Compras fora do padrão.' },
];

interface MockResponse {
  data: unknown;
}

function route(url: string): MockResponse {
  if (url.startsWith('/categories')) return { data: FIX_CATEGORIES };
  if (url.startsWith('/banks')) return { data: FIX_BANKS };
  if (url.startsWith('/reports/summary')) return { data: FIX_SUMMARY };
  if (url.startsWith('/reports/by-category')) return { data: FIX_BY_CATEGORY };
  if (url.startsWith('/reports/by-bank')) return { data: FIX_BY_BANK };
  if (url.startsWith('/reports/monthly-comparison')) return { data: FIX_MONTHLY };
  if (url.startsWith('/transactions')) return { data: FIX_TRANSACTIONS };
  if (url.startsWith('/goals')) return { data: FIX_GOALS };
  if (url.startsWith('/insights')) return { data: FIX_INSIGHTS };
  if (url.startsWith('/auth/me')) return { data: { id: 'u1', name: 'Ana Lima', email: 'ana@wyden.app' } };
  return { data: [] };
}

/** A jest mock implementation for `api.get`. */
export function mockApiGet() {
  return jest.fn((url: string) => Promise.resolve(route(url)));
}

/** A jest mock implementation for `api.post`. */
export function mockApiPost() {
  return jest.fn((url: string, body?: unknown) => {
    if (url === '/transactions') {
      const b = (body ?? {}) as Partial<ApiTransaction> & { amount?: number };
      return Promise.resolve({
        data: {
          id: 'tx-new', userId: 'u1', bankId: b.bankId, categoryId: b.categoryId,
          amount: String(b.amount ?? 0), type: b.type, description: b.description,
          transactionDate: b.transactionDate ?? new Date().toISOString(), isImpulse: false,
        } as ApiTransaction,
      });
    }
    return Promise.resolve({ data: {} });
  });
}
