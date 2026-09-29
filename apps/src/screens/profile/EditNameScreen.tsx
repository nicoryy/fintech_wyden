/**
 * EditNameScreen — "Editar nome" modal, opened from the Perfil pencil icon.
 * Reuses `NameForm` pre-filled with the current name; saving (or the header's
 * close button) returns to Perfil.
 */
import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, NameForm, Press, Txt } from '../../components';
import { useProfile, useSaveName } from '../../services/hooks';
import { errorMessage } from '../../utils/errors';
import { colors, tileShadow } from '../../theme/tokens';

export function EditNameScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: profile } = useProfile();
  const saveName = useSaveName();
  const [error, setError] = useState<string | null>(null);

  const close = () => router.back();

  const onSubmit = async (name: string) => {
    setError(null);
    try {
      await saveName.mutateAsync(name);
      close();
    } catch (e) {
      setError(errorMessage(e, 'Não foi possível salvar. Tente novamente.'));
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Press accessibilityLabel="Fechar" onPress={close} style={[styles.headerBtn, tileShadow]}>
          <Icon name="close" size={20} stroke={colors.ink} sw={2.1} />
        </Press>
        <Txt style={styles.headerTitle}>Editar nome</Txt>
        <View style={{ width: 40 }} />
      </View>

      <View style={{ padding: 16, paddingTop: 8 }}>
        <NameForm defaultName={profile?.name ?? ''} submitLabel="Salvar" onSubmit={onSubmit} />
        {error && (
          <Txt style={styles.error} accessibilityRole="alert">
            {error}
          </Txt>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerBtn: { width: 40, height: 40, borderRadius: 13, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: colors.ink },
  error: { fontSize: 13.5, color: colors.orange, marginTop: 12, fontWeight: '700', textAlign: 'center' },
});
