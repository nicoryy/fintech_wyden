/**
 * Card — white rounded surface with the prototype's soft shadow.
 * Ported from the `Card` shell in `home.jsx`.
 */
import React from 'react';
import { View, type ViewStyle, type StyleProp } from 'react-native';

import { colors, radii, cardShadow } from '../theme/tokens';

interface CardProps {
  children: React.ReactNode;
  pad?: number;
  style?: StyleProp<ViewStyle>;
}

export function Card({ children, pad = 20, style }: CardProps) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: radii.card,
          padding: pad,
        },
        cardShadow,
        style,
      ]}
    >
      {children}
    </View>
  );
}
