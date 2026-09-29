/**
 * Backup file IO — the native-only glue between `data/backup.ts` (pure JSON
 * in/out) and the device's share sheet / document picker. Kept separate from
 * `data/` so the data layer stays pure and unit-testable without mocking the
 * filesystem.
 */
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

/** Writes `json` to a cache file and opens the system share sheet for it. */
export async function shareBackup(json: string): Promise<void> {
  const stamp = new Date().toISOString().slice(0, 10);
  const file = new File(Paths.cache, `wyden-backup-${stamp}.json`);
  if (file.exists) file.delete();
  file.create();
  file.write(json);

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Compartilhamento não disponível neste aparelho.');
  }
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Exportar backup do Wyden',
  });
}

/** Opens the document picker; returns the picked file's text, or `null` if canceled. */
export async function pickBackupText(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
  if (result.canceled || !result.assets?.[0]) return null;
  const file = new File(result.assets[0].uri);
  return file.text();
}
