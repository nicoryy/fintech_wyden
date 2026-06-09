import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock the axios api module so hooks exercise the real transform pipeline
// against deterministic fixtures (no network).
jest.mock('./api', () => {
  const { mockApiGet, mockApiPost } = require('../test-utils/api-fixtures');
  return { api: { get: mockApiGet(), post: mockApiPost() } };
});

import { queryWrapper } from '../test-utils/providers';
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
import { api } from './api';
import { TransactionTypeEnum } from './types';

describe('React Query data hooks (API-backed via mocked axios)', () => {
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

  it('useDashboard composes summary, spend, goal, recent and evolution', async () => {
    const { result } = renderHook(() => useDashboard(), { wrapper: queryWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const d = result.current.data!;
    expect(d.summary.saldo).toBeCloseTo(4350.2);
    expect(d.spend.length).toBe(2);
    expect(d.goal.title).toBe('Reserva de emergência');
    expect(d.recent.length).toBe(2);
    expect(d.evolution.length).toBe(6);
    // amounts are signed: the expense becomes negative
    const expense = d.recent.find((t) => t.id === 'tx1')!;
    expect(expense.amount).toBeCloseTo(-42.9);
  });

  it('useTransactions returns day-grouped transactions with time labels', async () => {
    const { result } = renderHook(() => useTransactions(), { wrapper: queryWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const groups = result.current.data!;
    expect(groups.length).toBeGreaterThanOrEqual(1);
    const all = groups.flatMap((g) => g.items);
    expect(all.every((t) => typeof t.time === 'string')).toBe(true);
  });

  it('useReports composes economia, months, spend, byBank and behavior', async () => {
    const { result } = renderHook(() => useReports(), { wrapper: queryWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const r = result.current.data!;
    expect(r.economia.value).toBeCloseTo(4350.2);
    expect(r.economia.pct).toBe(70); // round(4350.2 / 6250 * 100)
    expect(r.months.length).toBe(6);
    expect(r.byBank.length).toBe(2);
    expect(typeof r.behavior.impulsivity).toBe('string');
  });

  it('useInsight maps the first insight onto the detail shape', async () => {
    const { result } = renderHook(() => useInsight(), { wrapper: queryWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data!.title).toBe('Gasto por impulso');
    expect(result.current.data!.weeklyPattern.length).toBe(7);
  });
});

describe('useCreateTransaction', () => {
  it('POSTs the transaction and invalidates dashboard/transactions/reports', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = jest.spyOn(client, 'invalidateQueries');

    function wrapper({ children }: { children: React.ReactNode }) {
      return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    }

    const { result } = renderHook(() => useCreateTransaction(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        type: TransactionTypeEnum.EXPENSE,
        value: 100,
        categoryId: 'cat-compras',
        bankId: 'bank-nubank',
      });
    });

    // posted to /transactions with a numeric amount + ISO date
    expect(api.post).toHaveBeenCalledWith(
      '/transactions',
      expect.objectContaining({ amount: 100, categoryId: 'cat-compras', bankId: 'bank-nubank' }),
    );
    const invalidatedKeys = invalidateSpy.mock.calls.map((c) => c[0]?.queryKey);
    expect(invalidatedKeys).toContainEqual(queryKeys.dashboard);
    expect(invalidatedKeys).toContainEqual(queryKeys.transactions);
    expect(invalidatedKeys).toContainEqual(queryKeys.reports);
  });
});
