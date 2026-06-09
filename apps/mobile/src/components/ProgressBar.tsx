/**
 * ProgressBar — thin rounded track + fill. Used by GoalCard, EconomiaHero,
 * CategoryBars and BankBreakdown in the prototype.
 */
import React from 'react';
import { View } from 'react-native';

import { colors } from '../theme/tokens';

interface ProgressBarProps {
  /** 0..100 */
  pct: number;
  color?: string;
  trackColor?: string;
  height?: number;
}

export function ProgressBar({
  pct,
  color = colors.green,
  trackColor = colors.line,
  height = 8,
}: ProgressBarProps) {
  return (
    <View
      style={{
        height,
        borderRadius: height,
        backgroundColor: trackColor,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          width: `${Math.max(0, Math.min(100, pct))}%`,
          height: '100%',
          borderRadius: height,
          backgroundColor: color,
        }}
      />
    </View>
  );
}
