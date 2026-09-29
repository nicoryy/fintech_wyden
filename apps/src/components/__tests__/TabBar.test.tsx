import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import type { BottomTabBarProps } from 'expo-router/js-tabs';

import { TabBar } from '../TabBar';
import { renderWithProviders } from '../../test-utils/providers';

declare const global: { __expoRouterMock?: { push: jest.Mock } };

function makeProps(activeIndex = 0): BottomTabBarProps {
  const routes = [
    { key: 'index', name: 'index' },
    { key: 'transactions', name: 'transactions' },
    { key: 'reports', name: 'reports' },
    { key: 'profile', name: 'profile' },
  ];
  return {
    state: { index: activeIndex, routes },
    navigation: { navigate: jest.fn() },
    descriptors: {},
    insets: { top: 0, right: 0, bottom: 0, left: 0 },
  } as unknown as BottomTabBarProps;
}

describe('TabBar', () => {
  it('renders the four tab labels plus the add FAB', () => {
    const { getByLabelText } = renderWithProviders(<TabBar {...makeProps()} />);
    ['Início', 'Transações', 'Relatórios', 'Perfil', 'Adicionar transação'].forEach(
      (label) => expect(getByLabelText(label)).toBeTruthy(),
    );
  });

  it('navigates to the tapped tab route', () => {
    const props = makeProps();
    const { getByLabelText } = renderWithProviders(<TabBar {...props} />);
    fireEvent.press(getByLabelText('Relatórios'));
    expect(props.navigation.navigate).toHaveBeenCalledWith('reports');
  });

  it('pushes the add-transaction modal when the FAB is pressed', () => {
    const { getByLabelText } = renderWithProviders(<TabBar {...makeProps()} />);
    fireEvent.press(getByLabelText('Adicionar transação'));
    expect(global.__expoRouterMock?.push).toHaveBeenCalledWith('/transaction/add');
  });

  it('marks the active tab as selected', () => {
    const { getByLabelText } = renderWithProviders(<TabBar {...makeProps(1)} />);
    expect(getByLabelText('Transações').props.accessibilityState).toMatchObject({
      selected: true,
    });
  });
});
