/**
 * Secure token storage backed by expo-secure-store (Keychain/Keystore).
 * Holds the JWT access + refresh tokens. Web has no SecureStore, so we degrade
 * to an in-memory map there (tokens won't survive a reload on web — fine for
 * the device-first app).
 */
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_KEY = 'wyden.access_token';
const REFRESH_KEY = 'wyden.refresh_token';

const memory = new Map<string, string>();
const useMemory = Platform.OS === 'web';

async function setItem(key: string, value: string): Promise<void> {
  if (useMemory) {
    memory.set(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function getItem(key: string): Promise<string | null> {
  if (useMemory) {
    return memory.get(key) ?? null;
  }
  return SecureStore.getItemAsync(key);
}

async function deleteItem(key: string): Promise<void> {
  if (useMemory) {
    memory.delete(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export async function saveTokens(access: string, refresh: string): Promise<void> {
  await Promise.all([setItem(ACCESS_KEY, access), setItem(REFRESH_KEY, refresh)]);
}

export async function saveAccessToken(access: string): Promise<void> {
  await setItem(ACCESS_KEY, access);
}

export async function getAccessToken(): Promise<string | null> {
  return getItem(ACCESS_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return getItem(REFRESH_KEY);
}

export async function clearTokens(): Promise<void> {
  await Promise.all([deleteItem(ACCESS_KEY), deleteItem(REFRESH_KEY)]);
}
