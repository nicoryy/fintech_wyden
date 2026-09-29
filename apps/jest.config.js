// Jest configuration for the Wyden mobile app.
// Uses the `jest-expo` preset (Expo SDK 57 / React Native 0.86 / React 19).
// `transformIgnorePatterns` is widened so the RN/Expo/svg/nativewind/react-query
// ESM packages are transformed.
/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|nativewind|react-native-css-interop|@tanstack/.*))',
  ],
  // sql.js (the in-memory SQLite used by data-layer/screen tests — see
  // test-utils/test-db.ts) compiles its asm.js module fresh in every test
  // file's worker; that one-time cost alone can approach the 5s Jest default
  // on a loaded machine, on top of the actual test.
  testTimeout: 20_000,
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/index.ts',
  ],
};
