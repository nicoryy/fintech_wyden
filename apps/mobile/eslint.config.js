// ESLint flat config — built on eslint-config-expo (recommended preset for
// Expo/React Native projects). Run with `npm run lint`.
const expoConfig = require('eslint-config-expo/flat');
const { defineConfig } = require('eslint/config');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: [
      'node_modules/**',
      '.expo/**',
      'dist/**',
      'expo-env.d.ts',
      'metro.config.js',
      'babel.config.js',
      'tailwind.config.js',
    ],
  },
  {
    // Test files: `jest.mock(...)` factories are hoisted above imports and must
    // use `require()` for the mock module. Relax the import-ordering / require
    // rules here so deliberate, hoisting-safe mocks don't trip lint.
    files: ['**/*.test.ts', '**/*.test.tsx'],
    rules: {
      'import/first': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
]);
