/**
 * Press — Pressable that reproduces the prototype `.press` micro-interaction
 * (scale to .96 while held). Centralizes accessibility defaults for taps.
 */
import React from 'react';
import {
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

interface PressProps extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** scale applied while pressed (default .96, like the prototype) */
  activeScale?: number;
}

export function Press({
  children,
  style,
  activeScale = 0.96,
  disabled,
  accessibilityRole = 'button',
  ...rest
}: PressProps) {
  return (
    <Pressable
      accessibilityRole={accessibilityRole}
      disabled={disabled}
      style={[style]}
      {...rest}
    >
      {children}
    </Pressable>
  );
}
