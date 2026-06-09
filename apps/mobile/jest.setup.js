// Global Jest setup — runs after the test framework is installed.
// Mocks the Expo/router/native pieces that have no JS implementation under the
// jsdom-like jest-expo environment, so components/screens can render headless.

/* eslint-disable no-undef */

// React Query batches cache notifications on a microtask/timer by default,
// which makes state updates land *after* a test's `waitFor` resolves and
// triggers "update not wrapped in act(...)" warnings. Make the scheduler
// synchronous in tests so every notification happens inside act().
const { notifyManager } = require('@tanstack/react-query');
notifyManager.setScheduler((cb) => cb());

// expo-router: the screens call useRouter()/router for navigation. The default
// jest-expo preset does not ship a functional router mock, so provide spies.
// The factory must be self-contained (jest hoists it above imports); we build
// the mock inside and re-expose it on `global` for specs to assert against.
jest.mock('expo-router', () => {
  const React = require('react');
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    navigate: jest.fn(),
    setParams: jest.fn(),
    dismiss: jest.fn(),
    dismissAll: jest.fn(),
    canGoBack: jest.fn(() => true),
  };
  global.__expoRouterMock = mockRouter;
  return {
    __esModule: true,
    router: mockRouter,
    useRouter: () => mockRouter,
    useLocalSearchParams: () => ({}),
    useSegments: () => [],
    usePathname: () => '/',
    useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
    Link: ({ children }) => React.createElement(React.Fragment, null, children),
    Stack: { Screen: () => null },
    Tabs: Object.assign(() => null, { Screen: () => null }),
    Slot: () => null,
  };
});

// expo-font: fonts are not loaded in tests; report them as ready so screens that
// gate render on useFonts() proceed, and make loadAsync a no-op.
jest.mock('expo-font', () => ({
  __esModule: true,
  useFonts: () => [true, null],
  isLoaded: () => true,
  loadAsync: jest.fn(() => Promise.resolve()),
  Font: { isLoaded: () => true },
}));

// expo-secure-store: no native module under jest. Back it with an in-memory map
// so auth-storage works headlessly in tests.
jest.mock('expo-secure-store', () => {
  const store = new Map();
  return {
    __esModule: true,
    setItemAsync: jest.fn((k, v) => {
      store.set(k, v);
      return Promise.resolve();
    }),
    getItemAsync: jest.fn((k) => Promise.resolve(store.get(k) ?? null)),
    deleteItemAsync: jest.fn((k) => {
      store.delete(k);
      return Promise.resolve();
    }),
  };
});

// Reset router spies between tests for isolation.
beforeEach(() => {
  const r = global.__expoRouterMock;
  if (r) {
    Object.values(r).forEach((fn) => {
      if (fn && typeof fn.mockClear === 'function') fn.mockClear();
    });
  }
});
