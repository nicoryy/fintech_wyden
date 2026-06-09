/**
 * Design tokens — single source of truth for colors, radii and shadows.
 * Mirrors the CSS `:root` custom properties from the design prototype
 * (`design_bundle/.../finance-app.html`). These exact hex values are the
 * pixel-perfect reference. Tailwind/NativeWind utilities derive from the same
 * palette in `tailwind.config.js`; for precise numeric values (font sizes,
 * letter spacing, custom shadows) components use inline styles built on these.
 */

import { Platform, type ViewStyle } from 'react-native';

export const colors = {
  bg: '#F3F4F6',
  card: '#FFFFFF',
  ink: '#1B1D21',
  ink2: '#62686F',
  muted: '#9AA0A7',
  line: '#ECEEF0',

  orange: '#F0742B',
  orangeWash: '#FDEEE3',

  // purple family — EXCLUSIVE to behavioral insight UI
  purple: '#7C5CFC',
  purpleInk: '#6A45E8',
  purpleWash: '#F3F0FE',
  purpleLine: '#E2DBFC',
  purpleChip: '#EBE5FE',

  segBg: '#EAECEF',

  // green / accent family (in the prototype these are runtime-derived from the
  // accent tweak; we fix them to the brand green #17A06A)
  green: '#17A06A',
  greenInk: '#17A06A',
  greenWash: 'rgba(23,160,106,0.078)', // #17A06A14 (alpha 0x14 = 20/255)
  greenWash2: 'rgba(23,160,106,0.125)', // #17A06A20 (alpha 0x20 = 32/255)

  white: '#FFFFFF',
} as const;

export const radii = {
  card: 22,
} as const;

/**
 * Convert a 6-digit hex + 8-bit alpha hex (e.g. '1F') into an rgba string.
 * Used to reproduce the prototype's `color + '1F'` icon-chip washes.
 */
export function withAlpha(hex: string, alphaHex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const a = parseInt(alphaHex, 16) / 255;
  return `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;
}

/**
 * Cross-platform soft shadow matching the card boxShadow in the prototype:
 * `0 1px 2px rgba(20,30,40,.04), 0 6px 20px rgba(20,30,40,.05)`.
 * RN can't stack two shadows, so we approximate with the larger one.
 */
export const cardShadow: ViewStyle = Platform.select({
  ios: {
    shadowColor: 'rgb(20,30,40)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
  },
  android: { elevation: 3 },
  default: {
    // web (expo export) — supports CSS-like boxShadow via RN-Web
    boxShadow: '0 1px 2px rgba(20,30,40,.04), 0 6px 20px rgba(20,30,40,.05)',
  },
}) as ViewStyle;

/** Smaller elevation used by header buttons / floating tiles. */
export const tileShadow: ViewStyle = Platform.select({
  ios: {
    shadowColor: 'rgb(20,30,40)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  android: { elevation: 2 },
  default: { boxShadow: '0 2px 10px rgba(20,30,40,.08)' },
}) as ViewStyle;
