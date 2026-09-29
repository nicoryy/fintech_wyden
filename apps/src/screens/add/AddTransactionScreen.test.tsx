import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';

import { setupTestDb } from '../../test-utils/test-db';
import { renderWithProviders } from '../../test-utils/providers';
import { DataError } from '../../data/errors';

// Spy on the real `createTransaction` so most tests exercise the actual write
// path against the in-memory test database, while the failure test below can
// still force a rejection deterministically.
jest.mock('../../data/transactions', () => {
  const actual = jest.requireActual('../../data/transactions');
  return { ...actual, createTransaction: jest.fn(actual.createTransaction) };
});

import { AddTransactionScreen } from './AddTransactionScreen';
import { createTransaction } from '../../data/transactions';

setupTestDb();

// Render then wait for the seeded catalog (categories/banks) to resolve, so
// late state updates land inside act() — avoids the React "update not
// wrapped in act(...)" warning from queries resolving post-assert.
async function renderScreen() {
  const utils = renderWithProviders(<AddTransactionScreen />);
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
  // regardless of whether the write actually succeeded.
  describe('save (real mutation outcome, not optimistic)', () => {
    const fillValidForm = (utils: Awaited<ReturnType<typeof renderScreen>>) => {
      fireEvent.press(utils.getByText('Compras'));
      fireEvent.changeText(utils.getByLabelText('Valor'), '500');
    };

    it('does not show the success overlay until the write actually resolves', async () => {
      const utils = await renderScreen();
      fillValidForm(utils);

      fireEvent.press(utils.getByText('Adicionar despesa'));
      // Not shown synchronously on press — only once the write resolves.
      expect(utils.queryByText('Despesa registrada!')).toBeNull();

      await waitFor(() => expect(utils.getByText('Despesa registrada!')).toBeTruthy());
    });

    it('shows a pending state and ignores a second press before the first write resolves', async () => {
      const utils = await renderScreen();
      fillValidForm(utils);
      (createTransaction as jest.Mock).mockClear();

      fireEvent.press(utils.getByText('Adicionar despesa'));
      expect(utils.getByText('Salvando…')).toBeTruthy();
      // Second press while still pending — must not fire another submit.
      fireEvent.press(utils.getByText('Salvando…'));

      await waitFor(() => expect(utils.getByText('Despesa registrada!')).toBeTruthy());
      expect(createTransaction).toHaveBeenCalledTimes(1);
    });

    it('surfaces the data error and never shows the success overlay when the write fails', async () => {
      (createTransaction as jest.Mock).mockRejectedValueOnce(new DataError('Conta não encontrada.'));
      const utils = await renderScreen();
      fillValidForm(utils);

      fireEvent.press(utils.getByText('Adicionar despesa'));

      await waitFor(() => expect(utils.getByText('Conta não encontrada.')).toBeTruthy());
      expect(utils.queryByText('Despesa registrada!')).toBeNull();
      // The button is interactive again — not left stuck in a pending state.
      expect(utils.getByText('Adicionar despesa')).toBeTruthy();
    });
  });
});
