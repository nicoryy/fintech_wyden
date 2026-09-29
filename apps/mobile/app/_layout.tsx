/**
 * Root layout — global providers + font loading + onboarding-gated Stack
 * navigator.
 *
 * Providers (outermost → in):
 *   GestureHandlerRootView → SafeAreaProvider → QueryClientProvider →
 *   CatalogProvider → Stack
 *
 * Fonts: Plus Jakarta Sans is loaded via `useFonts`; the splash stays visible
 * until the fonts are ready so the first paint is already pixel-perfect.
 *
 * Route guard (`RootNavigator`): while the profile query is pending nothing is
 * redirected; once it resolves, a profile with no name yet is pushed to
 * `/welcome` (the entire onboarding — see the root CLAUDE.md), and a named
 * profile is routed away from `/welcome` into `/(tabs)`. If the local database
 * itself fails to open, an `ErrorState` offers a retry instead of a blank app.
 *
 * Routes:
 *   welcome              → onboarding (name only, no login)
 *   (tabs)               → the 5-tab shell (Início, Transações, +, Relatórios, Perfil)
 *   transaction/add      → "Nova transação" presented as a modal
 *   edit-name            → "Editar nome" presented as a modal
 *   insight              → behavioral-insight bottom sheet over a transparent scrim
 */
import React, { useCallback, useEffect } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';

import { ErrorState } from '../src/components';
import { fontMap } from '../src/theme/fonts';
import { colors } from '../src/theme/tokens';
import { CatalogProvider } from '../src/context/CatalogContext';
import { useProfile } from '../src/services/hooks';

// Keep the splash screen visible while we load fonts.
void SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, retry: 1, refetchOnWindowFocus: false },
  },
});

const ONBOARDING_ROUTE = 'welcome';

/** Stack + the onboarding-aware redirect guard. Must live under CatalogProvider. */
function RootNavigator() {
  const { data: profile, isPending, isError, refetch } = useProfile();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isPending || isError) return;
    const onOnboarding = segments[0] === ONBOARDING_ROUTE;
    if (!profile?.name && !onOnboarding) {
      router.replace('/welcome');
    } else if (profile?.name && onOnboarding) {
      router.replace('/(tabs)');
    }
  }, [profile, isPending, isError, segments, router]);

  if (isError) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', padding: 16 }}>
        <ErrorState title="Não foi possível abrir seus dados" onRetry={() => void refetch()} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="transaction/add"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="edit-name"
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
          <CatalogProvider>
            <StatusBar style="dark" />
            <RootNavigator />
          </CatalogProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
