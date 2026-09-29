/**
 * WelcomeScreen — the app's entire onboarding: no login, no email, no
 * password (see the root CLAUDE.md) — just a name, so the Dashboard greeting
 * and Perfil screen have someone to address. Shown once, before the first
 * name is saved; `app/_layout.tsx`'s route guard then routes away from it for
 * good.
 */
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NameForm, Txt } from '../../components';
import { useSaveName } from '../../services/hooks';
import { errorMessage } from '../../utils/errors';
import { colors } from '../../theme/tokens';

export function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const saveName = useSaveName();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (name: string) => {
    setError(null);
    try {
      await saveName.mutateAsync(name);
    } catch (e) {
      setError(errorMessage(e, 'Não foi possível salvar. Tente novamente.'));
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: 24, paddingTop: insets.top + 64, justifyContent: 'center' }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brandRow}>
          <View style={styles.logo}>
            <Txt style={styles.logoText}>W</Txt>
          </View>
          <Txt style={styles.brand}>Wyden</Txt>
        </View>
        <Txt style={styles.title}>Como podemos te chamar?</Txt>
        <Txt style={styles.sub}>Seus dados ficam só neste aparelho — sem conta, sem nuvem, sem login.</Txt>

        <View style={{ marginTop: 28 }}>
          <NameForm submitLabel="Começar" onSubmit={onSubmit} />
        </View>

        {error && (
          <Txt style={styles.error} accessibilityRole="alert">
            {error}
          </Txt>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 28 },
  logo: { width: 40, height: 40, borderRadius: 13, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 22, fontWeight: '800', color: colors.white },
  brand: { fontSize: 20, fontWeight: '800', color: colors.ink, letterSpacing: -0.4 },
  title: { fontSize: 27, fontWeight: '800', color: colors.ink, letterSpacing: -0.6 },
  sub: { fontSize: 15, color: colors.ink2, marginTop: 6, lineHeight: 21, maxWidth: 300 },
  error: { fontSize: 13.5, color: colors.orange, marginTop: 16, fontWeight: '700', textAlign: 'center' },
});
