/**
 * Auth service — thin wrappers over the API auth/users endpoints. Persists
 * tokens to secure storage and keeps the in-memory access token (used by the
 * request interceptor) in sync.
 */
import { api, setAuthToken } from './api';
import { clearTokens, saveTokens } from './auth-storage';
import type { ApiLoginResponse, ApiUser } from './api-types';

export interface Credentials {
  email: string;
  password: string;
}

export interface RegisterInput extends Credentials {
  name: string;
}

/** POST /users/register → created user. Does not log the user in. */
export async function register(input: RegisterInput): Promise<ApiUser> {
  const { data } = await api.post<ApiUser>('/users/register', input);
  return data;
}

/** POST /auth/login → persists tokens, returns the user. */
export async function login(creds: Credentials): Promise<ApiUser> {
  const { data } = await api.post<ApiLoginResponse>('/auth/login', creds);
  await saveTokens(data.access_token, data.refresh_token);
  setAuthToken(data.access_token);
  return data.user;
}

/** GET /auth/me → the authenticated user (used to validate a stored session). */
export async function me(): Promise<ApiUser> {
  const { data } = await api.get<ApiUser>('/auth/me');
  return data;
}

/** Clear tokens locally (stateless refresh tokens — no server call needed). */
export async function logout(): Promise<void> {
  setAuthToken(null);
  await clearTokens();
}
