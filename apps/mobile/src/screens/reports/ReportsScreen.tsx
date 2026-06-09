/**
 * ReportsScreen — PeriodSeg, EconomiaHero, MonthlyChart, BehaviorCompare,
 * CategoryBars, BankBreakdown. Ported from the prototype `relatorios.jsx`.
 */
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, Press, ProgressBar, Txt } from '../../components';
import { bankById, catById } from '../../services/mock/catalog';
import { useReports } from '../../services/hooks';
import type { BankSpend, MonthPoint, Reports, SpendSlice } from '../../services/types';
import { brl } from '../../utils/format';
import { colors, radii, cardShadow, withAlpha } from '../../theme/tokens';

const TAB_BAR_SPACE = 110;

export function ReportsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [period, setPeriod] = useState('Mês');
  const { data } = useReports();

  if (!data) return <View style={styles.flex} />;

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={{ paddingTop: insets.top + 4, paddingBottom: TAB_BAR_SPACE, gap: 14, paddingHorizontal: 16 }}
      showsVerticalScrollIndicator={false}
    >
      <Txt style={styles.title}>Relatórios</Txt>
      <PeriodSeg value={period} onChange={setPeriod} />
      <EconomiaHero data={data} />
      <MonthlyChart months={data.months} />
      <BehaviorCompare behavior={data.behavior} onOpen={() => router.push('/insight')} />
      <CategoryBars spend={data.spend} />
      <BankBreakdown byBank={data.byBank} />
    </ScrollView>
  );
}

function PeriodSeg({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const opts = ['Mês', 'Trimestre', 'Ano'];
  return (
    <View style={styles.seg}>
      {opts.map((o) => {
        const active = value === o;
        return (
          <Press
            key={o}
            accessibilityLabel={o}
            accessibilityState={{ selected: active }}
            onPress={() => onChange(o)}
            style={[styles.segItem, active && [styles.segItemActive, cardShadow]]}
          >
            <Txt style={[styles.segText, { color: active ? colors.ink : colors.ink2 }]}>{o}</Txt>
          </Press>
        );
      })}
    </View>
  );
}

function EconomiaHero({ data }: { data: Reports }) {
  return (
    <View style={styles.hero}>
      <Txt style={styles.heroKicker}>Você economizou em junho</Txt>
      <Txt style={styles.heroValue}>{brl(data.economia.value)}</Txt>
      <View style={styles.heroBarRow}>
        <View style={{ flex: 1 }}>
          <ProgressBar pct={data.economia.pct} trackColor={colors.white} />
        </View>
        <Txt style={styles.heroPct}>{data.economia.pct}%</Txt>
      </View>
      <Txt style={styles.heroSub}>da sua renda foi guardada — seu melhor mês do ano.</Txt>
    </View>
  );
}

function MonthlyChart({ months }: { months: MonthPoint[] }) {
  const max = Math.max(...months.map((m) => m.rec));
  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <Txt style={styles.cardTitle}>Comparativo mensal</Txt>
        <View style={styles.legendRow}>
          <Legend color={colors.green} label="Receitas" />
          <Legend color={colors.orange} label="Despesas" />
        </View>
      </View>
      <View style={styles.barsRow}>
        {months.map((m, i) => {
          const cur = i === months.length - 1;
          return (
            <View key={m.m} style={styles.barCol}>
              <View style={styles.barTrack}>
                <View style={[styles.bar, { height: `${(m.rec / max) * 100}%`, backgroundColor: colors.green, opacity: cur ? 1 : 0.85 }]} />
                <View style={[styles.bar, { height: `${(m.desp / max) * 100}%`, backgroundColor: colors.orange, opacity: cur ? 1 : 0.85 }]} />
              </View>
              <Txt style={[styles.barLabel, { fontWeight: cur ? '800' : '600', color: cur ? colors.ink : colors.muted }]}>{m.m}</Txt>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legend}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Txt style={styles.legendLabel}>{label}</Txt>
    </View>
  );
}

function BehaviorCompare({
  behavior,
  onOpen,
}: {
  behavior: Reports['behavior'];
  onOpen: () => void;
}) {
  return (
    <Press accessibilityLabel="Abrir leitura comportamental" onPress={onOpen} style={styles.behavior}>
      <View style={styles.behaviorHeader}>
        <View style={styles.behaviorChip}>
          <Icon name="brain" size={19} stroke={colors.purple} sw={1.7} />
        </View>
        <Txt style={styles.behaviorTitle}>Leitura comportamental</Txt>
      </View>
      <View style={styles.compareRow}>
        <CompareStat label="Impulsividade" value={behavior.impulsivity} />
        <CompareStat label="Consistência" value={behavior.consistency} />
      </View>
      <View style={styles.behaviorCta}>
        <Txt style={styles.behaviorCtaText}>Ver análise completa</Txt>
        <Icon name="chevron-right" size={15} stroke={colors.purpleInk} sw={2.4} />
      </View>
    </Press>
  );
}

function CompareStat({ label, value, good = true }: { label: string; value: string; good?: boolean }) {
  // In the prototype both compare stats are "good" (green). `good` is kept as a
  // prop so a future API can flag a negative trend (orange) when relevant.
  return (
    <View style={styles.compareStat}>
      <Txt style={styles.compareLabel}>{label}</Txt>
      <Txt style={[styles.compareValue, { color: good ? colors.greenInk : colors.orange }]}>{value}</Txt>
      <Txt style={styles.compareSub}>vs. mês passado</Txt>
    </View>
  );
}

function CategoryBars({ spend }: { spend: SpendSlice[] }) {
  const max = Math.max(...spend.map((s) => s.pct));
  return (
    <View style={styles.card}>
      <Txt style={styles.cardTitle}>Gastos por categoria</Txt>
      <View style={{ gap: 16, marginTop: 16 }}>
        {spend.map((x) => {
          const c = catById(x.categoryId);
          return (
            <View key={x.categoryId}>
              <View style={styles.catBarHeader}>
                <View style={[styles.catBarIcon, { backgroundColor: withAlpha(c.color, '1F') }]}>
                  <Icon name={c.icon} size={15} stroke={c.color} sw={2} />
                </View>
                <Txt style={styles.catBarLabel}>{c.label}</Txt>
                <Txt style={styles.catBarValue}>{brl(x.value)}</Txt>
                <Txt style={[styles.catBarPct, { color: c.color }]}>{x.pct}%</Txt>
              </View>
              <ProgressBar pct={(x.pct / max) * 100} color={c.color} trackColor={colors.segBg} />
            </View>
          );
        })}
      </View>
    </View>
  );
}

function BankBreakdown({ byBank }: { byBank: BankSpend[] }) {
  const max = Math.max(...byBank.map((b) => b.value));
  return (
    <View style={styles.card}>
      <Txt style={styles.cardTitle}>Gastos por banco</Txt>
      <View style={{ gap: 14, marginTop: 16 }}>
        {byBank.map((x) => {
          const b = bankById(x.bankId);
          return (
            <View key={x.bankId} style={styles.bankRow}>
              <View style={[styles.bankTile, { backgroundColor: b.color }]}>
                <Txt style={[styles.bankShort, { color: b.ink ?? colors.white }]}>{b.short}</Txt>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={styles.bankHeader}>
                  <Txt style={styles.bankLabel}>{b.label}</Txt>
                  <Txt style={styles.bankValue}>{brl(x.value)}</Txt>
                </View>
                <ProgressBar pct={(x.value / max) * 100} color={b.color} trackColor={colors.segBg} height={7} />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.6, color: colors.ink, paddingHorizontal: 2 },

  seg: { flexDirection: 'row', backgroundColor: colors.segBg, borderRadius: 13, padding: 4, gap: 4 },
  segItem: { flex: 1, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  segItemActive: { backgroundColor: colors.card },
  segText: { fontSize: 13.5, fontWeight: '800' },

  hero: { backgroundColor: colors.greenWash, borderRadius: radii.card, padding: 20, overflow: 'hidden' },
  heroKicker: { fontSize: 14, fontWeight: '700', color: colors.greenInk },
  heroValue: { fontSize: 36, fontWeight: '800', color: colors.ink, letterSpacing: -1.2, marginTop: 6 },
  heroBarRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  heroPct: { fontSize: 13, fontWeight: '800', color: colors.greenInk },
  heroSub: { fontSize: 12.5, color: colors.ink2, marginTop: 8 },

  card: { backgroundColor: colors.card, borderRadius: radii.card, padding: 20, ...cardShadow },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: 16, fontWeight: '800', color: colors.ink, letterSpacing: -0.3 },

  legendRow: { flexDirection: 'row', gap: 12 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 9, height: 9, borderRadius: 3 },
  legendLabel: { fontSize: 11.5, fontWeight: '700', color: colors.ink2 },

  barsRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, height: 132, marginTop: 18 },
  barCol: { flex: 1, alignItems: 'center', gap: 8 },
  barTrack: { width: '100%', height: 108, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 3 },
  bar: { width: 8, borderRadius: 4 },
  barLabel: { fontSize: 11.5 },

  behavior: { backgroundColor: colors.purpleWash, borderWidth: 1, borderColor: colors.purpleLine, borderRadius: radii.card, padding: 18 },
  behaviorHeader: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  behaviorChip: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.purpleChip, alignItems: 'center', justifyContent: 'center' },
  behaviorTitle: { fontSize: 14.5, fontWeight: '800', color: colors.purpleInk },
  compareRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  compareStat: { flex: 1, backgroundColor: colors.card, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14 },
  compareLabel: { fontSize: 12, color: colors.ink2, fontWeight: '600' },
  compareValue: { fontSize: 19, fontWeight: '800', marginTop: 3, letterSpacing: -0.3 },
  compareSub: { fontSize: 11, color: colors.muted, marginTop: 1 },
  behaviorCta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
  behaviorCtaText: { color: colors.purpleInk, fontWeight: '700', fontSize: 13.5 },

  catBarHeader: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 7 },
  catBarIcon: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  catBarLabel: { flex: 1, fontSize: 13.5, fontWeight: '700', color: colors.ink },
  catBarValue: { fontSize: 13, fontWeight: '700', color: colors.ink2 },
  catBarPct: { fontSize: 12.5, fontWeight: '800', width: 34, textAlign: 'right' },

  bankRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  bankTile: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  bankShort: { fontSize: 13, fontWeight: '800' },
  bankHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  bankLabel: { fontSize: 13.5, fontWeight: '700', color: colors.ink },
  bankValue: { fontSize: 13, fontWeight: '700', color: colors.ink2 },
});
