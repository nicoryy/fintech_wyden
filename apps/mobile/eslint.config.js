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
]);
