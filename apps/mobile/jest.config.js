// Jest configuration for the Wyden mobile app.
// Uses the `jest-expo` preset (Expo SDK 56 / React Native 0.85 / React 19).
// `transformIgnorePatterns` is widened so the RN/Expo/svg/nativewind/react-query
// ESM packages — and the workspace `@wyden/shared` TS package — are transformed.
/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|nativewind|react-native-css-interop|@tanstack/.*|@wyden/.*))',
  ],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/index.ts',
  ],
};
