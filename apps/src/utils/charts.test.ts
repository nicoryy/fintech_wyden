import { donutSegments, sparkPaths, type DonutSlice } from './charts';

describe('sparkPaths', () => {
  const vals = [0.2, 0.5, 0.8, 0.6];
  const w = 100;
  const h = 50;
  const pad = 4;

  it('starts the line path with a moveto at the first point', () => {
    const { line } = sparkPaths(vals, w, h, pad);
    // first x is the left padding; y is mapped from vals[0]
    const firstY = h - pad - vals[0] * (h - pad * 2);
    expect(line.startsWith(`M ${pad} ${firstY}`)).toBe(true);
  });

  it('emits one cubic segment per value after the first', () => {
    const { line } = sparkPaths(vals, w, h, pad);
    const cubics = line.match(/C /g) ?? [];
    expect(cubics).toHaveLength(vals.length - 1);
  });

  it('closes the area path back to the baseline', () => {
    const { area, line } = sparkPaths(vals, w, h, pad);
    expect(area.startsWith(line)).toBe(true);
    expect(area.endsWith('Z')).toBe(true);
  });

  it('reports the last point coordinates', () => {
    const { lastX, lastY } = sparkPaths(vals, w, h, pad);
    expect(lastX).toBeCloseTo(w - pad); // last x is the right padding edge
    expect(lastY).toBeCloseTo(h - pad - vals[vals.length - 1] * (h - pad * 2));
  });

  it('maps higher values to smaller y (SVG y grows downward)', () => {
    // a max value (1) should sit at the top (y = pad), a min (0) at the bottom
    const top = sparkPaths([1, 1], 10, 10, 0);
    const bottom = sparkPaths([0, 0], 10, 10, 0);
    expect(top.lastY).toBeLessThan(bottom.lastY);
  });
});

describe('donutSegments', () => {
  const slices: DonutSlice[] = [
    { pct: 50, color: '#111111' },
    { pct: 30, color: '#222222' },
    { pct: 20, color: '#333333' },
  ];

  it('returns one segment per slice', () => {
    const seg = donutSegments(slices, 54, 54, 40, 12);
    expect(seg).toHaveLength(slices.length);
  });

  it('preserves each slice color and thickness', () => {
    const seg = donutSegments(slices, 54, 54, 40, 12);
    expect(seg.map((s) => s.color)).toEqual(['#111111', '#222222', '#333333']);
    expect(seg.every((s) => s.thick === 12)).toBe(true);
  });

  it('produces an arc (A) path command for each segment', () => {
    const seg = donutSegments(slices, 54, 54, 40, 12);
    expect(seg.every((s) => /M .+ A /.test(s.d))).toBe(true);
  });

  it('sets the large-arc flag per slice by its share of the circle', () => {
    // 25% → 90° (not large, flag 0); 75% → 270° (> 180°, large, flag 1).
    const seg = donutSegments(
      [
        { pct: 25, color: '#aaa' },
        { pct: 75, color: '#bbb' },
      ],
      54,
      54,
      40,
      12,
      0,
    );
    expect(seg[0].d).toContain('A 40 40 0 0 1'); // small slice
    expect(seg[1].d).toContain('A 40 40 0 1 1'); // large slice
  });
});
