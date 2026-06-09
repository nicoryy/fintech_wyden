/**
 * LoginScreen — email + password sign-in. React Hook Form + Zod validation;
 * API errors surfaced inline. On success the AuthContext flips to 'authed' and
 * the route guard redirects into the tabs. Follows the design tokens (Txt/Press).
 */
import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  type KeyboardTypeOptions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Press, Txt } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { colors, tileShadow } from '../../theme/tokens';
import { apiErrorMessage } from './errors';

const schema = z.object({
  email: z.string().min(1, 'Informe seu e-mail').email('E-mail inválido'),
  password: z.string().min(1, 'Informe sua senha'),
});
type FormData = z.infer<typeof schema>;

export function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signIn } = useAuth();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: FormData) => {
    setApiError(null);
    try {
      await signIn(data);
    } catch (e) {
      setApiError(apiErrorMessage(e, 'Não foi possível entrar. Verifique suas credenciais.'));
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
        <View style={styles.brandRow}>
          <View style={styles.logo}>
            <Txt style={styles.logoText}>W</Txt>
          </View>
          <Txt style={styles.brand}>Wyden</Txt>
        </View>
        <Txt style={styles.title}>Bem-vindo de volta</Txt>
        <Txt style={styles.sub}>Entre para acompanhar suas finanças com consciência.</Txt>

        <View style={{ marginTop: 28, gap: 14 }}>
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
            placeholder="Sua senha"
            secureTextEntry
            error={errors.password?.message}
          />
        </View>

        {apiError && <Txt style={styles.apiError}>{apiError}</Txt>}

        <Press
          accessibilityLabel="Entrar"
          disabled={isSubmitting}
          onPress={handleSubmit(onSubmit)}
          style={[styles.cta, { opacity: isSubmitting ? 0.6 : 1 }, tileShadow]}
        >
          <Txt style={styles.ctaText}>{isSubmitting ? 'Entrando…' : 'Entrar'}</Txt>
        </Press>

        <View style={styles.footerRow}>
          <Txt style={styles.footerText}>Não tem conta?</Txt>
          <Press accessibilityLabel="Criar conta" onPress={() => router.replace('/register')}>
            <Txt style={styles.footerLink}>Criar conta</Txt>
          </Press>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Shared Field — exported so both auth screens can reuse it.
export function Field<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  error,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
}: {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  placeholder?: string;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) {
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
            style={[styles.input, error ? styles.inputError : null]}
          />
        )}
      />
      {error && <Txt style={styles.fieldError}>{error}</Txt>}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 28 },
  logo: { width: 40, height: 40, borderRadius: 13, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 22, fontWeight: '800', color: colors.white },
  brand: { fontSize: 20, fontWeight: '800', color: colors.ink, letterSpacing: -0.4 },

  title: { fontSize: 27, fontWeight: '800', color: colors.ink, letterSpacing: -0.6 },
  sub: { fontSize: 15, color: colors.ink2, marginTop: 6, lineHeight: 21, maxWidth: 280 },

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
  apiError: { fontSize: 13.5, color: colors.orange, marginTop: 16, fontWeight: '700', textAlign: 'center' },

  cta: { height: 56, borderRadius: 18, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  ctaText: { fontSize: 16.5, fontWeight: '800', color: colors.white },

  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 22 },
  footerText: { fontSize: 14, color: colors.ink2 },
  footerLink: { fontSize: 14, color: colors.green, fontWeight: '800' },
});
