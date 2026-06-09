import React from 'react';
import { fireEvent } from '@testing-library/react-native';

import { AddTransactionScreen } from './AddTransactionScreen';
import { renderWithProviders } from '../../test-utils/providers';

describe('AddTransactionScreen', () => {
  it('starts on the expense tab', () => {
    const { getByText } = renderWithProviders(<AddTransactionScreen />);
    expect(getByText('VALOR GASTO')).toBeTruthy();
    expect(getByText('Adicionar despesa')).toBeTruthy();
  });

  it('switches to income via the segmented control', () => {
    const { getByText } = renderWithProviders(<AddTransactionScreen />);
    fireEvent.press(getByText('Receita'));
    expect(getByText('VALOR RECEBIDO')).toBeTruthy();
    expect(getByText('Adicionar receita')).toBeTruthy();
  });

  describe('numeric keypad (cents model)', () => {
    it('accumulates digits into the displayed amount', () => {
      const { getByLabelText, getByText } = renderWithProviders(<AddTransactionScreen />);
      fireEvent.press(getByLabelText('5')); // cents = 5 -> 0,05
      expect(getByText(',05')).toBeTruthy();
      fireEvent.press(getByLabelText('0')); // cents = 50 -> 0,50
      expect(getByText(',50')).toBeTruthy();
    });

    it('removes the last digit with the delete key', () => {
      const { getByLabelText, getByText } = renderWithProviders(<AddTransactionScreen />);
      fireEvent.press(getByLabelText('5'));
      fireEvent.press(getByLabelText('0')); // 0,50
      fireEvent.press(getByLabelText('Apagar')); // back to 0,05
      expect(getByText(',05')).toBeTruthy();
    });
  });

  it('resets the selected category when switching type', () => {
    // Compras is an expense category; after switching to Receita it should be
    // gone from the tree (income has a different category set).
    const { getByText, queryByText } = renderWithProviders(<AddTransactionScreen />);
    expect(getByText('Compras')).toBeTruthy();
    fireEvent.press(getByText('Receita'));
    expect(queryByText('Compras')).toBeNull();
    expect(getByText('Salário')).toBeTruthy();
  });
});
