/**
 * InsightSheet — behavioral insight detail presented as a bottom sheet.
 * Reinforces the product differentiator (the "por quê", not just the "onde").
 * Ported from the prototype `insight.jsx`. Rendered by the `insight` modal route
 * over a translucent scrim; tapping the scrim or the button dismisses it.
 */
import React from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, Press, Txt } from '../../components';
import { useInsight } from '../../services/hooks';
import type { InsightDetail } from '../../services/types';
import { colors, tileShadow } from '../../theme/tokens';

export function InsightSheet() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data } = useInsight();
  const close = () => router.back();

  if (!data) return <Pressable style={styles.scrim} onPress={close} />;

  return (
    <View style={styles.root}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Fechar"
        style={styles.scrim}
        onPress={close}
      />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 14 }]}>
        <View style={styles.grabber} />
        <ScrollView showsVerticalScrollIndicator={false}>
          <Header data={data} />

          <Txt style={styles.body}>
            Identificamos <Txt style={styles.bodyStrong}>9 compras fora do seu padrão</Txt> este mês — a
            maioria concentrada nos finais de semana, à noite.
          </Txt>

          <WeeklyPattern data={data} />

          <View style={styles.metricsRow}>
            {data.metrics.map((m) => (
              <Metric
                key={m.label}
                label={m.label}
                value={m.value}
                tone={m.tone === 'orange' ? colors.orange : colors.purple}
                sub={m.sub}
              />
            ))}
          </View>

          <View style={styles.tip}>
            <Icon name="sparkle" size={20} stroke={colors.purple} />
            <View style={{ flex: 1 }}>
              <Txt style={styles.tipTitle}>{data.tip.title}</Txt>
              <Txt style={styles.tipBody}>
                Defina um limite de <Txt style={styles.bodyStrong}>R$ 80/dia</Txt> para sábado e domingo.
                Você economizaria cerca de R$ 240 por mês.
              </Txt>
            </View>
          </View>

          <Press accessibilityLabel="Definir limite diário" onPress={close} style={styles.cta}>
            <Txt style={styles.ctaText}>Definir limite diário</Txt>
          </Press>
        </ScrollView>
      </View>
    </View>
  );
}

function Header({ data }: { data: InsightDetail }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerChip}>
        <Icon name="brain" size={24} stroke={colors.purple} sw={1.7} />
      </View>
      <View>
        <Txt style={styles.kicker}>INSIGHT COMPORTAMENTAL</Txt>
        <Txt style={styles.title}>{data.title}</Txt>
      </View>
    </View>
  );
}

function WeeklyPattern({ data }: { data: InsightDetail }) {
  return (
    <View style={styles.patternCard}>
      <Txt style={styles.patternTitle}>Impulso por dia da semana</Txt>
      <View style={styles.barsRow}>
        {data.weeklyPattern.map((b) => (
          <View key={b.day} style={styles.barCol}>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.bar,
                  { height: `${b.value * 100}%`, backgroundColor: b.hot ? colors.purple : colors.purpleLine },
                ]}
              />
            </View>
            <Txt
              style={[
                styles.barLabel,
                { fontWeight: b.hot ? '800' : '600', color: b.hot ? colors.purpleInk : colors.muted },
              ]}
            >
              {b.day}
            </Txt>
          </View>
        ))}
      </View>
    </View>
  );
}

function Metric({ label, value, tone, sub }: { label: string; value: string; tone: string; sub: string }) {
  return (
    <View style={styles.metric}>
      <Txt style={styles.metricLabel}>{label}</Txt>
      <Txt style={[styles.metricValue, { color: tone }]}>{value}</Txt>
      <Txt style={styles.metricSub}>{sub}</Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  scrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(20,24,30,0.4)' },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 10,
    paddingHorizontal: 20,
    maxHeight: '88%',
  },
  grabber: { width: 40, height: 5, borderRadius: 999, backgroundColor: colors.line, alignSelf: 'center', marginBottom: 16 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  headerChip: { width: 42, height: 42, borderRadius: 13, backgroundColor: colors.purpleChip, alignItems: 'center', justifyContent: 'center' },
  kicker: { fontSize: 12.5, fontWeight: '800', color: colors.purpleInk, letterSpacing: 0.3 },
  title: { fontSize: 18, fontWeight: '800', color: colors.ink, letterSpacing: -0.3 },

  body: { fontSize: 15, color: colors.ink2, lineHeight: 22, marginTop: 14 },
  bodyStrong: { color: colors.ink, fontWeight: '700' },

  patternCard: { backgroundColor: colors.card, borderRadius: 20, padding: 18, marginTop: 16, ...tileShadow },
  patternTitle: { fontSize: 13.5, fontWeight: '800', color: colors.ink, marginBottom: 14 },
  barsRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 110 },
  barCol: { flex: 1, alignItems: 'center', gap: 7 },
  barTrack: { width: '100%', height: 86, justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 7 },
  barLabel: { fontSize: 11.5 },

  metricsRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  metric: { flex: 1, backgroundColor: colors.card, borderRadius: 18, paddingVertical: 14, paddingHorizontal: 16, ...tileShadow },
  metricLabel: { fontSize: 12.5, color: colors.ink2, fontWeight: '600' },
  metricValue: { fontSize: 20, fontWeight: '800', marginTop: 4, letterSpacing: -0.3 },
  metricSub: { fontSize: 11.5, color: colors.muted, marginTop: 2 },

  tip: { backgroundColor: colors.purpleWash, borderWidth: 1, borderColor: colors.purpleLine, borderRadius: 18, padding: 16, marginTop: 12, flexDirection: 'row', gap: 12 },
  tipTitle: { fontSize: 14.5, fontWeight: '800', color: colors.purpleInk },
  tipBody: { fontSize: 13.5, color: colors.ink2, marginTop: 3, lineHeight: 20 },

  cta: { height: 54, borderRadius: 17, marginTop: 18, backgroundColor: colors.purple, alignItems: 'center', justifyContent: 'center', ...tileShadow },
  ctaText: { color: colors.white, fontSize: 16, fontWeight: '800' },
});
