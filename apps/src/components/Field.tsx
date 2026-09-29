/**
 * Field — labeled text input wired to React Hook Form. Extracted from the old
 * LoginScreen (now removed — see the root CLAUDE.md) so the Welcome/EditName
 * screens can reuse the same look without depending on auth screens.
 */
import React from 'react';
import { View, TextInput, StyleSheet, type KeyboardTypeOptions } from 'react-native';
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form';

import { Txt } from './Txt';
import { colors } from '../theme/tokens';

interface FieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  placeholder?: string;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoFocus?: boolean;
}

export function Field<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  error,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  autoFocus,
}: FieldProps<T>) {
  return (
    <View>
      <Txt style={styles.fieldLabel}>{label}</Txt>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            value={value as string}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            placeholderTextColor={colors.muted}
            secureTextEntry={secureTextEntry}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            autoFocus={autoFocus}
            style={[styles.input, error ? styles.inputError : null]}
          />
        )}
      />
      {error && <Txt style={styles.fieldError}>{error}</Txt>}
    </View>
  );
}

const styles = StyleSheet.create({
  fieldLabel: { fontSize: 13.5, fontWeight: '800', color: colors.ink, marginBottom: 8 },
  input: {
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.line,
    paddingHorizontal: 16,
    fontSize: 15,
    color: colors.ink,
    fontFamily: 'PlusJakarta_600SemiBold',
  },
  inputError: { borderColor: colors.orange },
  fieldError: { fontSize: 12.5, color: colors.orange, marginTop: 6, fontWeight: '600' },
});
