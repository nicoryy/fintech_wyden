/**
 * ProfileScreen — authenticated user header, a name/email card, a few static
 * settings rows (visual placeholders for the full product), and a "Sair" button
 * that signs out via the AuthContext (which redirects to /login).
 */
import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, Press, Txt, type IconName } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { colors, radii, cardShadow, tileShadow, withAlpha } from '../../theme/tokens';

const TAB_BAR_SPACE = 110;

/** Two-letter initials from a name, e.g. "Ana Lima" → "AL". */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const SETTINGS: { icon: IconName; label: string; color: string }[] = [
  { icon: 'wallet', label: 'Contas e bancos', color: colors.green },
  { icon: 'card', label: 'Categorias', color: colors.orange },
  { icon: 'bell', label: 'Notificações', color: '#3B82F6' },
  { icon: 'info', label: 'Sobre o Wyden', color: colors.purple },
];

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{
        paddingTop: insets.top + 4,
        paddingBottom: TAB_BAR_SPACE,
        paddingHorizontal: 16,
        gap: 16,
      }}
      showsVerticalScrollIndicator={false}
    >
      <Txt style={styles.title}>Perfil</Txt>

      <View style={styles.userCard}>
        <View style={styles.avatar}>
          <Txt style={styles.avatarText}>{user ? initials(user.name) : '?'}</Txt>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Txt numberOfLines={1} style={styles.userName}>{user?.name ?? 'Visitante'}</Txt>
          <Txt numberOfLines={1} style={styles.userEmail}>{user?.email ?? ''}</Txt>
        </View>
      </View>

      <View style={styles.settingsCard}>
        {SETTINGS.map((s, i) => (
          <Press
            key={s.label}
            accessibilityLabel={s.label}
            style={[styles.settingRow, i > 0 && styles.settingDivider]}
          >
            <View style={[styles.settingIcon, { backgroundColor: withAlpha(s.color, '1F') }]}>
              <Icon name={s.icon} size={18} stroke={s.color} sw={1.9} />
            </View>
            <Txt style={styles.settingLabel}>{s.label}</Txt>
            <Icon name="chevron-right" size={18} stroke={colors.muted} sw={2} />
          </Press>
        ))}
      </View>

      <Press
        accessibilityLabel="Sair"
        onPress={() => void signOut()}
        style={[styles.logoutBtn, tileShadow]}
      >
        <Icon name="close" size={18} stroke={colors.orange} sw={2.2} />
        <Txt style={styles.logoutText}>Sair</Txt>
      </Press>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.6, color: colors.ink, paddingHorizontal: 2 },

  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.card,
    borderRadius: radii.card,
    padding: 18,
    ...cardShadow,
  },
  avatar: { width: 58, height: 58, borderRadius: 20, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, fontWeight: '800', color: colors.white },
  userName: { fontSize: 18, fontWeight: '800', color: colors.ink, letterSpacing: -0.3 },
  userEmail: { fontSize: 13.5, color: colors.ink2, marginTop: 3 },

  settingsCard: { backgroundColor: colors.card, borderRadius: radii.card, overflow: 'hidden', ...cardShadow },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 15, paddingHorizontal: 18 },
  settingDivider: { borderTopWidth: 1, borderTopColor: colors.line },
  settingIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  settingLabel: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.ink },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    height: 54,
    borderRadius: 18,
    backgroundColor: colors.card,
  },
  logoutText: { fontSize: 15.5, fontWeight: '800', color: colors.orange },
});
