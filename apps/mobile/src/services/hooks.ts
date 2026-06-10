/**
 * React Query data hooks — now backed by the live NestJS API.
 *
 * Each hook fetches raw API data via the `api` axios client and runs it through
 * the pure transforms in `transform.ts` to produce the UI domain shapes the
 * screens already consume. Query *keys* and return *types* are unchanged from
 * the former mock-backed version, so the component layer is untouched.
 *
 * Composite hooks (`useDashboard`, `useReports`) fan out via `Promise.all`.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from './api';
import {
  deriveBehavior,
  deriveEvolution,
  deriveSaldoDelta,
  economiaForPeriod,
  groupByDay,
  placeholderGoal,
  toBankSpend,
  toBanks,
  toCategories,
  toGoal,
  toInsightDetail,
  toMonthPoints,
  toSpendSlices,
  toTransactions,
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
import {
  TransactionTypeEnum,
  type Bank,
  type Category,
  type Dashboard,
  type InsightDetail,
  type Reports,
  type Transaction,
  type TransactionGroup,
} from './types';

export const queryKeys = {
  dashboard: ['dashboard'] as const,
  transactions: ['transactions'] as const,
  reports: ['reports'] as const,
  insight: ['insight'] as const,
  categories: ['categories'] as const,
  banks: ['banks'] as const,
};

/** Current month as 'YYYY-MM'. */
export function currentMonth(now: Date = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/** Previous month as 'YYYY-MM'. */
function previousMonth(now: Date = new Date()): string {
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Bounds [start, end) ISO dates for a 'YYYY-MM' month. */
function monthRange(month: string): { startDate: string; endDate: string } {
  const [y, m] = month.split('-').map(Number);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 1);
  return { startDate: start.toISOString(), endDate: end.toISOString() };
}

// ── Catalog (categories + banks) ────────────────────────────────────────────

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: queryKeys.categories,
    queryFn: async () => toCategories((await api.get<ApiCategory[]>('/categories')).data),
    staleTime: 5 * 60_000,
  });
}

export function useBanks() {
  return useQuery<Bank[]>({
    queryKey: queryKeys.banks,
    queryFn: async () => toBanks((await api.get<ApiBank[]>('/banks')).data),
    staleTime: 5 * 60_000,
  });
}

// ── Dashboard ───────────────────────────────────────────────────────────────

/** Dashboard / Início payload — composed from several endpoints. */
export function useDashboard() {
  return useQuery<Dashboard>({
    queryKey: queryKeys.dashboard,
    queryFn: async () => {
      const month = currentMonth();
      const [summary, byCategory, monthly, goals, transactions] = await Promise.all([
        api.get<ApiReportSummary>('/reports/summary', { params: { month } }),
        api.get<ApiReportByCategory[]>('/reports/by-category', { params: { month, type: 'expense' } }),
        api.get<ApiMonthlyComparison[]>('/reports/monthly-comparison', { params: { months: 6 } }),
        api.get<ApiGoal[]>('/goals'),
        api.get<ApiTransaction[]>('/transactions'),
      ]);

      const recentRaw = [...transactions.data]
        .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
        .slice(0, 10);

      return {
        summary: {
          receitas: summary.data.receitas,
          despesas: summary.data.despesas,
          saldo: summary.data.saldo,
        },
        evolution: deriveEvolution(monthly.data),
        deltaSaldo: deriveSaldoDelta(monthly.data),
        spend: toSpendSlices(byCategory.data),
        goal: goals.data[0] ? toGoal(goals.data[0]) : placeholderGoal(),
        recent: toTransactions(recentRaw),
      };
    },
  });
}

// ── Transactions ────────────────────────────────────────────────────────────

/**
 * Transactions for a given month (default: current), grouped by day. The month
 * is part of the query key so navigating months caches independently; the broad
 * `['transactions']` invalidation in `useCreateTransaction` still matches them.
 */
export function useTransactions(month: string = currentMonth()) {
  return useQuery<TransactionGroup[]>({
    queryKey: [...queryKeys.transactions, month],
    queryFn: async () =>
      groupByDay(
        (await api.get<ApiTransaction[]>('/transactions', { params: monthRange(month) })).data,
      ),
  });
}

// ── Reports ─────────────────────────────────────────────────────────────────

/** Reporting period for the Relatórios filter. */
export type ReportPeriod = 'Mês' | 'Trimestre' | 'Ano';

/** How many monthly buckets each period aggregates over. */
const PERIOD_MONTHS: Record<ReportPeriod, number> = {
  Mês: 1,
  Trimestre: 3,
  Ano: 12,
};

/**
 * Reports payload — composed from by-category / by-bank / monthly. The economia
 * hero aggregates over the selected `period` (the backend's summary endpoint is
 * month-only, so we derive period economia from monthly-comparison). The 12-month
 * window also feeds the chart (sliced to the last 6) and the period rollups.
 */
export function useReports(period: ReportPeriod = 'Mês') {
  return useQuery<Reports>({
    queryKey: [...queryKeys.reports, period],
    queryFn: async () => {
      const month = currentMonth();
      const prev = previousMonth();
      const curRange = monthRange(month);
      const prevRange = monthRange(prev);

      const [byCategory, byBank, monthly, curTx, prevTx] = await Promise.all([
        api.get<ApiReportByCategory[]>('/reports/by-category', { params: { month, type: 'expense' } }),
        api.get<ApiReportByBank[]>('/reports/by-bank', { params: { month } }),
        api.get<ApiMonthlyComparison[]>('/reports/monthly-comparison', { params: { months: 12 } }),
        api.get<ApiTransaction[]>('/transactions', { params: curRange }),
        api.get<ApiTransaction[]>('/transactions', { params: prevRange }),
      ]);

      return {
        economia: economiaForPeriod(monthly.data, PERIOD_MONTHS[period]),
        months: toMonthPoints(monthly.data.slice(-6)),
        spend: toSpendSlices(byCategory.data),
        byBank: toBankSpend(byBank.data),
        behavior: deriveBehavior(curTx.data, prevTx.data),
      };
    },
  });
}

// ── Insight ─────────────────────────────────────────────────────────────────

/** Behavioral insight detail — derived from GET /insights (see transform). */
export function useInsight() {
  return useQuery<InsightDetail>({
    queryKey: queryKeys.insight,
    queryFn: async () => toInsightDetail((await api.get<ApiInsight[]>('/insights')).data),
  });
}

// ── Create transaction ──────────────────────────────────────────────────────

export interface CreateTransactionInput {
  type: TransactionTypeEnum;
  /** positive value in reais (the screen collects cents) */
  value: number;
  categoryId: string;
  bankId: string;
  description?: string;
}

/**
 * Create-transaction mutation. POSTs to /transactions with `transactionDate`
 * set to now (ISO), then invalidates the dashboard + transactions + reports
 * queries so the UI refetches the authoritative state.
 */
export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation<Transaction, unknown, CreateTransactionInput>({
    mutationFn: async (input) => {
      const { data } = await api.post<ApiTransaction>('/transactions', {
        bankId: input.bankId,
        categoryId: input.categoryId,
        amount: input.value,
        type: input.type,
        description: input.description,
        transactionDate: new Date().toISOString(),
      });
      return toTransactions([data])[0];
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard });
      void qc.invalidateQueries({ queryKey: queryKeys.transactions });
      void qc.invalidateQueries({ queryKey: queryKeys.reports });
    },
  });
}
