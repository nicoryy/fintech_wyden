module.exports = function (api) {
  // Vary the Babel cache by environment so the test env can opt out of
  // NativeWind. Its CSS-interop transform (and the `nativewind` jsxImportSource)
  // injects an out-of-scope helper (`_ReactNativeCSSInterop`) that breaks
  // `jest.mock()` factory hoisting. The app's UI uses StyleSheet/inline (no
  // `className`), so dropping NativeWind in tests has no behavioral impact.
  const isTest = api.env('test');
  api.cache.using(() => process.env.NODE_ENV);
  if (isTest) {
    return { presets: ['babel-preset-expo'] };
  }
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
  };
};
