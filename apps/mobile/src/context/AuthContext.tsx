/**
 * AuthContext — holds the authenticated user and session status, and exposes
 * sign-in / sign-up / sign-out. On mount it reads any stored access token and
 * validates it with `GET /auth/me`; a 401 there (or anywhere) clears the
 * session via the api's auth-failure handler.
 *
 * status: 'loading' (checking storage) → 'authed' | 'guest'.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { setAuthFailureHandler, setAuthToken } from '../services/api';
import { getAccessToken } from '../services/auth-storage';
import * as authService from '../services/auth';
import type { ApiUser } from '../services/api-types';

export type AuthStatus = 'loading' | 'authed' | 'guest';

interface AuthContextValue {
  user: ApiUser | null;
  status: AuthStatus;
  signIn: (creds: authService.Credentials) => Promise<void>;
  signUp: (input: authService.RegisterInput) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const mounted = useRef(true);

  const reset = useCallback(() => {
    setUser(null);
    setStatus('guest');
  }, []);

  // Let a failed token refresh (inside the axios interceptor) drive a logout.
  useEffect(() => {
    setAuthFailureHandler(() => {
      if (mounted.current) reset();
    });
    return () => setAuthFailureHandler(null);
  }, [reset]);

  // Bootstrap: validate any stored token against /auth/me.
  useEffect(() => {
    mounted.current = true;
    (async () => {
      const token = await getAccessToken();
      if (!token) {
        if (mounted.current) reset();
        return;
      }
      setAuthToken(token);
      try {
        const profile = await authService.me();
        if (mounted.current) {
          setUser(profile);
          setStatus('authed');
        }
      } catch {
        // invalid/expired session (refresh already attempted by interceptor)
        await authService.logout();
        if (mounted.current) reset();
      }
    })();
    return () => {
      mounted.current = false;
    };
  }, [reset]);

  const signIn = useCallback(async (creds: authService.Credentials) => {
    const profile = await authService.login(creds);
    setUser(profile);
    setStatus('authed');
  }, []);

  const signUp = useCallback(async (input: authService.RegisterInput) => {
    await authService.register(input);
    const profile = await authService.login({ email: input.email, password: input.password });
    setUser(profile);
    setStatus('authed');
  }, []);

  const signOut = useCallback(async () => {
    await authService.logout();
    reset();
  }, [reset]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, signIn, signUp, signOut }),
    [user, status, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
