import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';

import { setupTestDb } from '../../test-utils/test-db';
import { renderWithProviders } from '../../test-utils/providers';
import { getProfile } from '../../data/profile';
import { WelcomeScreen } from './WelcomeScreen';

setupTestDb();

describe('WelcomeScreen', () => {
  it('renders the onboarding copy — no login, no cloud', () => {
    const { getByText } = renderWithProviders(<WelcomeScreen />);
    expect(getByText('Como podemos te chamar?')).toBeTruthy();
    expect(getByText(/sem conta, sem nuvem, sem login/i)).toBeTruthy();
  });

  it('shows a validation error for an empty name', async () => {
    const { getByLabelText, findByText } = renderWithProviders(<WelcomeScreen />);
    fireEvent.press(getByLabelText('Começar'));
    expect(await findByText('Informe um nome')).toBeTruthy();
  });

  it('saves the trimmed name on submit', async () => {
    const { getByPlaceholderText, getByLabelText } = renderWithProviders(<WelcomeScreen />);
    fireEvent.changeText(getByPlaceholderText('Como podemos te chamar?'), '  Ana Lima  ');
    fireEvent.press(getByLabelText('Começar'));

    await waitFor(async () => {
      expect((await getProfile()).name).toBe('Ana Lima');
    });
  });
});
