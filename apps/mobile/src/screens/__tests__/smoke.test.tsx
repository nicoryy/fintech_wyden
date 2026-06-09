import React from 'react';

import { renderWithProviders } from '../../test-utils/providers';
import { DashboardScreen } from '../dashboard/DashboardScreen';
import { TransactionsScreen } from '../transactions/TransactionsScreen';
import { ReportsScreen } from '../reports/ReportsScreen';

// Smoke tests: each screen renders without crashing and shows a known anchor
// from the design once its (mock-backed) data resolves.
describe('screen smoke renders', () => {
  it('Dashboard renders the greeting once data loads', async () => {
    const { findByText } = renderWithProviders(<DashboardScreen />);
    expect(await findByText(/Olá, Ana!/)).toBeTruthy();
  });

  it('Transações renders its title', async () => {
    const { findByText } = renderWithProviders(<TransactionsScreen />);
    expect(await findByText('Transações')).toBeTruthy();
  });

  it('Relatórios renders its title', async () => {
    const { findByText } = renderWithProviders(<ReportsScreen />);
    expect(await findByText('Relatórios')).toBeTruthy();
  });
});
