/**
 * RegisterScreen — name + email + password sign-up. On success it registers and
 * immediately logs in (AuthContext.signUp), flipping to 'authed'. Validation via
 * React Hook Form + Zod; API errors surfaced inline. Reuses the `Field` input
 * from LoginScreen for visual consistency.
 */
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Press, Txt } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { colors, tileShadow } from '../../theme/tokens';
import { Field } from './LoginScreen';
import { apiErrorMessage } from './errors';

const schema = z.object({
  name: z.string().min(2, 'Informe seu nome'),
  email: z.string().min(1, 'Informe seu e-mail').email('E-mail inválido'),
  password: z.string().min(6, 'A senha deve ter ao menos 6 caracteres'),
});
type FormData = z.infer<typeof schema>;

export function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signUp } = useAuth();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const onSubmit = async (data: FormData) => {
    setApiError(null);
    try {
      await signUp(data);
    } catch (e) {
      setApiError(apiErrorMessage(e, 'Não foi possível criar sua conta. Tente novamente.'));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: 24, paddingTop: insets.top + 48, justifyContent: 'center' }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Txt style={styles.title}>Criar conta</Txt>
        <Txt style={styles.sub}>Comece a entender o porquê dos seus gastos.</Txt>

        <View style={{ marginTop: 28, gap: 14 }}>
          <Field
            control={control}
            name="name"
            label="Nome"
            placeholder="Seu nome"
            autoCapitalize="words"
            error={errors.name?.message}
          />
          <Field
            control={control}
            name="email"
            label="E-mail"
            placeholder="voce@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email?.message}
          />
          <Field
            control={control}
            name="password"
            label="Senha"
            placeholder="Mínimo de 6 caracteres"
            secureTextEntry
            error={errors.password?.message}
          />
        </View>

        {apiError && <Txt style={styles.apiError}>{apiError}</Txt>}

        <Press
          accessibilityLabel="Criar conta"
          disabled={isSubmitting}
          onPress={handleSubmit(onSubmit)}
          style={[styles.cta, { opacity: isSubmitting ? 0.6 : 1 }, tileShadow]}
        >
          <Txt style={styles.ctaText}>{isSubmitting ? 'Criando…' : 'Criar conta'}</Txt>
        </Press>

        <View style={styles.footerRow}>
          <Txt style={styles.footerText}>Já tem conta?</Txt>
          <Press accessibilityLabel="Entrar" onPress={() => router.replace('/login')}>
            <Txt style={styles.footerLink}>Entrar</Txt>
          </Press>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  title: { fontSize: 27, fontWeight: '800', color: colors.ink, letterSpacing: -0.6 },
  sub: { fontSize: 15, color: colors.ink2, marginTop: 6, lineHeight: 21, maxWidth: 280 },
  apiError: { fontSize: 13.5, color: colors.orange, marginTop: 16, fontWeight: '700', textAlign: 'center' },
  cta: { height: 56, borderRadius: 18, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  ctaText: { fontSize: 16.5, fontWeight: '800', color: colors.white },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 22 },
  footerText: { fontSize: 14, color: colors.ink2 },
  footerLink: { fontSize: 14, color: colors.green, fontWeight: '800' },
});
