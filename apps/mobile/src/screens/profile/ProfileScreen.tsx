/**
 * ProfileScreen — placeholder, mirroring the prototype `Placeholder` in
 * `app.jsx` for sections not part of the current build.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, Txt } from '../../components';
import { colors, tileShadow } from '../../theme/tokens';

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.center}>
        <View style={[styles.iconWrap, tileShadow]}>
          <Icon name="nav-user" size={40} stroke={colors.muted} sw={1.7} />
        </View>
        <Txt style={styles.title}>Perfil</Txt>
        <Txt style={styles.sub}>
          Esta seção faz parte do produto completo. Neste protótipo, foque no{' '}
          <Txt style={styles.subStrong}>Início</Txt> e no{' '}
          <Txt style={styles.subStrong}>Adicionar</Txt>.
        </Txt>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  iconWrap: { width: 88, height: 88, borderRadius: 28, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 19, fontWeight: '800', color: colors.ink, marginTop: 20 },
  sub: { fontSize: 14, color: colors.ink2, marginTop: 6, maxWidth: 240, lineHeight: 20, textAlign: 'center' },
  subStrong: { color: colors.greenInk, fontWeight: '700' },
});
