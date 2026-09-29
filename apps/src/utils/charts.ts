/**
 * Chart geometry generators — ported verbatim from the prototype `data.jsx`.
 * Pure functions returning SVG path strings; consumed by the chart components
 * in `src/components/charts`.
 */

export interface SparkPaths {
  line: string;
  area: string;
  lastX: number;
  lastY: number;
}

/**
 * Smooth sparkline. Given values in 0..1 and a w×h box, returns the line path,
 * a closed area path (for the gradient fill) and the last point coordinates.
 */
export function sparkPaths(
  vals: number[],
  w: number,
  h: number,
  pad = 2,
): SparkPaths {
  const n = vals.length;
  const x = (i: number) => pad + (i / (n - 1)) * (w - pad * 2);
  const y = (v: number) => h - pad - v * (h - pad * 2);
  let d = `M ${x(0)} ${y(vals[0])}`;
  for (let i = 1; i < n; i++) {
    const xc = (x(i - 1) + x(i)) / 2;
    d += ` C ${xc} ${y(vals[i - 1])} ${xc} ${y(vals[i])} ${x(i)} ${y(vals[i])}`;
  }
  const area = `${d} L ${x(n - 1)} ${h} L ${x(0)} ${h} Z`;
  return { line: d, area, lastX: x(n - 1), lastY: y(vals[n - 1]) };
}

export interface DonutSlice {
  pct: number;
  color: string;
}

export interface DonutSegment {
  d: string;
  color: string;
  thick: number;
}

/**
 * Donut arc segments. Returns one rounded stroke arc per slice, starting at the
 * top (-90°) and laid out clockwise with a small angular gap between slices.
 */
export function donutSegments(
  slices: DonutSlice[],
  cx: number,
  cy: number,
  r: number,
  thick: number,
  gap = 3,
): DonutSegment[] {
  const seg: DonutSegment[] = [];
  let a = -90; // start at top
  const total = slices.reduce((s, x) => s + x.pct, 0);
  slices.forEach((s) => {
    const sweep = (s.pct / total) * 360;
    const a0 = a + gap / 2;
    const a1 = a + sweep - gap / 2;
    const rad = (d: number) => (d * Math.PI) / 180;
    const x0 = cx + r * Math.cos(rad(a0));
    const y0 = cy + r * Math.sin(rad(a0));
    const x1 = cx + r * Math.cos(rad(a1));
    const y1 = cy + r * Math.sin(rad(a1));
    const large = a1 - a0 > 180 ? 1 : 0;
    seg.push({
      d: `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`,
      color: s.color,
      thick,
    });
    a += sweep;
  });
  return seg;
}
