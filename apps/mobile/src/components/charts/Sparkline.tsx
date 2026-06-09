/**
 * Sparkline — smooth financial-evolution line with gradient area fill and an
 * end dot. Ported from the BalanceCard SVG in the prototype `home.jsx`.
 */
import React, { useMemo } from 'react';
import Svg, {
  Path,
  Circle,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';

import { sparkPaths } from '../../utils/charts';
import { colors } from '../../theme/tokens';

interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  pad?: number;
  color?: string;
}

export function Sparkline({
  values,
  width = 118,
  height = 62,
  pad = 4,
  color = colors.green,
}: SparklineProps) {
  const spark = useMemo(
    () => sparkPaths(values, width, height, pad),
    [values, width, height, pad],
  );
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Defs>
        <LinearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity={0.22} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Path d={spark.area} fill="url(#sparkFill)" />
      <Path
        d={spark.line}
        fill="none"
        stroke={color}
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle
        cx={spark.lastX}
        cy={spark.lastY}
        r={4.2}
        fill={color}
        stroke={colors.card}
        strokeWidth={2}
      />
    </Svg>
  );
}
