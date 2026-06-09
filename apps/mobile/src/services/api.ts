/**
 * Axios instance — configured and ready for when the backend goes live.
 * Today the data hooks resolve mock data and do NOT hit this client; it exists
 * so wiring the real API is a one-line change inside `hooks.ts`.
 *
 * Base URL resolution order:
 *   1. `extra.apiUrl` in app.json (via expo-constants)
 *   2. `EXPO_PUBLIC_API_URL` env var
 *   3. local dev fallback `http://localhost:3000/api/v1`
 */
import axios from 'axios';
import Constants from 'expo-constants';

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

/**
 * Attach the bearer token to every request. Wire this to secure storage
 * (expo-secure-store) once auth is implemented.
 */
export function setAuthToken(token: string | null): void {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}
