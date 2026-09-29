/**
 * Test providers — wraps components under test with the same context they get
 * at runtime: a fresh React Query client (retries off for determinism) and a
 * SafeAreaProvider seeded with fixed metrics so `useSafeAreaInsets()` resolves
 * headlessly. Used by component/screen specs and as a `renderHook` wrapper.
 */
import React, { type ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  SafeAreaProvider,
  type Metrics,
} from 'react-native-safe-area-context';

import { CatalogProvider } from '../context/CatalogContext';

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
}

export function AllProviders({ children }: { children: ReactNode }) {
  const client = makeQueryClient();
  return (
    <SafeAreaProvider initialMetrics={METRICS}>
      <QueryClientProvider client={client}>
        <CatalogProvider>{children}</CatalogProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

/** render() wrapped in all app providers. */
export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

/** Wrapper for renderHook() — providers only, no SafeArea needed for hooks. */
export function queryWrapper() {
  const client = makeQueryClient();
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}
