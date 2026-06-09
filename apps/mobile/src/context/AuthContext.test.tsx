import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';

// Mock the api module (so setAuthFailureHandler/setAuthToken are no-ops) and the
// auth service so we drive login/me without a network.
jest.mock('../services/api', () => ({
  api: { get: jest.fn(), post: jest.fn() },
  setAuthFailureHandler: jest.fn(),
  setAuthToken: jest.fn(),
}));

jest.mock('../services/auth', () => ({
  login: jest.fn(),
  register: jest.fn(),
  me: jest.fn(),
  logout: jest.fn(() => Promise.resolve()),
}));

import { AuthProvider, useAuth } from './AuthContext';
import * as authStorage from '../services/auth-storage';
import * as authService from '../services/auth';

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

const USER = { id: 'u1', name: 'Ana', email: 'ana@wyden.app' };

describe('AuthContext', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await authStorage.clearTokens();
  });

  it('boots to guest when there is no stored token', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('guest'));
    expect(result.current.user).toBeNull();
  });

  it('boots to authed when a stored token validates via /auth/me', async () => {
    await authStorage.saveTokens('access', 'refresh');
    (authService.me as jest.Mock).mockResolvedValue(USER);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('authed'));
    expect(result.current.user).toEqual(USER);
  });

  it('signIn flips status to authed and populates the user', async () => {
    (authService.login as jest.Mock).mockResolvedValue(USER);
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('guest'));

    await act(async () => {
      await result.current.signIn({ email: 'ana@wyden.app', password: 'secret' });
    });

    expect(result.current.status).toBe('authed');
    expect(result.current.user).toEqual(USER);
  });

  it('signOut clears the user back to guest', async () => {
    (authService.login as jest.Mock).mockResolvedValue(USER);
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('guest'));
    await act(async () => {
      await result.current.signIn({ email: 'a', password: 'b' });
    });

    await act(async () => {
      await result.current.signOut();
    });

    expect(result.current.status).toBe('guest');
    expect(result.current.user).toBeNull();
    expect(authService.logout).toHaveBeenCalled();
  });
});
