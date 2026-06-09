/**
 * TabBar — custom bottom bar with an elevated center FAB (Adicionar).
 * Ported from `TabBar` in the prototype `app.jsx`. Plugged into Expo Router's
 * Tabs via the `tabBar` prop. The FAB is not a route tab; it pushes the
 * `transaction/add` modal.
 */
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from 'expo-router/js-tabs';

import { Press } from './Press';
import { Txt } from './Txt';
import { Icon, type IconName } from './Icon';
import { colors } from '../theme/tokens';

interface TabMeta {
  name: string;
  label: string;
  icon: IconName;
}

// Tab order matches the design: Início, Transações, [+ FAB], Relatórios, Perfil.
const LEFT: TabMeta[] = [
  { name: 'index', label: 'Início', icon: 'nav-home' },
  { name: 'transactions', label: 'Transações', icon: 'nav-swap' },
];
const RIGHT: TabMeta[] = [
  { name: 'reports', label: 'Relatórios', icon: 'nav-chart' },
  { name: 'profile', label: 'Perfil', icon: 'nav-user' },
];

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const activeName = state.routes[state.index]?.name;

  const renderTab = (t: TabMeta) => {
    const active = activeName === t.name;
    const color = active ? colors.green : colors.muted;
    return (
      <Press
        key={t.name}
        onPress={() => navigation.navigate(t.name)}
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        accessibilityLabel={t.label}
        style={styles.tab}
      >
        <Icon name={t.icon} size={24} stroke={color} sw={active ? 2.1 : 1.8} />
        <Txt
          style={{
            fontSize: 11,
            fontWeight: active ? '800' : '600',
            color,
          }}
        >
          {t.label}
        </Txt>
      </Press>
    );
  };

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
      <View style={styles.row}>
        {LEFT.map(renderTab)}

        <Press
          accessibilityRole="button"
          accessibilityLabel="Adicionar transação"
          activeScale={0.93}
          onPress={() => router.push('/transaction/add')}
          style={styles.fab}
        >
          <Icon name="plus" size={28} stroke={colors.white} sw={2.6} />
        </Press>

        {RIGHT.map(renderTab)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    ...Platform.select({
      ios: {
        shadowColor: 'rgb(20,30,40)',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
      },
      android: { elevation: 12 },
      default: { boxShadow: '0 -6px 24px rgba(20,30,40,.06)' },
    }),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-around',
    paddingTop: 10,
    paddingHorizontal: 8,
    paddingBottom: 4,
  },
  tab: {
    alignItems: 'center',
    gap: 4,
    width: 60,
    paddingTop: 2,
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: colors.green,
    marginTop: -24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.card,
    ...Platform.select({
      ios: {
        shadowColor: 'rgb(20,30,40)',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.22,
        shadowRadius: 14,
      },
      android: { elevation: 10 },
      default: {
        boxShadow: '0 10px 22px rgba(20,30,40,.22), 0 2px 6px rgba(23,160,106,1)',
      },
    }),
  },
});
