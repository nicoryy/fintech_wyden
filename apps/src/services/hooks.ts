/**
 * React Query data hooks — backed by the on-device SQLite database in
 * `src/data` (see the root CLAUDE.md for why there's no server anymore).
 *
 * Each hook reads raw records via `src/data/*` and runs them through the pure
 * transforms/aggregations in `transform.ts` / `data/reports.ts` to produce the
 * UI domain shapes the screens consume. Query *keys* and return *types* are
 * unchanged from the old API-backed version, so the component layer didn't
 * need to change for the migration off Postgres.
 *
 * Composite hooks (`useDashboard`, `useReports`) load one range of
 * transactions and derive everything else from it in memory — a local
 * simplification the old per-month REST endpoints couldn't afford.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { buildBackup, parseBackup, restoreBackup, resetAll } from '../data/backup';
import { listBanks, listCategories } from '../data/catalog';
import { listGoals } from '../data/goals';
import { getProfile, saveName } from '../data/profile';
import { monthlyComparison, summarize, totalsByBank, totalsByCategory } from '../data/reports';
import { createTransaction, listRecentTransactions, listTransactions } from '../data/transactions';
import { currentMonth, lastNMonthsBounds, monthBounds, previousMonth } from '../utils/months';
import { pickBackupText, shareBackup } from './backup-file';
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
import {
  TransactionTypeEnum,
  type Bank,
  type Category,
  type Dashboard,
  type InsightDetail,
  type Profile,
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
  profile: ['profile'] as const,
};

export { currentMonth };

// ── Catalog (categories + banks) ────────────────────────────────────────────

export function useCategories(options: { enabled?: boolean } = {}) {
  return useQuery<Category[]>({
    queryKey: queryKeys.categories,
    queryFn: async () => toCategories(await listCategories()),
    staleTime: 5 * 60_000,
    enabled: options.enabled ?? true,
  });
}

export function useBanks(options: { enabled?: boolean } = {}) {
  return useQuery<Bank[]>({
    queryKey: queryKeys.banks,
    queryFn: async () => toBanks(await listBanks()),
    staleTime: 5 * 60_000,
    enabled: options.enabled ?? true,
  });
}

// ── Profile (onboarding name) ───────────────────────────────────────────────

export function useProfile() {
  return useQuery<Profile>({
    queryKey: queryKeys.profile,
    queryFn: getProfile,
  });
}

export function useSaveName() {
  const qc = useQueryClient();
  return useMutation<void, unknown, string>({
    mutationFn: (name) => saveName(name),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.profile }),
  });
}

// ── Dashboard ───────────────────────────────────────────────────────────────

/** Dashboard / Início payload — one 6-month transaction read, aggregated locally. */
export function useDashboard() {
  return useQuery<Dashboard>({
    queryKey: queryKeys.dashboard,
    queryFn: async () => {
      const month = currentMonth();
      const sixMonths = lastNMonthsBounds(month, 6);
      const [sixMonthTxs, recentRaw, goals] = await Promise.all([
        listTransactions(sixMonths),
        listRecentTransactions(10),
        listGoals(),
      ]);

      const curBounds = monthBounds(month);
      const currentMonthTxs = sixMonthTxs.filter((t) => t.occurredAt >= curBounds.from && t.occurredAt < curBounds.to);
      const summary = summarize(currentMonthTxs);
      const monthly = monthlyComparison(sixMonthTxs, 6);

      return {
        summary: {
          receitas: summary.receitasCents / 100,
          despesas: summary.despesasCents / 100,
          saldo: summary.saldoCents / 100,
        },
        evolution: deriveEvolution(monthly),
        deltaSaldo: deriveSaldoDelta(monthly),
        spend: toSpendSlices(totalsByCategory(currentMonthTxs, TransactionTypeEnum.EXPENSE)),
        goal: goals[0] ? toGoal(goals[0]) : placeholderGoal(),
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
    queryFn: async () => groupByDay(await listTransactions(monthBounds(month))),
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
 * Reports payload — one 12-month transaction read, aggregated locally for
 * whichever `period` is selected. The old API needed one request per month
 * per breakdown (see git history); with the data on-device, `spend`/`byBank`
 * just filter the same 12-month set to the period's own window.
 */
export function useReports(period: ReportPeriod = 'Mês') {
  return useQuery<Reports>({
    queryKey: [...queryKeys.reports, period],
    queryFn: async () => {
      const month = currentMonth();
      const prev = previousMonth();
      const twelveMonths = lastNMonthsBounds(month, 12);
      const txs = await listTransactions(twelveMonths);

      const monthly = monthlyComparison(txs, 12);
      const periodBounds = lastNMonthsBounds(month, PERIOD_MONTHS[period]);
      const periodTxs = txs.filter((t) => t.occurredAt >= periodBounds.from && t.occurredAt < periodBounds.to);

      const curBounds = monthBounds(month);
      const prevBounds = monthBounds(prev);
      const curTx = txs.filter((t) => t.occurredAt >= curBounds.from && t.occurredAt < curBounds.to);
      const prevTx = txs.filter((t) => t.occurredAt >= prevBounds.from && t.occurredAt < prevBounds.to);

      return {
        economia: economiaForPeriod(monthly, PERIOD_MONTHS[period]),
        months: toMonthPoints(monthly.slice(-6)),
        spend: toSpendSlices(totalsByCategory(periodTxs, TransactionTypeEnum.EXPENSE)),
        byBank: toBankSpend(totalsByBank(periodTxs)),
        behavior: deriveBehavior(curTx, prevTx),
      };
    },
  });
}

// ── Insight ─────────────────────────────────────────────────────────────────

/**
 * Behavioral insight detail. No local insights engine exists yet (Phase 2 —
 * see the root CLAUDE.md roadmap); this preserves the old API's honest
 * behavior (`GET /insights` always returned `[]`) rather than fabricating one.
 */
export function useInsight() {
  return useQuery<InsightDetail>({
    queryKey: queryKeys.insight,
    queryFn: async () => toInsightDetail([]),
  });
}

// ── Create transaction ──────────────────────────────────────────────────────

export interface CreateTransactionInput {
  type: TransactionTypeEnum;
  amountCents: number;
  categoryId: string;
  bankId: string;
  description?: string;
}

/**
 * Create-transaction mutation. Writes to SQLite with `occurredAt = now`, then
 * invalidates every query a new transaction can affect: the dashboard, the
 * transaction list, reports, bank balances (computed from transactions — see
 * `data/catalog.ts`) and the insight (a regression fix versus the old API
 * hook, which never invalidated `banks`, leaving Profile balances stale).
 */
export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation<Transaction, unknown, CreateTransactionInput>({
    mutationFn: async (input) => {
      const record = await createTransaction({
        bankId: input.bankId,
        categoryId: input.categoryId,
        amountCents: input.amountCents,
        type: input.type,
        description: input.description,
      });
      return toTransactions([record])[0];
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard });
      void qc.invalidateQueries({ queryKey: queryKeys.transactions });
      void qc.invalidateQueries({ queryKey: queryKeys.reports });
      void qc.invalidateQueries({ queryKey: queryKeys.banks });
      void qc.invalidateQueries({ queryKey: queryKeys.insight });
    },
  });
}

// ── Backup ──────────────────────────────────────────────────────────────────

/** Builds the full JSON backup and opens the system share sheet for it. */
export function useExportBackup() {
  return useMutation<void, unknown, void>({
    mutationFn: async () => {
      const backup = await buildBackup();
      await shareBackup(JSON.stringify(backup, null, 2));
    },
  });
}

export type ImportBackupResult = 'imported' | 'canceled';

/** Opens the document picker and, unless canceled, replaces all local data. */
export function useImportBackup() {
  const qc = useQueryClient();
  return useMutation<ImportBackupResult, unknown, void>({
    mutationFn: async () => {
      const text = await pickBackupText();
      if (text === null) return 'canceled';
      await restoreBackup(parseBackup(text));
      return 'imported';
    },
    onSuccess: (result) => {
      if (result === 'imported') void qc.invalidateQueries();
    },
  });
}

/** Wipes all local data and reseeds the defaults (used by "Apagar todos os dados"). */
export function useResetData() {
  const qc = useQueryClient();
  return useMutation<void, unknown, void>({
    mutationFn: resetAll,
    onSuccess: () => void qc.invalidateQueries(),
  });
}
