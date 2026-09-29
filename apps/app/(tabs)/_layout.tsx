/**
 * Tabs layout — 5 screens with a custom bottom bar (see `src/components/TabBar`).
 * The center "+" in the bar is not a route; it opens the `transaction/add` modal.
 * Tab order: Início → Transações → [+] → Relatórios → Perfil.
 */
import React from 'react';
import { Tabs } from 'expo-router/js-tabs';

import { TabBar } from '../../src/components/TabBar';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: 'Início' }} />
      <Tabs.Screen name="transactions" options={{ title: 'Transações' }} />
      <Tabs.Screen name="reports" options={{ title: 'Relatórios' }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}
