/**
 * Txt — Text wrapper that maps the `fontWeight` in the flattened style to the
 * correct loaded Plus Jakarta Sans family (RN does not synthesize weights from
 * one family). Lets screens keep authoring with `fontWeight`/`fontSize` exactly
 * as the prototype CSS did, while rendering the right face.
 */
import React from 'react';
import { Text, StyleSheet, type TextProps, type TextStyle } from 'react-native';

import { colors } from '../theme/tokens';
import { familyForWeight } from '../theme/fonts';

interface TxtProps extends TextProps {
  style?: TextStyle | TextStyle[];
}

export function Txt({ style, children, ...rest }: TxtProps) {
  const flat = (StyleSheet.flatten(style) ?? {}) as TextStyle;
  const family = familyForWeight(flat.fontWeight);
  return (
    <Text
      // default ink color unless overridden by the passed style
      style={[{ color: colors.ink }, flat, { fontFamily: family }]}
      {...rest}
    >
      {children}
    </Text>
  );
}
