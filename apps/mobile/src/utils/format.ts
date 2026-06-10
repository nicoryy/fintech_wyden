/**
 * Currency formatting helpers — ported verbatim from the prototype `data.jsx`.
 * Pure functions, no UI. Centralized so no screen re-implements BRL formatting.
 */

/**
 * Format a number as `R$ 1.234,56`. With `sign`, prefixes `+ ` / `- `.
 * Uses the ASCII hyphen-minus (U+002D) rather than the Unicode minus (U+2212),
 * which Plus Jakarta Sans does not include (it rendered as a missing-glyph box).
 */
export function brl(n: number, opts: { sign?: boolean } = {}): string {
  const { sign = false } = opts;
  const v = Math.abs(n).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const s = sign ? (n < 0 ? '- ' : '+ ') : '';
  return `${s}R$ ${v}`;
}

/** Split into integer / decimal parts for the big balance display. */
export function brlParts(n: number): { int: string; dec: string } {
  const [int, dec] = Math.abs(n)
    .toLocaleString('pt-BR', { minimumFractionDigits: 2 })
    .split(',');
  return { int, dec: dec ?? '00' };
}
