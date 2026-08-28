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

  describe('amount entry (native keyboard, cents model)', () => {
    it('interprets typed digits as cents', async () => {
      const { getByLabelText, getByDisplayValue } = await renderScreen();
      fireEvent.changeText(getByLabelText('Valor'), '5'); // -> 0,05
      expect(getByDisplayValue('0,05')).toBeTruthy();
      fireEvent.changeText(getByLabelText('Valor'), '50'); // -> 0,50
      expect(getByDisplayValue('0,50')).toBeTruthy();
    });

    it('strips non-digits and clears back to zero when emptied', async () => {
      const { getByLabelText, getByDisplayValue } = await renderScreen();
      fireEvent.changeText(getByLabelText('Valor'), 'R$ 12,5'); // digits "125" -> 1,25
      expect(getByDisplayValue('1,25')).toBeTruthy();
      fireEvent.changeText(getByLabelText('Valor'), ''); // back to 0,00
      expect(getByDisplayValue('0,00')).toBeTruthy();
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

  // Regression coverage for the optimistic-success bug: the overlay used to
  // appear (and the sheet auto-close) as soon as save() was pressed,
  // regardless of whether the POST actually succeeded.
  describe('save (real mutation outcome, not optimistic)', () => {
    const fillValidForm = (utils: Awaited<ReturnType<typeof renderScreen>>) => {
      fireEvent.press(utils.getByText('Compras'));
      fireEvent.changeText(utils.getByLabelText('Valor'), '500');
    };

    it('does not show the success overlay until the mutation actually resolves', async () => {
      const utils = await renderScreen();
      fillValidForm(utils);

      fireEvent.press(utils.getByText('Adicionar despesa'));
      // Not shown synchronously on press — only once the request resolves.
      expect(utils.queryByText('Despesa registrada!')).toBeNull();

      await waitFor(() =>
        expect(utils.getByText('Despesa registrada!')).toBeTruthy(),
      );
    });

    it('shows a pending state and ignores a second press before the first request resolves', async () => {
      const utils = await renderScreen();
      fillValidForm(utils);
      // api.post's call history carries over from earlier tests in this file
      // (the module mock is built once, not per-test) — clear it so the
      // count below reflects only this test's presses.
      (api.post as jest.Mock).mockClear();

      fireEvent.press(utils.getByText('Adicionar despesa'));
      expect(utils.getByText('Salvando…')).toBeTruthy();
      // Second press while still pending — must not fire another submit.
      fireEvent.press(utils.getByText('Salvando…'));

      await waitFor(() =>
        expect(utils.getByText('Despesa registrada!')).toBeTruthy(),
      );
      expect(
        (api.post as jest.Mock).mock.calls.filter(([url]) => url === '/transactions'),
      ).toHaveLength(1);
    });

    it('surfaces the API error and never shows the success overlay when the request fails', async () => {
      (api.post as jest.Mock).mockRejectedValueOnce({
        isAxiosError: true,
        response: { data: { message: 'Bank not found' } },
      });
      const utils = await renderScreen();
      fillValidForm(utils);

      fireEvent.press(utils.getByText('Adicionar despesa'));

      await waitFor(() => expect(utils.getByText('Bank not found')).toBeTruthy());
      expect(utils.queryByText('Despesa registrada!')).toBeNull();
      // The button is interactive again — not left stuck in a pending state.
      expect(utils.getByText('Adicionar despesa')).toBeTruthy();
    });
  });
});
