import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import { setupTestDb } from '../test-utils/test-db';
import { queryWrapper } from '../test-utils/providers';
import { FIXTURE_IFOOD_CENTS, FIXTURE_SALARY_CENTS, seedCurrentMonthFixtures } from '../test-utils/fixtures';
import {
  queryKeys,
  useDashboard,
  useTransactions,
  useReports,
  useInsight,
  useCategories,
  useBanks,
  useCreateTransaction,
} from './hooks';
import { TransactionTypeEnum } from './types';

setupTestDb();

function mutationWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return { client, Wrapper: ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  ) };
}

describe('React Query data hooks (SQLite-backed)', () => {
  it('useCategories maps name→label and keeps icon/color/type', async () => {
    const { result } = renderHook(() => useCategories(), { wrapper: queryWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const compras = result.current.data!.find((c) => c.label === 'Compras')!;
    expect(compras).toMatchObject({ label: 'Compras', icon: 'bag', color: '#22B07D' });
  });

  it('useBanks derives ink and cash flags', async () => {
    const { result } = renderHook(() => useBanks(), { wrapper: queryWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const bb = result.current.data!.find((b) => b.label === 'Banco do Brasil')!;
    const cash = result.current.data!.find((b) => b.label === 'Dinheiro')!;
    expect(bb.ink).toBe('#1B1D21'); // light yellow tile → dark ink
    expect(cash.cash).toBe(true);
  });

  it('useDashboard composes summary, spend, goal, recent and evolution from local transactions', async () => {
    await seedCurrentMonthFixtures();
    const { result } = renderHook(() => useDashboard(), { wrapper: queryWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const d = result.current.data!;
    expect(d.summary.saldo).toBeCloseTo((FIXTURE_SALARY_CENTS - FIXTURE_IFOOD_CENTS) / 100);
    expect(d.spend).toEqual([{ categoryId: 'alimentacao', value: FIXTURE_IFOOD_CENTS / 100, pct: 100 }]);
    expect(d.goal.title).toBe('Reserva de emergência'); // no goals yet -> placeholder
    expect(d.recent).toHaveLength(2);
    expect(d.evolution.length).toBe(6);
    const expense = d.recent.find((t) => t.description === 'iFood')!;
    expect(expense.amount).toBeCloseTo(-FIXTURE_IFOOD_CENTS / 100);
  });

  it('useTransactions returns day-grouped transactions with time labels', async () => {
    await seedCurrentMonthFixtures();
    const { result } = renderHook(() => useTransactions(), { wrapper: queryWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const groups = result.current.data!;
    const all = groups.flatMap((g) => g.items);
    expect(all).toHaveLength(2);
    expect(all.every((t) => typeof t.time === 'string')).toBe(true);
  });

  it('useReports composes economia, months, spend, byBank and behavior from local transactions', async () => {
    await seedCurrentMonthFixtures();
    const { result } = renderHook(() => useReports('Mês'), { wrapper: queryWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const r = result.current.data!;
    expect(r.economia.value).toBeCloseTo((FIXTURE_SALARY_CENTS - FIXTURE_IFOOD_CENTS) / 100);
    expect(r.months.length).toBe(6);
    expect(r.byBank).toEqual([{ bankId: 'nubank', value: FIXTURE_IFOOD_CENTS / 100 }]);
    // Only this month has any activity so far, so there's nothing to compare it
    // against yet — the honest "—" placeholder, not a fabricated delta.
    expect(r.behavior).toEqual({ impulsivity: '—', consistency: '—' });
  });

  it('useInsight is honest about there being no local insights engine yet', async () => {
    const { result } = renderHook(() => useInsight(), { wrapper: queryWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data!.title).toBe('Sem insights ainda');
    expect(result.current.data!.weeklyPattern).toBeUndefined();
  });
});

describe('useCreateTransaction', () => {
  it('writes the transaction and invalidates dashboard/transactions/reports/banks/insight', async () => {
    const { client, Wrapper } = mutationWrapper();
    const invalidateSpy = jest.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(() => useCreateTransaction(), { wrapper: Wrapper });

    let created!: Awaited<ReturnType<typeof result.current.mutateAsync>>;
    await act(async () => {
      created = await result.current.mutateAsync({
        type: TransactionTypeEnum.EXPENSE,
        amountCents: 10_000,
        categoryId: 'compras',
        bankId: 'nubank',
      });
    });

    expect(created.amount).toBeCloseTo(-100);
    const invalidatedKeys = invalidateSpy.mock.calls.map((c) => c[0]?.queryKey);
    expect(invalidatedKeys).toContainEqual(queryKeys.dashboard);
    expect(invalidatedKeys).toContainEqual(queryKeys.transactions);
    expect(invalidatedKeys).toContainEqual(queryKeys.reports);
    expect(invalidatedKeys).toContainEqual(queryKeys.banks);
    expect(invalidatedKeys).toContainEqual(queryKeys.insight);
  });

  it('rejects an unknown bank with a user-facing message', async () => {
    const { Wrapper } = mutationWrapper();
    const { result } = renderHook(() => useCreateTransaction(), { wrapper: Wrapper });

    await expect(
      act(() =>
        result.current.mutateAsync({
          type: TransactionTypeEnum.EXPENSE,
          amountCents: 1000,
          categoryId: 'compras',
          bankId: 'does-not-exist',
        }),
      ),
    ).rejects.toThrow('Conta não encontrada.');
  });
});
