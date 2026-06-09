/**
 * Donut — segmented ring with rounded caps and a centered label.
 * Ported from the CategoryCard SVG in the prototype `home.jsx`.
 */
import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { donutSegments, type DonutSlice } from '../../utils/charts';
import { colors } from '../../theme/tokens';

interface DonutProps {
  slices: DonutSlice[];
  /** square box size in px */
  size?: number;
  thickness?: number;
  /** big centered value (e.g. total) */
  centerValue?: string;
  centerLabel?: string;
}

export function Donut({
  slices,
  size = 108,
  thickness = 12,
  centerValue,
  centerLabel,
}: DonutProps) {
  const c = size / 2;
  const r = c - thickness - 2;
  const seg = useMemo(
    () => donutSegments(slices, c, c, r, thickness, 4),
    [slices, c, r, thickness],
  );
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {seg.map((g, i) => (
          <Path
            key={i}
            d={g.d}
            stroke={g.color}
            strokeWidth={g.thick}
            fill="none"
            strokeLinecap="round"
          />
        ))}
      </Svg>
      {(centerValue || centerLabel) && (
        <View style={[StyleSheet.absoluteFill, styles.center]}>
          {centerValue ? <Text style={styles.value}>{centerValue}</Text> : null}
          {centerLabel ? <Text style={styles.label}>{centerLabel}</Text> : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  value: {
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -0.4,
  },
  label: { fontSize: 10.5, color: colors.muted },
});
