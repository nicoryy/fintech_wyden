import React from 'react';

import { setupTestDb } from '../../test-utils/test-db';
import { renderWithProviders } from '../../test-utils/providers';
import { DashboardScreen } from '../dashboard/DashboardScreen';
import { TransactionsScreen } from '../transactions/TransactionsScreen';
import { ReportsScreen } from '../reports/ReportsScreen';

setupTestDb();

// Smoke tests: each screen renders without crashing and shows a known anchor
// from the design once its (SQLite-backed) data resolves.
describe('screen smoke renders', () => {
  it('Dashboard renders the greeting once data loads', async () => {
    const { findByText } = renderWithProviders(<DashboardScreen />);
    // The greeting personalizes from the local profile name (absent in this
    // isolated render), so assert on the stable subtitle that always shows.
    expect(await findByText('Que tal uma decisão financeira mais consciente hoje?')).toBeTruthy();
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
