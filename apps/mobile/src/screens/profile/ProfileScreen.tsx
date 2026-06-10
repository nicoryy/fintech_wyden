/**
 * ProfileScreen — ported from the prototype `perfil.jsx`:
 *   identity header · behavioral-profile card (the purple differentiator) ·
 *   "Minhas contas" (real banks + balances) · Preferências (toggles) · Conta.
 *
 * Deviations requested by the user: no "Segurança" row, and "Ajuda e suporte"
 * carries the developer contact (Pedro Nicory · nicoryy.com), opening the site.
 * Identity, banks and the behavioral copy come from the live API; the trait
 * bars are a coarse Phase-1 mapping of the impulse band (Phase 2 will compute
 * real per-trait scores).
 */
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, Press, Txt, type IconName } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { useCatalog } from '../../context/CatalogContext';
import { useInsight } from '../../services/hooks';
import { brl } from '../../utils/format';
import { colors, radii, cardShadow, tileShadow } from '../../theme/tokens';

const TAB_BAR_SPACE = 110;
const DEV_SITE = 'https://nicoryy.com';

/** Two-letter initials from a name, e.g. "Ana Souza" → "AS". */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { banks } = useCatalog();
  const { data: insight } = useInsight();

  const [notif, setNotif] = useState(true);
  const [alerts, setAlerts] = useState(true);

  const name = user?.name ?? 'Visitante';
  const email = user?.email ?? '';

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{
        paddingTop: insets.top + 8,
        paddingBottom: TAB_BAR_SPACE,
        paddingHorizontal: 16,
        gap: 16,
      }}
      showsVerticalScrollIndicator={false}
    >
      <Txt style={styles.title}>Perfil</Txt>

      {/* identity */}
      <View style={styles.identity}>
        <View style={styles.avatar}>
          <Txt style={styles.avatarText}>{user ? initials(name) : '?'}</Txt>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Txt numberOfLines={1} style={styles.idName}>{name}</Txt>
          {!!email && <Txt numberOfLines={1} style={styles.idEmail}>{email}</Txt>}
          <View style={styles.idBadge}>
            <Icon name="trend" size={13} stroke={colors.greenInk} sw={2.3} />
            <Txt style={styles.idBadgeText}>Conta ativa</Txt>
          </View>
        </View>
        <Press accessibilityLabel="Editar perfil" style={[styles.editBtn, tileShadow]}>
          <Icon name="pencil" size={19} stroke={colors.ink} sw={1.8} />
        </Press>
      </View>

      <BehaviorProfile insight={insight} onOpen={() => router.push('/insight')} />

      <BanksCard banks={banks} />

      <SettingsCard
        title="Preferências"
        items={[
          {
            icon: 'bell',
            label: 'Notificações',
            sub: 'Resumo diário às 20h',
            tint: colors.greenWash2,
            ink: colors.greenInk,
            toggle: notif,
            onToggle: () => setNotif((v) => !v),
          },
          {
            icon: 'sparkle',
            label: 'Alertas de impulso',
            sub: 'Avisar em compras fora do padrão',
            tint: colors.purpleChip,
            ink: colors.purple,
            toggle: alerts,
            onToggle: () => setAlerts((v) => !v),
          },
          { icon: 'target', label: 'Minhas metas', sub: '1 ativa — Reserva de emergência' },
        ]}
      />

      <SettingsCard
        title="Conta"
        items={[
          { icon: 'download', label: 'Exportar dados', sub: 'CSV ou PDF' },
          {
            icon: 'help',
            label: 'Ajuda e suporte',
            sub: 'Pedro Nicory · nicoryy.com',
            onPress: () => void Linking.openURL(DEV_SITE),
          },
          {
            icon: 'logout',
            label: 'Sair da conta',
            danger: true,
            tint: colors.orangeWash,
            ink: colors.orange,
            onPress: () => void signOut(),
          },
        ]}
      />

      <Txt style={styles.footer}>WYDEN · versão 1.0</Txt>
    </ScrollView>
  );
}

// ── Behavioral profile (purple — differentiator) ────────────────────────────
const BANDS: Record<string, { Consciente: number; Impulsivo: number; Planejador: number }> = {
  Alto: { Consciente: 34, Impulsivo: 72, Planejador: 40 },
  Médio: { Consciente: 56, Impulsivo: 48, Planejador: 58 },
  Baixo: { Consciente: 74, Impulsivo: 28, Planejador: 66 },
};

function BehaviorProfile({
  insight,
  onOpen,
}: {
  insight: ReturnType<typeof useInsight>['data'];
  onOpen: () => void;
}) {
  const hasInsight = !!insight && insight.title !== 'Sem insights ainda';
  const band = insight?.metrics?.[0]?.value ?? 'Baixo';
  const traits = hasInsight ? BANDS[band] ?? BANDS.Baixo : null;

  return (
    <Press accessibilityLabel="Abrir perfil comportamental" onPress={onOpen} style={styles.behavior}>
      <View style={styles.behaviorHead}>
        <View style={styles.behaviorChip}>
          <Icon name="brain" size={19} stroke={colors.purple} sw={1.7} />
        </View>
        <Txt style={styles.behaviorTitle}>Seu perfil comportamental</Txt>
        <Icon name="chevron-right" size={17} stroke={colors.purpleInk} sw={2.3} />
      </View>
      <Txt style={styles.behaviorDesc}>
        {hasInsight
          ? insight!.description
          : 'Continue registrando suas transações para revelar seu perfil comportamental.'}
      </Txt>
      {traits && (
        <View style={{ gap: 9, marginTop: 13 }}>
          {(Object.keys(traits) as (keyof typeof traits)[]).map((label) => (
            <View key={label} style={styles.traitRow}>
              <Txt style={styles.traitLabel}>{label}</Txt>
              <View style={styles.traitTrack}>
                <View style={[styles.traitFill, { width: `${traits[label]}%` }]} />
              </View>
              <Txt style={styles.traitPct}>{traits[label]}%</Txt>
            </View>
          ))}
        </View>
      )}
    </Press>
  );
}

// ── Banks ───────────────────────────────────────────────────────────────────
function BanksCard({ banks }: { banks: { id: string; label: string; color: string; short: string; ink?: string; balance?: number }[] }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <Txt style={styles.cardTitle}>Minhas contas</Txt>
        <Press accessibilityLabel="Adicionar conta" style={styles.addBtn}>
          <Icon name="plus" size={15} stroke={colors.green} sw={2.6} />
          <Txt style={styles.addText}>Adicionar</Txt>
        </Press>
      </View>
      {banks.map((b, i) => (
        <View key={b.id} style={[styles.bankRow, i > 0 && styles.rowDivider]}>
          <View style={[styles.bankTile, { backgroundColor: b.color }]}>
            <Txt style={[styles.bankShort, { color: b.ink ?? colors.white }]}>{b.short}</Txt>
          </View>
          <Txt numberOfLines={1} style={styles.bankLabel}>{b.label}</Txt>
          <Txt style={styles.bankBalance}>{brl(b.balance ?? 0)}</Txt>
        </View>
      ))}
    </View>
  );
}

// ── Settings ────────────────────────────────────────────────────────────────
interface SettingItem {
  icon: IconName;
  label: string;
  sub?: string;
  tint?: string;
  ink?: string;
  danger?: boolean;
  toggle?: boolean;
  onToggle?: () => void;
  onPress?: () => void;
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <Press
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      accessibilityLabel="Alternar"
      onPress={onToggle}
      style={[styles.toggle, { backgroundColor: on ? colors.green : colors.segBg }]}
    >
      <View style={[styles.knob, { left: on ? 21 : 3 }]} />
    </Press>
  );
}

function SettingsCard({ title, items }: { title: string; items: SettingItem[] }) {
  return (
    <View style={styles.card}>
      <Txt style={[styles.cardTitle, styles.cardTitlePad]}>{title}</Txt>
      {items.map((it, i) => (
        <Press
          key={it.label}
          accessibilityLabel={it.label}
          disabled={it.toggle === undefined && !it.onPress}
          onPress={it.onPress}
          style={[styles.settingRow, i > 0 && styles.rowDivider]}
        >
          <View style={[styles.settingIcon, { backgroundColor: it.tint ?? colors.segBg }]}>
            <Icon name={it.icon} size={19} stroke={it.ink ?? colors.ink2} sw={1.8} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Txt style={it.danger ? [styles.settingLabel, styles.settingLabelDanger] : styles.settingLabel}>
              {it.label}
            </Txt>
            {!!it.sub && <Txt style={styles.settingSub}>{it.sub}</Txt>}
          </View>
          {it.toggle !== undefined && it.onToggle ? (
            <Toggle on={it.toggle} onToggle={it.onToggle} />
          ) : (
            <Icon name="chevron-right" size={17} stroke={colors.muted} sw={2.2} />
          )}
        </Press>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.6, color: colors.ink, paddingHorizontal: 2 },

  // identity
  identity: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 2 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: colors.greenWash2,
    borderWidth: 2,
    borderColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '800', color: colors.greenInk, letterSpacing: -0.5 },
  idName: { fontSize: 21, fontWeight: '800', color: colors.ink, letterSpacing: -0.5 },
  idEmail: { fontSize: 13.5, color: colors.ink2, marginTop: 2 },
  idBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    marginTop: 7,
    paddingVertical: 4,
    paddingHorizontal: 11,
    borderRadius: 999,
    backgroundColor: colors.greenWash,
  },
  idBadgeText: { fontSize: 12, fontWeight: '800', color: colors.greenInk },
  editBtn: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },

  // behavior
  behavior: { backgroundColor: colors.purpleWash, borderWidth: 1, borderColor: colors.purpleLine, borderRadius: radii.card, padding: 18 },
  behaviorHead: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  behaviorChip: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.purpleChip, alignItems: 'center', justifyContent: 'center' },
  behaviorTitle: { flex: 1, fontSize: 14.5, fontWeight: '800', color: colors.purpleInk },
  behaviorDesc: { fontSize: 13.5, color: colors.ink2, marginTop: 10, lineHeight: 19 },
  traitRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  traitLabel: { width: 82, fontSize: 12, fontWeight: '700', color: colors.ink2 },
  traitTrack: { flex: 1, height: 7, borderRadius: 7, backgroundColor: colors.white, overflow: 'hidden' },
  traitFill: { height: '100%', borderRadius: 7, backgroundColor: colors.purple },
  traitPct: { width: 32, textAlign: 'right', fontSize: 12, fontWeight: '800', color: colors.purpleInk },

  // generic card
  card: { backgroundColor: colors.card, borderRadius: radii.card, overflow: 'hidden', ...cardShadow },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: colors.ink, letterSpacing: -0.3 },
  cardTitlePad: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 6 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addText: { color: colors.green, fontWeight: '800', fontSize: 13.5 },

  rowDivider: { borderTopWidth: 1, borderTopColor: colors.line },

  // bank row
  bankRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, paddingHorizontal: 20 },
  bankTile: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  bankShort: { fontSize: 13, fontWeight: '800' },
  bankLabel: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.ink },
  bankBalance: { fontSize: 13.5, fontWeight: '800', color: colors.ink2 },

  // setting row
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 12, paddingHorizontal: 20 },
  settingIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  settingLabel: { fontSize: 14, fontWeight: '700', color: colors.ink },
  settingLabelDanger: { color: colors.orange },
  settingSub: { fontSize: 12, color: colors.muted, marginTop: 1 },

  // toggle
  toggle: { width: 46, height: 28, borderRadius: 999, justifyContent: 'center' },
  knob: { position: 'absolute', top: 3, width: 22, height: 22, borderRadius: 999, backgroundColor: colors.white, ...tileShadow },

  footer: { fontSize: 12, color: colors.muted, textAlign: 'center', fontWeight: '600', paddingTop: 2 },
});
