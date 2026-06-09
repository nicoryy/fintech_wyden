/**
 * React Query data hooks.
 *
 * ── MOCK → API SWAP POINT ────────────────────────────────────────────────────
 * Each `queryFn` currently returns `Promise.resolve(<mock>)`. To go live against
 * the NestJS backend, replace the body of the relevant `queryFn` with an axios
 * call, e.g.:
 *
 *   queryFn: async () => (await api.get<Dashboard>('/reports/dashboard')).data
 *
 * The component layer never changes — it only consumes these hooks. Keep the
 * return *shape* identical to the mock so the UI keeps working.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { DASHBOARD, INSIGHT, REPORTS, TX_GROUPS } from './mock/data';
import {
  TransactionTypeEnum,
  type Dashboard,
  type InsightDetail,
  type Reports,
  type TransactionGroup,
} from './types';

/** Simulate network latency so loading states are exercised in dev. */
function resolve<T>(data: T, ms = 0): Promise<T> {
  return ms > 0
    ? new Promise((r) => setTimeout(() => r(data), ms))
    : Promise.resolve(data);
}

export const queryKeys = {
  dashboard: ['dashboard'] as const,
  transactions: ['transactions'] as const,
  reports: ['reports'] as const,
  insight: ['insight'] as const,
};

/** Dashboard / Início payload. */
export function useDashboard() {
  return useQuery<Dashboard>({
    queryKey: queryKeys.dashboard,
    // SWAP: api.get('/reports/dashboard')
    queryFn: () => resolve(DASHBOARD),
  });
}

/** Transactions grouped by day. */
export function useTransactions() {
  return useQuery<TransactionGroup[]>({
    queryKey: queryKeys.transactions,
    // SWAP: api.get('/transactions') then group by day client- or server-side
    queryFn: () => resolve(TX_GROUPS),
  });
}

/** Reports payload. */
export function useReports() {
  return useQuery<Reports>({
    queryKey: queryKeys.reports,
    // SWAP: combine /reports/summary, /by-category, /by-bank, /monthly-comparison
    queryFn: () => resolve(REPORTS),
  });
}

/** Behavioral insight detail. */
export function useInsight() {
  return useQuery<InsightDetail>({
    queryKey: queryKeys.insight,
    // SWAP: api.get('/insights/:id')
    queryFn: () => resolve(INSIGHT),
  });
}

export interface CreateTransactionInput {
  type: TransactionTypeEnum;
  /** positive value in reais (the screen collects cents) */
  value: number;
  categoryId: string;
  bankId: string;
  description?: string;
}

/**
 * Create-transaction mutation. Today it optimistically nudges the cached
 * dashboard summary so the UI reflects the new entry; later it POSTs to the API
 * and invalidates the affected queries.
 */
export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    // SWAP: api.post('/transactions', payload)
    mutationFn: (input: CreateTransactionInput) => resolve(input),
    onSuccess: (input) => {
      qc.setQueryData<Dashboard>(queryKeys.dashboard, (prev) => {
        if (!prev) return prev;
        const receitas =
          input.type === TransactionTypeEnum.INCOME
            ? prev.summary.receitas + input.value
            : prev.summary.receitas;
        const despesas =
          input.type === TransactionTypeEnum.EXPENSE
            ? prev.summary.despesas + input.value
            : prev.summary.despesas;
        return {
          ...prev,
          summary: { receitas, despesas, saldo: receitas - despesas },
        };
      });
    },
  });
}
