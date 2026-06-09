/**
 * TransactionsScreen — MonthNav, MiniSummary, FilterChips, day-grouped list.
 * Ported from the prototype `transacoes.jsx`.
 */
import React, { useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, Press, Txt } from '../../components';
import { bankById, catById } from '../../services/mock/catalog';
import { useTransactions } from '../../services/hooks';
import type { Transaction, TransactionGroup } from '../../services/types';
import { brl } from '../../utils/format';
import { colors, radii, cardShadow, tileShadow, withAlpha } from '../../theme/tokens';

const TAB_BAR_SPACE = 110;

type Filter = 'todas' | 'receita' | 'despesa' | 'impulso';

export function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>('todas');
  const { data } = useTransactions();

  const groups = useMemo(() => filterGroups(data ?? [], filter), [data, filter]);

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={{ paddingTop: insets.top + 4, paddingBottom: TAB_BAR_SPACE, gap: 16, paddingHorizontal: 16 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.titleRow}>
        <Txt style={styles.title}>Transações</Txt>
        <Press accessibilityLabel="Selecionar período" style={[styles.calendarBtn, tileShadow]}>
          <Icon name="calendar" size={21} stroke={colors.ink} sw={1.8} />
        </Press>
      </View>

      <MonthNav />
      <MiniSummary />
      <FilterChips value={filter} onChange={setFilter} />

      <View style={{ gap: 14 }}>
        {groups.map((g) => {
          const net = g.items.reduce((s, t) => s + t.amount, 0);
          return (
            <View key={g.label}>
              <View style={styles.groupHeader}>
                <Txt style={styles.groupLabel}>{g.label.toUpperCase()}</Txt>
                <Txt style={[styles.groupNet, { color: net >= 0 ? colors.greenInk : colors.ink2 }]}>
                  {brl(net, { sign: true })}
                </Txt>
              </View>
              <View style={styles.groupCard}>
                {g.items.map((t, i) => (
                  <View key={t.id} style={i > 0 ? styles.rowDivider : undefined}>
                    <TxRow t={t} />
                  </View>
                ))}
              </View>
            </View>
          );
        })}
        {groups.length === 0 && (
          <Txt style={styles.empty}>Nenhuma transação neste filtro.</Txt>
        )}
      </View>
    </ScrollView>
  );
}

function filterGroups(groups: TransactionGroup[], filter: Filter): TransactionGroup[] {
  return groups
    .map((g) => ({
      ...g,
      items: g.items.filter((t) => {
        if (filter === 'todas') return true;
        if (filter === 'receita') return t.amount > 0;
        if (filter === 'despesa') return t.amount < 0;
        if (filter === 'impulso') return t.isImpulse === true;
        return true;
      }),
    }))
    .filter((g) => g.items.length > 0);
}

function MonthNav() {
  return (
    <View style={styles.monthNav}>
      <Press accessibilityLabel="Mês anterior" style={[styles.monthBtn, cardShadowSmall]}>
        <Icon name="chevron-left" size={18} stroke={colors.ink2} sw={2.2} />
      </Press>
      <Txt style={styles.monthLabel}>Junho 2026</Txt>
      <Press accessibilityLabel="Próximo mês" style={[styles.monthBtn, cardShadowSmall]}>
        <Icon name="chevron-right" size={18} stroke={colors.ink2} sw={2.2} />
      </Press>
    </View>
  );
}

function MiniSummary() {
  return (
    <View style={styles.summaryRow}>
      <View style={[styles.summaryCard, { backgroundColor: colors.greenWash }]}>
        <View style={styles.summaryHeader}>
          <View style={[styles.summaryIcon, { backgroundColor: colors.green }]}>
            <Icon name="arrow-up-right" size={13} stroke={colors.white} sw={2.4} />
          </View>
          <Txt style={[styles.summaryKicker, { color: colors.greenInk }]}>Entradas</Txt>
        </View>
        <Txt style={styles.summaryValue}>R$ 6.288,20</Txt>
      </View>
      <View style={[styles.summaryCard, { backgroundColor: colors.orangeWash }]}>
        <View style={styles.summaryHeader}>
          <View style={[styles.summaryIcon, { backgroundColor: colors.orange }]}>
            <Icon name="arrow-down" size={13} stroke={colors.white} sw={2.4} />
          </View>
          <Txt style={[styles.summaryKicker, { color: colors.orange }]}>Saídas</Txt>
        </View>
        <Txt style={styles.summaryValue}>R$ 784,90</Txt>
      </View>
    </View>
  );
}

const FILTER_OPTS: { id: Filter; label: string }[] = [
  { id: 'todas', label: 'Todas' },
  { id: 'receita', label: 'Receitas' },
  { id: 'despesa', label: 'Despesas' },
  { id: 'impulso', label: 'Impulso' },
];

function FilterChips({ value, onChange }: { value: Filter; onChange: (f: Filter) => void }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.chipScroll}
      contentContainerStyle={styles.chipRow}
    >
      {FILTER_OPTS.map((o) => {
        const active = value === o.id;
        const isImp = o.id === 'impulso';
        const bg = active ? (isImp ? colors.purple : colors.ink) : colors.card;
        return (
          <Press
            key={o.id}
            accessibilityLabel={`Filtrar por ${o.label}`}
            accessibilityState={{ selected: active }}
            onPress={() => onChange(o.id)}
            style={[
              styles.chip,
              {
                backgroundColor: bg,
                borderWidth: active ? 0 : 1,
                borderColor: colors.line,
              },
              active && tileShadow,
            ]}
          >
            <Txt style={[styles.chipText, { color: active ? colors.white : colors.ink2 }]}>{o.label}</Txt>
          </Press>
        );
      })}
    </ScrollView>
  );
}

function TxRow({ t }: { t: Transaction }) {
  const c = catById(t.categoryId);
  const b = bankById(t.bankId);
  const income = t.amount > 0;
  return (
    <View style={styles.txRow}>
      <View style={[styles.txIcon, { backgroundColor: withAlpha(c.color, '1F') }]}>
        <Icon name={c.icon} size={21} stroke={c.color} sw={1.9} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={styles.txDescRow}>
          <Txt numberOfLines={1} style={styles.txDesc}>{t.description}</Txt>
          {t.isImpulse && (
            <View style={styles.impulseTag}>
              <Txt style={styles.impulseTagText}>impulso</Txt>
            </View>
          )}
        </View>
        <View style={styles.txMetaRow}>
          <Txt style={styles.txMeta}>{c.label}</Txt>
          <View style={styles.metaDot} />
          <View style={[styles.bankSwatch, { backgroundColor: b.color }]} />
          <Txt style={styles.txMeta}>{b.label}</Txt>
          <View style={styles.metaDot} />
          <Txt style={styles.txMeta}>{t.time}</Txt>
        </View>
      </View>
      <Txt style={[styles.txAmount, { color: income ? colors.greenInk : colors.ink }]}>
        {brl(t.amount, { sign: true })}
      </Txt>
    </View>
  );
}

const cardShadowSmall = {
  ...tileShadow,
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 2 },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.6, color: colors.ink },
  calendarBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },

  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, paddingVertical: 2 },
  monthBtn: { width: 30, height: 30, borderRadius: 10, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  monthLabel: { fontSize: 15.5, fontWeight: '800', color: colors.ink, minWidth: 110, textAlign: 'center' },

  summaryRow: { flexDirection: 'row', gap: 12 },
  summaryCard: { flex: 1, borderRadius: 18, paddingVertical: 14, paddingHorizontal: 16 },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  summaryIcon: { width: 22, height: 22, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  summaryKicker: { fontSize: 13, fontWeight: '700' },
  summaryValue: { fontSize: 18, fontWeight: '800', color: colors.ink, marginTop: 8, letterSpacing: -0.4 },

  chipScroll: { marginHorizontal: -16 },
  chipRow: { gap: 8, paddingHorizontal: 16 },
  chip: { height: 36, paddingHorizontal: 16, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  chipText: { fontSize: 13.5, fontWeight: '700' },

  groupHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6, paddingBottom: 8 },
  groupLabel: { fontSize: 13, fontWeight: '800', color: colors.ink2, letterSpacing: 0.3 },
  groupNet: { fontSize: 13, fontWeight: '700' },
  groupCard: { backgroundColor: colors.card, borderRadius: radii.card, overflow: 'hidden', ...cardShadow },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.line },

  txRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 18 },
  txIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  txDescRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  txDesc: { fontSize: 14.5, fontWeight: '700', color: colors.ink, flexShrink: 1 },
  txMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  txMeta: { fontSize: 12.5, color: colors.muted },
  metaDot: { width: 3, height: 3, borderRadius: 3, backgroundColor: colors.muted, marginHorizontal: 6 },
  bankSwatch: { width: 11, height: 11, borderRadius: 4, marginRight: 4 },
  txAmount: { fontSize: 15, fontWeight: '800' },

  impulseTag: { backgroundColor: colors.purpleChip, paddingVertical: 2, paddingHorizontal: 7, borderRadius: 999 },
  impulseTagText: { fontSize: 10, fontWeight: '800', color: colors.purple },

  empty: { textAlign: 'center', color: colors.muted, fontSize: 14, paddingVertical: 30 },
});
