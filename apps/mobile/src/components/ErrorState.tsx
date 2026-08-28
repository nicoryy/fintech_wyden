/**
 * ErrorState — shared "something went wrong" card with a retry action.
 * Dashboard, Reports and Insight used to render a blank screen (`!data` ->
 * empty View) whenever their query failed, with no way back short of leaving
 * and re-entering the tab. Styled after TransactionsScreen's EmptyState.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';

import { Icon } from './Icon';
import { Press } from './Press';
import { Txt } from './Txt';
import { colors, radii, cardShadow } from '../theme/tokens';

interface ErrorStateProps {
  title?: string;
  sub?: string;
  onRetry: () => void;
}

export function ErrorState({
  title = 'Não foi possível carregar',
  sub = 'Verifique sua conexão e tente novamente.',
  onRetry,
}: ErrorStateProps) {
  return (
    <View style={styles.card}>
      <View style={styles.icon}>
        <Icon name="info" size={24} stroke={colors.muted} sw={1.9} />
      </View>
      <Txt style={styles.title}>{title}</Txt>
      <Txt style={styles.sub}>{sub}</Txt>
      <Press accessibilityLabel="Tentar novamente" onPress={onRetry} style={styles.retry}>
        <Txt style={styles.retryText}>Tentar novamente</Txt>
      </Press>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radii.card,
    paddingVertical: 34,
    paddingHorizontal: 24,
    ...cardShadow,
  },
  icon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: colors.segBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: { fontSize: 15.5, fontWeight: '800', color: colors.ink },
  sub: { fontSize: 13.5, color: colors.muted, marginTop: 6, textAlign: 'center', lineHeight: 19 },
  retry: {
    marginTop: 16,
    height: 42,
    paddingHorizontal: 20,
    borderRadius: 13,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryText: { fontSize: 13.5, fontWeight: '800', color: colors.white },
});
