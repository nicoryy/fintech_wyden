/**
 * Root layout — global providers + font loading + auth-gated Stack navigator.
 *
 * Providers (outermost → in):
 *   GestureHandlerRootView → SafeAreaProvider → QueryClientProvider →
 *   AuthProvider → CatalogProvider → Stack
 *
 * Fonts: Plus Jakarta Sans is loaded via `useFonts`; the splash stays visible
 * until the fonts are ready so the first paint is already pixel-perfect.
 *
 * Route guard (`RootNavigator`): while auth status is 'loading' nothing is
 * redirected; once known, a `guest` is pushed to `/login` and an `authed` user
 * away from the auth routes into `/(tabs)`.
 *
 * Routes:
 *   login, register     → auth screens (guest only)
 *   (tabs)              → the 5-tab shell (Início, Transações, +, Relatórios, Perfil)
 *   transaction/add     → "Nova transação" presented as a modal
 *   insight             → behavioral-insight bottom sheet over a transparent scrim
 */
import React, { useCallback, useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';

import { fontMap } from '../src/theme/fonts';
import { colors } from '../src/theme/tokens';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { CatalogProvider } from '../src/context/CatalogContext';

// Keep the splash screen visible while we load fonts.
void SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, retry: 1, refetchOnWindowFocus: false },
  },
});

const AUTH_ROUTES = ['login', 'register'];

/** Stack + the auth-aware redirect guard. Must live under AuthProvider. */
function RootNavigator() {
  const { status } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    const onAuthRoute = AUTH_ROUTES.includes(segments[0] ?? '');
    if (status === 'guest' && !onAuthRoute) {
      router.replace('/login');
    } else if (status === 'authed' && onAuthRoute) {
      router.replace('/(tabs)');
    }
  }, [status, segments, router]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="transaction/add"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="insight"
        options={{
          presentation: 'transparentModal',
          animation: 'fade',
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontMap);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  const onLayout = useCallback(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayout}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <CatalogProvider>
              <StatusBar style="dark" />
              <RootNavigator />
            </CatalogProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
