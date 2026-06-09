import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';

// Mock the api so the catalog (categories/banks) resolves from fixtures.
jest.mock('../../services/api', () => {
  const { mockApiGet, mockApiPost } = require('../../test-utils/api-fixtures');
  return { api: { get: mockApiGet(), post: mockApiPost() } };
});

import { AddTransactionScreen } from './AddTransactionScreen';
import { renderWithProviders } from '../../test-utils/providers';
import { api } from '../../services/api';

// Render then wait for the CatalogProvider's React Query calls (categories +
// banks) to settle, so late state updates land inside act() — avoids the React
// "update not wrapped in act(...)" warning from queries resolving post-assert.
async function renderScreen() {
  const utils = renderWithProviders(<AddTransactionScreen />);
  await waitFor(() => {
    expect(api.get).toHaveBeenCalledWith('/categories');
    expect(api.get).toHaveBeenCalledWith('/banks');
  });
  await waitFor(() => expect(utils.getByText('Compras')).toBeTruthy());
  return utils;
}

describe('AddTransactionScreen', () => {
  it('starts on the expense tab', async () => {
    const { getByText } = await renderScreen();
    expect(getByText('VALOR GASTO')).toBeTruthy();
    expect(getByText('Adicionar despesa')).toBeTruthy();
  });

  it('switches to income via the segmented control', async () => {
    const { getByText } = await renderScreen();
    fireEvent.press(getByText('Receita'));
    expect(getByText('VALOR RECEBIDO')).toBeTruthy();
    expect(getByText('Adicionar receita')).toBeTruthy();
  });

  describe('numeric keypad (cents model)', () => {
    it('accumulates digits into the displayed amount', async () => {
      const { getByLabelText, getByText } = await renderScreen();
      fireEvent.press(getByLabelText('5')); // cents = 5 -> 0,05
      expect(getByText(',05')).toBeTruthy();
      fireEvent.press(getByLabelText('0')); // cents = 50 -> 0,50
      expect(getByText(',50')).toBeTruthy();
    });

    it('removes the last digit with the delete key', async () => {
      const { getByLabelText, getByText } = await renderScreen();
      fireEvent.press(getByLabelText('5'));
      fireEvent.press(getByLabelText('0')); // 0,50
      fireEvent.press(getByLabelText('Apagar')); // back to 0,05
      expect(getByText(',05')).toBeTruthy();
    });
  });

  it('resets the selected category when switching type', async () => {
    // Compras is an expense category; after switching to Receita it should be
    // gone from the tree (income has a different category set).
    const { getByText, queryByText } = await renderScreen();
    expect(getByText('Compras')).toBeTruthy();
    fireEvent.press(getByText('Receita'));
    expect(queryByText('Compras')).toBeNull();
    expect(getByText('Salário')).toBeTruthy();
  });
});
