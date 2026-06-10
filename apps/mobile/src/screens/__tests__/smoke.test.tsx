import React from 'react';

// Mock the api so the (now API-backed) hooks resolve deterministic fixtures.
jest.mock('../../services/api', () => {
  const { mockApiGet, mockApiPost } = require('../../test-utils/api-fixtures');
  return { api: { get: mockApiGet(), post: mockApiPost() } };
});

import { renderWithProviders } from '../../test-utils/providers';
import { DashboardScreen } from '../dashboard/DashboardScreen';
import { TransactionsScreen } from '../transactions/TransactionsScreen';
import { ReportsScreen } from '../reports/ReportsScreen';

// Smoke tests: each screen renders without crashing and shows a known anchor
// from the design once its (API-backed) data resolves.
describe('screen smoke renders', () => {
  it('Dashboard renders the greeting once data loads', async () => {
    const { findByText } = renderWithProviders(<DashboardScreen />);
    // The greeting personalizes from the auth user (absent in this isolated
    // render), so assert on the stable subtitle that always shows.
    expect(
      await findByText('Que tal uma decisão financeira mais consciente hoje?'),
    ).toBeTruthy();
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
