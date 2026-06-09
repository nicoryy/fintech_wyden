import {
  saveTokens,
  saveAccessToken,
  getAccessToken,
  getRefreshToken,
  clearTokens,
} from './auth-storage';

// expo-secure-store is mocked (in-memory) in jest.setup.js.
describe('auth-storage (SecureStore-backed)', () => {
  beforeEach(async () => {
    await clearTokens();
  });

  it('saves and reads access + refresh tokens', async () => {
    await saveTokens('access-1', 'refresh-1');
    expect(await getAccessToken()).toBe('access-1');
    expect(await getRefreshToken()).toBe('refresh-1');
  });

  it('updates only the access token', async () => {
    await saveTokens('access-1', 'refresh-1');
    await saveAccessToken('access-2');
    expect(await getAccessToken()).toBe('access-2');
    expect(await getRefreshToken()).toBe('refresh-1');
  });

  it('clears both tokens', async () => {
    await saveTokens('a', 'b');
    await clearTokens();
    expect(await getAccessToken()).toBeNull();
    expect(await getRefreshToken()).toBeNull();
  });
});
