/**
 * NameForm — the single field ("Como podemos te chamar?") shared by the
 * Welcome onboarding screen and the Editar nome modal — the entire "identity"
 * the app has, now that there's no login (see the root CLAUDE.md).
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Field } from './Field';
import { Press } from './Press';
import { Txt } from './Txt';
import { colors, tileShadow } from '../theme/tokens';

const schema = z.object({
  name: z.string().trim().min(1, 'Informe um nome').max(40, 'Máximo de 40 caracteres'),
});
type FormData = z.infer<typeof schema>;

interface NameFormProps {
  defaultName?: string;
  submitLabel: string;
  /** Should not throw — the caller is expected to catch and surface its own error message. */
  onSubmit: (name: string) => Promise<void>;
}

export function NameForm({ defaultName = '', submitLabel, onSubmit }: NameFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: defaultName },
  });

  const submit = handleSubmit((data) => onSubmit(data.name.trim()));

  return (
    <View>
      <Field
        control={control}
        name="name"
        label="Seu nome"
        placeholder="Como podemos te chamar?"
        autoCapitalize="words"
        autoFocus
        error={errors.name?.message}
      />
      <Press
        accessibilityLabel={submitLabel}
        disabled={isSubmitting}
        onPress={submit}
        style={[styles.cta, { opacity: isSubmitting ? 0.6 : 1 }, tileShadow]}
      >
        <Txt style={styles.ctaText}>{isSubmitting ? 'Salvando…' : submitLabel}</Txt>
      </Press>
    </View>
  );
}

const styles = StyleSheet.create({
  cta: {
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  ctaText: { fontSize: 16.5, fontWeight: '800', color: colors.white },
});
