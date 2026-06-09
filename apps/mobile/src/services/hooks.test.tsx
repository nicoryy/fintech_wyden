import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { queryWrapper } from '../test-utils/providers';
import {
  queryKeys,
  useDashboard,
  useTransactions,
  useReports,
  useInsight,
  useCreateTransaction,
} from './hooks';
import { DASHBOARD, REPORTS, TX_GROUPS, INSIGHT } from './mock/data';
import { TransactionTypeEnum, type Dashboard } from './types';

describe('React Query data hooks (mock-backed)', () => {
  it('useDashboard resolves the dashboard payload', async () => {
    const { result } = renderHook(() => useDashboard(), { wrapper: queryWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(DASHBOARD);
  });

  it('useTransactions resolves the day-grouped transactions', async () => {
    const { result } = renderHook(() => useTransactions(), { wrapper: queryWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(TX_GROUPS);
  });

  it('useReports resolves the reports payload', async () => {
    const { result } = renderHook(() => useReports(), { wrapper: queryWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(REPORTS);
  });

  it('useInsight resolves the behavioral insight detail', async () => {
    const { result } = renderHook(() => useInsight(), { wrapper: queryWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(INSIGHT);
  });
});

describe('useCreateTransaction', () => {
  it('optimistically updates the cached dashboard summary on an expense', async () => {
    // Pre-seed the dashboard cache, then read it back after the mutation so the
    // assertion is deterministic (no reliance on two render trees sharing state).
    // gcTime: Infinity keeps the seeded entry alive without an active observer.
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: Infinity } },
    });
    client.setQueryData<Dashboard>(queryKeys.dashboard, DASHBOARD);

    function wrapper({ children }: { children: React.ReactNode }) {
      return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    }

    const { result } = renderHook(() => useCreateTransaction(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        type: TransactionTypeEnum.EXPENSE,
        value: 100,
        categoryId: 'compras',
        bankId: 'nubank',
      });
    });

    const updated = client.getQueryData<Dashboard>(queryKeys.dashboard)!;
    expect(updated.summary.despesas).toBeCloseTo(DASHBOARD.summary.despesas + 100);
    // saldo recomputed from receitas - despesas
    expect(updated.summary.saldo).toBeCloseTo(
      updated.summary.receitas - updated.summary.despesas,
    );
  });
});
