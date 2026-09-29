/**
 * TabBar — custom bottom bar with an elevated center FAB (Adicionar).
 * Ported from `TabBar` in the prototype `app.jsx`. Plugged into Expo Router's
 * Tabs via the `tabBar` prop. The FAB is not a route tab; it pushes the
 * `transaction/add` modal.
 *
 * Layout note: the prototype lifts the FAB above the bar with a negative margin,
 * which a web page renders fine. Under React Navigation's tab-bar host the bar
 * View clips its children, so an overflowing FAB becomes invisible. To keep the
 * elevated look *and* stay clip-safe, the root reserves a transparent strip on
 * top (`paddingTop: FAB_POP`); the white bar sits below it and the FAB floats in
 * the strip — entirely within the root's measured bounds, so nothing clips it.
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

const FAB_SIZE = 58;
const FAB_POP = 14; // how far the FAB rises above the white bar's top edge

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
      <View key={t.name} style={styles.slot}>
        <Press
          onPress={() => navigation.navigate(t.name)}
          accessibilityRole="tab"
          accessibilityState={{ selected: active }}
          accessibilityLabel={t.label}
          style={styles.tab}
        >
          <Icon name={t.icon} size={24} stroke={color} sw={active ? 2.1 : 1.8} />
          <Txt style={{ fontSize: 11, fontWeight: active ? '800' : '600', color }}>
            {t.label}
          </Txt>
        </Press>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      {/* white bar background (below the transparent top strip) */}
      <View style={[styles.barBg, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        <View style={styles.row}>
          {LEFT.map(renderTab)}
          {/* empty center slot reserves the gap the floating FAB sits in */}
          <View style={styles.slot} />
          {RIGHT.map(renderTab)}
        </View>
      </View>

      {/* floating FAB — centered in the reserved gap, raised above the bar */}
      <View pointerEvents="box-none" style={styles.fabWrap}>
        <Press
          accessibilityRole="button"
          accessibilityLabel="Adicionar transação"
          activeScale={0.93}
          onPress={() => router.push('/transaction/add')}
          style={styles.fab}
        >
          <Icon name="plus" size={28} stroke={colors.white} sw={2.8} />
        </Press>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Transparent strip on top so the FAB can float above the white bar while
  // staying inside the (clip-safe) root bounds.
  root: {},
  barBg: {
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
    paddingTop: 12,
    paddingHorizontal: 6,
    paddingBottom: 4,
  },
  // 5 equal slots (2 tabs + gap + 2 tabs) → icons evenly spaced & centered.
  slot: { flex: 1, alignItems: 'center' },
  tab: { alignItems: 'center', gap: 4, paddingTop: 2 },
  // Floating layer pinned to the top of the root, centered horizontally.
  fabWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: 20,
    backgroundColor: colors.green,
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
      android: { elevation: 8 },
      default: { boxShadow: '0 10px 22px rgba(20,30,40,.22)' },
    }),
  },
});
