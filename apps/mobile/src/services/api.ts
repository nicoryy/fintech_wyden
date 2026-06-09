/**
 * Axios instance + auth interceptors for the live NestJS backend.
 *
 * Base URL resolution order:
 *   1. `extra.apiUrl` in app.json (via expo-constants)
 *   2. `EXPO_PUBLIC_API_URL` env var
 *   3. local dev fallback `http://localhost:3000/api/v1`
 *
 * NOTE (Android emulator): `localhost` inside the emulator points at the
 * emulator itself, not your machine. Set `EXPO_PUBLIC_API_URL` to
 * `http://10.0.2.2:3000/api/v1` to reach a host-machine API from an Android
 * emulator. iOS simulator can use `localhost` directly.
 *
 * Request interceptor: attaches `Authorization: Bearer <access>` from secure
 * storage. Response interceptor: on a 401, tries `POST /auth/refresh` exactly
 * once with the stored refresh token, persists the new access token, and
 * replays the original request; if refresh fails it clears storage and signals
 * a logout via `onAuthFailure`.
 */
import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios';
import Constants from 'expo-constants';

import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  saveAccessToken,
} from './auth-storage';
import type { ApiRefreshResponse } from './api-types';

const extra = (Constants.expoConfig?.extra ?? {}) as { apiUrl?: string };

export const API_BASE_URL =
  extra.apiUrl ??
  process.env.EXPO_PUBLIC_API_URL ??
  'http://localhost:3000/api/v1';

// eslint-disable-next-line import/no-named-as-default-member -- intentional default import
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

/** Set once by the AuthContext so a failed refresh can drive the UI to logout. */
let onAuthFailure: (() => void) | null = null;
export function setAuthFailureHandler(fn: (() => void) | null): void {
  onAuthFailure = fn;
}

/**
 * Optional in-memory override of the access token (set on sign-in). Avoids a
 * SecureStore round-trip on every request; falls back to storage when unset.
 */
let memoryAccessToken: string | null = null;
export function setAuthToken(token: string | null): void {
  memoryAccessToken = token;
}

// ── Request: attach bearer token ────────────────────────────────────────────
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = memoryAccessToken ?? (await getAccessToken());
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response: refresh-on-401 (single retry) ─────────────────────────────────
type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

const isRefreshCall = (url?: string) => !!url && url.includes('/auth/refresh');

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const status = error.response?.status;

    if (status !== 401 || !original || original._retry || isRefreshCall(original.url)) {
      return Promise.reject(error);
    }

    original._retry = true;
    const refresh = await getRefreshToken();
    if (!refresh) {
      await handleLogout();
      return Promise.reject(error);
    }

    try {
      const { data } = await api.post<ApiRefreshResponse>('/auth/refresh', {
        refresh_token: refresh,
      });
      memoryAccessToken = data.access_token;
      await saveAccessToken(data.access_token);
      original.headers.Authorization = `Bearer ${data.access_token}`;
      return api(original);
    } catch (refreshError) {
      await handleLogout();
      return Promise.reject(refreshError);
    }
  },
);

async function handleLogout(): Promise<void> {
  memoryAccessToken = null;
  await clearTokens();
  onAuthFailure?.();
}
