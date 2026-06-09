/**
 * ProgressRing — circular progress with a centered percentage label.
 * Ported from the GoalCard SVG in the prototype `home.jsx`.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { colors } from '../../theme/tokens';

interface ProgressRingProps {
  /** 0..100 */
  pct: number;
  size?: number;
  stroke?: number;
  color?: string;
  trackColor?: string;
}

export function ProgressRing({
  pct,
  size = 78,
  stroke = 7,
  color = colors.green,
  trackColor = colors.line,
}: ProgressRingProps) {
  const c = size / 2;
  const r = c - stroke - 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - pct / 100);
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle cx={c} cy={c} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
        <Circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${c} ${c})`}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        <Text style={styles.label}>{pct}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 17, fontWeight: '800', color: colors.ink },
});
