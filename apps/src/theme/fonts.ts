/**
 * Plus Jakarta Sans font map + named weights used across the app.
 * Loaded in the root layout via `useFonts`.
 */
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';

/** Map passed to `useFonts`. Keys are the family names used in styles. */
export const fontMap = {
  PlusJakarta_400Regular: PlusJakartaSans_400Regular,
  PlusJakarta_500Medium: PlusJakartaSans_500Medium,
  PlusJakarta_600SemiBold: PlusJakartaSans_600SemiBold,
  PlusJakarta_700Bold: PlusJakartaSans_700Bold,
  PlusJakarta_800ExtraBold: PlusJakartaSans_800ExtraBold,
};

/**
 * Font-family names keyed by the numeric weight the design uses. Because RN
 * does not synthesize weights from a single family, every weight maps to its
 * own loaded family so text renders identically to the prototype.
 */
export const font = {
  regular: 'PlusJakarta_400Regular',
  medium: 'PlusJakarta_500Medium',
  semibold: 'PlusJakarta_600SemiBold',
  bold: 'PlusJakarta_700Bold',
  extrabold: 'PlusJakarta_800ExtraBold',
} as const;

/**
 * Resolve a CSS-like fontWeight (400..800 or keyword) to the matching loaded
 * family. Lets components keep using `fontWeight` while getting the right face.
 */
export function familyForWeight(weight?: string | number): string {
  switch (String(weight)) {
    case '800':
    case '900':
      return font.extrabold;
    case '700':
    case 'bold':
      return font.bold;
    case '600':
      return font.semibold;
    case '500':
      return font.medium;
    default:
      return font.regular;
  }
}
