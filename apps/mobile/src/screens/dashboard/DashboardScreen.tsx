/**
 * DashboardScreen (Início) — Header, BalanceCard, InsightCard, CategoryCard,
 * GoalCard, RecentCard. Ported pixel-for-pixel from the prototype `home.jsx`.
 */
import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, Donut, Icon, Press, ProgressBar, ProgressRing, Sparkline, Txt } from '../../components';
import { useCatalog } from '../../context/CatalogContext';
import { useDashboard } from '../../services/hooks';
import type { Category, Dashboard, SpendSlice, Transaction } from '../../services/types';
import { brl, brlParts } from '../../utils/format';
import { colors, radii, tileShadow, withAlpha } from '../../theme/tokens';

const TAB_BAR_SPACE = 110;

export function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data } = useDashboard();
  const { catById } = useCatalog();

  if (!data) return <View style={styles.flex} />;

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={{
        paddingTop: insets.top + 8,
        paddingBottom: TAB_BAR_SPACE,
        gap: 16,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.screenPad}>
        <Header />
        <BalanceCard data={data} />
        <InsightCard onOpen={() => router.push('/insight')} />
        <CategoryCard spend={data.spend} catById={catById} onSeeAll={() => router.navigate('/(tabs)/reports')} />
        <GoalCard data={data} />
        <RecentCard recent={data.recent} catById={catById} onSeeAll={() => router.navigate('/(tabs)/transactions')} />
      </View>
    </ScrollView>
  );
}

// ── Header ──────────────────────────────────────────────────
function Header() {
  return (
    <View style={styles.header}>
      <View>
        <Txt style={styles.greet}>
          Olá, Ana! <Txt style={styles.greetWave}>👋</Txt>
        </Txt>
        <Txt style={styles.greetSub}>
          Que tal uma decisão financeira mais consciente hoje?
        </Txt>
      </View>
      <Press accessibilityLabel="Notificações" style={[styles.bell, tileShadow]}>
        <Icon name="bell" size={22} stroke={colors.ink} sw={1.7} />
        <View style={styles.bellDot} />
      </Press>
    </View>
  );
}

// ── Balance card ────────────────────────────────────────────
function BalanceCard({ data }: { data: Dashboard }) {
  const { int, dec } = brlParts(data.summary.saldo);
  return (
    <Card pad={0} style={{ overflow: 'hidden' }}>
      <View style={styles.balanceTop}>
        <View style={styles.rowCenter}>
          <Txt style={styles.balanceLabel}>Situação financeira</Txt>
          <Icon name="info" size={16} stroke={colors.muted} sw={1.7} />
        </View>
        <View style={styles.balanceMain}>
          <View style={{ minWidth: 0 }}>
            <Txt style={styles.balanceValue}>
              R$ {int}
              <Txt style={styles.balanceCents}>,{dec}</Txt>
            </Txt>
            <View style={styles.balanceDelta}>
              <Icon name="arrow-up-right" size={15} stroke={colors.greenInk} sw={2.2} />
              <Txt style={styles.deltaStrong}>R$ 620,40</Txt>
              <Txt style={styles.deltaMuted}> vs. mês anterior</Txt>
            </View>
          </View>
          <View style={{ marginBottom: 2 }}>
            <Sparkline values={data.evolution} width={118} height={62} pad={4} />
          </View>
        </View>
      </View>
      <View style={styles.statsRow}>
        <Stat label="Receitas" value={data.summary.receitas} tone="green" icon="arrow-up-right" />
        <Stat label="Despesas" value={data.summary.despesas} tone="orange" icon="arrow-down" divider />
        <Stat label="Saldo" value={data.summary.saldo} tone="green" icon="card" divider />
      </View>
    </Card>
  );
}

function Stat({
  label,
  value,
  tone,
  icon,
  divider,
}: {
  label: string;
  value: number;
  tone: 'green' | 'orange';
  icon: 'arrow-up-right' | 'arrow-down' | 'card';
  divider?: boolean;
}) {
  const color = tone === 'orange' ? colors.orange : colors.greenInk;
  const wash = tone === 'orange' ? colors.orangeWash : colors.greenWash2;
  return (
    <View style={[styles.stat, divider && styles.statDivider]}>
      <Txt style={styles.statLabel}>{label}</Txt>
      <View style={styles.statValueRow}>
        <Txt style={[styles.statValue, { color }]}>{brl(value)}</Txt>
        <View style={[styles.statIcon, { backgroundColor: wash }]}>
          <Icon name={icon} size={13} stroke={color} sw={2.3} />
        </View>
      </View>
    </View>
  );
}

// ── Behavioral insight card (Ilustrado variant — the prototype default) ──────
function InsightCard({ onOpen }: { onOpen: () => void }) {
  return (
    <Press
      accessibilityLabel="Abrir insight comportamental"
      onPress={onOpen}
      style={styles.insightCard}
    >
      <View style={styles.insightHeaderRow}>
        <View style={{ flex: 1 }}>
          <View style={styles.insightTitleRow}>
            <View style={styles.insightChip}>
              <Icon name="brain" size={20} stroke={colors.purple} sw={1.7} />
            </View>
            <Txt style={styles.insightKicker}>Insight comportamental</Txt>
          </View>
          <Txt style={styles.insightHeadline}>
            Você gastou mais por impulso nos finais de semana.
          </Txt>
          <Txt style={styles.insightSub}>
            Tente definir um limite diário para esses dias.
          </Txt>
        </View>
        <View style={styles.insightArt}>
          <View style={styles.insightArtBox}>
            <Icon name="brain" size={42} stroke={colors.purple} sw={1.4} />
            <View style={styles.sparkleTopRight}>
              <Icon name="sparkle" size={14} stroke={colors.purple} />
            </View>
            <View style={styles.sparkleBottomLeft}>
              <Icon name="sparkle" size={9} stroke={colors.purple} />
            </View>
          </View>
        </View>
      </View>
      <View style={styles.insightCta}>
        <Txt style={styles.insightCtaText}>Ver detalhes e dicas</Txt>
        <Icon name="chevron-right" size={16} stroke={colors.purpleInk} sw={2.4} />
      </View>
    </Press>
  );
}

// ── Spend by category ───────────────────────────────────────
function CategoryCard({
  spend,
  catById,
  onSeeAll,
}: {
  spend: SpendSlice[];
  catById: (id: string) => Category;
  onSeeAll: () => void;
}) {
  const slices = spend.map((x) => ({ pct: x.pct, color: catById(x.categoryId).color }));
  const total = spend.reduce((s, x) => s + x.value, 0);
  return (
    <Card>
      <SectionRow title="Gastos por categoria" onSeeAll={onSeeAll} />
      <View style={styles.categoryBody}>
        <Donut slices={slices} size={108} thickness={12} centerValue={brl(total)} centerLabel="Total" />
        <View style={styles.categoryList}>
          {spend.map((x) => {
            const c = catById(x.categoryId);
            return (
              <View key={x.categoryId} style={styles.categoryRow}>
                <View style={[styles.categoryDot, { backgroundColor: c.color }]}>
                  <Icon name={c.icon} size={13} stroke={colors.white} sw={2} />
                </View>
                <Txt numberOfLines={1} style={styles.categoryLabel}>{c.label}</Txt>
                <Txt style={styles.categoryValue}>{brl(x.value)}</Txt>
                <Txt style={[styles.categoryPct, { color: c.color }]}>{x.pct}%</Txt>
              </View>
            );
          })}
        </View>
      </View>
    </Card>
  );
}

function SectionRow({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  return (
    <View style={styles.sectionRow}>
      <Txt style={styles.sectionTitle}>{title}</Txt>
      {onSeeAll && (
        <Press accessibilityLabel="Ver todas" onPress={onSeeAll}>
          <Txt style={styles.seeAll}>Ver todas</Txt>
        </Press>
      )}
    </View>
  );
}

// ── Goal ────────────────────────────────────────────────────
function GoalCard({ data }: { data: Dashboard }) {
  const { goal } = data;
  const pct = Math.round((goal.currentAmount / goal.targetAmount) * 100);
  const remaining = goal.targetAmount - goal.currentAmount;
  return (
    <Card>
      <SectionRow title="Sua meta" />
      <View style={styles.goalBody}>
        <ProgressRing pct={pct} size={78} stroke={7} />
        <View style={{ flex: 1 }}>
          <Txt style={styles.goalTitle}>{goal.title}</Txt>
          <Txt style={styles.goalAmount}>
            <Txt style={styles.goalCurrent}>{brl(goal.currentAmount)}</Txt>
            <Txt style={styles.goalTarget}> de {brl(goal.targetAmount)}</Txt>
          </Txt>
          <View style={{ marginTop: 10 }}>
            <ProgressBar pct={pct} />
          </View>
          <Txt style={styles.goalRemaining}>Faltam {brl(remaining)} para sua meta</Txt>
        </View>
      </View>
    </Card>
  );
}

// ── Recent transactions ─────────────────────────────────────
function RecentCard({
  recent,
  catById,
  onSeeAll,
}: {
  recent: Transaction[];
  catById: (id: string) => Category;
  onSeeAll: () => void;
}) {
  const items = recent.slice(0, 4);
  return (
    <Card pad={0}>
      <View style={styles.recentHeader}>
        <SectionRow title="Atividade recente" onSeeAll={onSeeAll} />
      </View>
      <View>
        {items.map((t, i) => {
          const c = catById(t.categoryId);
          const income = t.amount > 0;
          return (
            <View key={t.id} style={[styles.recentRow, i === 0 && styles.recentRowFirst]}>
              <View style={[styles.recentIcon, { backgroundColor: withAlpha(c.color, '1F') }]}>
                <Icon name={c.icon} size={19} stroke={c.color} sw={1.9} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={styles.recentDescRow}>
                  <Txt style={styles.recentDesc}>{t.description}</Txt>
                  {t.isImpulse && (
                    <View style={styles.impulseTag}>
                      <Txt style={styles.impulseTagText}>impulso</Txt>
                    </View>
                  )}
                </View>
                <Txt style={styles.recentWhen}>{t.when}</Txt>
              </View>
              <Txt style={[styles.recentAmount, { color: income ? colors.greenInk : colors.ink }]}>
                {brl(t.amount, { sign: true })}
              </Txt>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  screenPad: { paddingHorizontal: 16, gap: 16 },
  rowCenter: { flexDirection: 'row', alignItems: 'center' },

  // header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  greet: { fontSize: 27, fontWeight: '800', letterSpacing: -0.6, color: colors.ink },
  greetWave: { fontSize: 27, fontWeight: '400' },
  greetSub: { fontSize: 15, color: colors.ink2, marginTop: 4, lineHeight: 20, maxWidth: 230 },
  bell: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 12,
    right: 13,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.green,
    borderWidth: 2,
    borderColor: colors.card,
  },

  // balance
  balanceTop: { padding: 20, backgroundColor: colors.greenWash, borderBottomWidth: 1, borderBottomColor: colors.line },
  balanceLabel: { fontSize: 15, fontWeight: '600', color: colors.ink, marginRight: 7 },
  balanceMain: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 6, gap: 8 },
  balanceValue: { fontSize: 36, fontWeight: '800', letterSpacing: -1.4, color: colors.ink, lineHeight: 38 },
  balanceCents: { fontSize: 23, fontWeight: '700', color: colors.ink },
  balanceDelta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  deltaStrong: { color: colors.greenInk, fontWeight: '700', fontSize: 13.5 },
  deltaMuted: { color: colors.ink2, fontWeight: '500', fontSize: 13.5 },
  statsRow: { flexDirection: 'row', paddingVertical: 14, paddingHorizontal: 4 },
  stat: { flex: 1, paddingVertical: 4, paddingHorizontal: 11 },
  statDivider: { borderLeftWidth: 1, borderLeftColor: colors.line },
  statLabel: { fontSize: 13, color: colors.ink2, fontWeight: '500' },
  statValueRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  statValue: { fontSize: 13, fontWeight: '700', letterSpacing: -0.2 },
  statIcon: { width: 21, height: 21, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },

  // insight
  insightCard: {
    backgroundColor: colors.purpleWash,
    borderRadius: radii.card,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.purpleLine,
    overflow: 'hidden',
  },
  insightHeaderRow: { flexDirection: 'row', gap: 14 },
  insightTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  insightChip: { width: 34, height: 34, borderRadius: 11, backgroundColor: colors.purpleChip, alignItems: 'center', justifyContent: 'center' },
  insightKicker: { fontSize: 15, fontWeight: '800', color: colors.purpleInk, letterSpacing: -0.2 },
  insightHeadline: { fontSize: 16.5, fontWeight: '700', color: colors.ink, marginTop: 12, lineHeight: 21, letterSpacing: -0.2 },
  insightSub: { fontSize: 14, color: colors.ink2, marginTop: 6, lineHeight: 20 },
  insightArt: { width: 86, alignItems: 'center', justifyContent: 'center' },
  insightArtBox: { width: 78, height: 78, borderRadius: 22, backgroundColor: colors.purpleChip, alignItems: 'center', justifyContent: 'center' },
  sparkleTopRight: { position: 'absolute', top: 10, right: 12 },
  sparkleBottomLeft: { position: 'absolute', bottom: 14, left: 12 },
  insightCta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
  insightCtaText: { color: colors.purpleInk, fontWeight: '700', fontSize: 14 },

  // section row
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: colors.ink, letterSpacing: -0.3 },
  seeAll: { color: colors.green, fontWeight: '700', fontSize: 14 },

  // category
  categoryBody: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  categoryList: { flex: 1, gap: 11, minWidth: 0 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  categoryDot: { width: 22, height: 22, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  categoryLabel: { flex: 1, minWidth: 0, fontSize: 12, fontWeight: '600', color: colors.ink },
  categoryValue: { fontSize: 11, color: colors.ink2, fontWeight: '600' },
  categoryPct: { fontSize: 11, fontWeight: '800', width: 24, textAlign: 'right' },

  // goal
  goalBody: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 16 },
  goalTitle: { fontSize: 15.5, fontWeight: '800', color: colors.ink, letterSpacing: -0.2 },
  goalAmount: { fontSize: 14, marginTop: 3 },
  goalCurrent: { color: colors.greenInk, fontWeight: '800', fontSize: 14 },
  goalTarget: { color: colors.ink2, fontSize: 14 },
  goalRemaining: { fontSize: 12.5, color: colors.muted, marginTop: 8 },

  // recent
  recentHeader: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 6 },
  recentRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, paddingHorizontal: 20 },
  recentRowFirst: { borderTopWidth: 1, borderTopColor: colors.line },
  recentIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  recentDescRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  recentDesc: { fontSize: 14.5, fontWeight: '700', color: colors.ink },
  recentWhen: { fontSize: 12.5, color: colors.muted, marginTop: 2 },
  recentAmount: { fontSize: 14.5, fontWeight: '800' },
  impulseTag: { backgroundColor: colors.purpleChip, paddingVertical: 2, paddingHorizontal: 7, borderRadius: 999 },
  impulseTagText: { fontSize: 10.5, fontWeight: '800', color: colors.purple, letterSpacing: 0.2 },
});
