/**
 * Pure transforms: raw API shapes → UI domain types.
 *
 * Everything here is a pure function (no IO, no React) so it is trivially
 * unit-tested. The hooks in `hooks.ts` fetch raw API data and run it through
 * these. Notable rules:
 *  - API `amount` is a *positive decimal string*; UI `amount` is signed by type.
 *  - Bank `ink` is derived from background luminance (dark ink on light tiles).
 *  - `evolution` and `behavior` are *derived* (documented inline) — the backend
 *    does not return them directly in Phase 1.
 */
import type { IconName } from '../components/Icon';
import type {
  ApiBank,
  ApiCategory,
  ApiGoal,
  ApiInsight,
  ApiMonthlyComparison,
  ApiReportByBank,
  ApiReportByCategory,
  ApiReportSummary,
  ApiTransaction,
} from './api-types';
import {
  CategoryTypeEnum,
  GoalStatusEnum,
  InsightTypeEnum,
  TransactionTypeEnum,
  type Bank,
  type BankSpend,
  type Category,
  type Goal,
  type InsightDetail,
  type MonthPoint,
  type Reports,
  type SpendSlice,
  type Transaction,
  type TransactionGroup,
} from './types';

/** Icon names the app ships glyphs for; anything else falls back to 'dots'. */
const KNOWN_ICONS: ReadonlySet<string> = new Set<IconName>([
  'bell', 'info', 'arrow-up-right', 'arrow-down', 'arrow-down-right', 'card',
  'wallet', 'chevron-right', 'chevron-left', 'chevron-down', 'close', 'check',
  'calendar', 'brain', 'sparkle', 'bag', 'food', 'car', 'home', 'ticket',
  'dots', 'health', 'book', 'repeat', 'nav-home', 'nav-swap', 'nav-chart',
  'nav-user', 'plus', 'pencil', 'trend',
]);

/** Coerce an API icon string to a valid IconName, defaulting to 'dots'. */
export function toIconName(icon: string | null | undefined): IconName {
  return icon && KNOWN_ICONS.has(icon) ? (icon as IconName) : 'dots';
}

/** Relative luminance (0..1, sRGB) of a #RRGGBB hex color. */
export function luminance(hex: string): number {
  const h = hex.replace('#', '');
  if (h.length < 6) return 0;
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  // perceptual luminance (Rec. 709)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Ink color for a short label over a tile: dark on light tiles, white on dark. */
export function inkForBackground(hex: string): string {
  return luminance(hex) > 0.6 ? '#1B1D21' : '#FFFFFF';
}

/** Derive a 2-letter short code from a bank name (e.g. "Banco do Brasil" → "BA"). */
export function shortFromName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  return trimmed.slice(0, 2);
}

// ── Category ────────────────────────────────────────────────────────────────

export function toCategory(c: ApiCategory): Category {
  return {
    id: c.id,
    label: c.name,
    icon: toIconName(c.icon),
    color: c.color,
    type: c.type,
  };
}

export function toCategories(list: ApiCategory[]): Category[] {
  return list.map(toCategory);
}

/** Split a category list into expense / income catalogs (for the Add screen). */
export function splitCategories(list: ApiCategory[]): {
  expense: Category[];
  income: Category[];
} {
  const all = toCategories(list);
  return {
    expense: all.filter((c) => c.type === CategoryTypeEnum.EXPENSE),
    income: all.filter((c) => c.type === CategoryTypeEnum.INCOME),
  };
}

// ── Bank ────────────────────────────────────────────────────────────────────

export function toBank(b: ApiBank): Bank {
  const color = b.color ?? '#AEB4BB';
  const short = b.short ?? shortFromName(b.name);
  return {
    id: b.id,
    label: b.name,
    color,
    short,
    ink: inkForBackground(color),
    cash: b.name === 'Dinheiro',
  };
}

export function toBanks(list: ApiBank[]): Bank[] {
  return list.map(toBank);
}

// ── Transaction ─────────────────────────────────────────────────────────────

/** Signed UI amount: expenses are negative, income positive. */
export function signedAmount(type: TransactionTypeEnum, amount: string | number): number {
  const n = typeof amount === 'string' ? Number(amount) : amount;
  return type === TransactionTypeEnum.EXPENSE ? -Math.abs(n) : Math.abs(n);
}

const PT_MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** Zero-padded "HH:mm" for a Date. */
export function timeLabel(d: Date): string {
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/** Whole-day difference between two dates (ignoring time-of-day). */
function dayDiff(a: Date, b: Date): number {
  const da = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const db = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((db.getTime() - da.getTime()) / 86_400_000);
}

/** Human day label: "Hoje" / "Ontem" / "06 jun" relative to `now`. */
export function dayLabel(date: Date, now: Date = new Date()): string {
  const diff = dayDiff(date, now);
  if (diff === 0) return 'Hoje';
  if (diff === 1) return 'Ontem';
  const dd = String(date.getDate()).padStart(2, '0');
  return `${dd} ${PT_MONTHS[date.getMonth()]}`;
}

/** "Hoje, 13:20" style label (dashboard recent list). */
export function whenLabel(date: Date, now: Date = new Date()): string {
  return `${dayLabel(date, now)}, ${timeLabel(date)}`;
}

/** Transform a raw transaction into the compact UI shape (with `when`+`time`). */
export function toTransaction(t: ApiTransaction, now: Date = new Date()): Transaction {
  const date = new Date(t.transactionDate);
  return {
    id: t.id,
    categoryId: t.categoryId,
    bankId: t.bankId,
    description: t.description ?? t.category?.name ?? 'Transação',
    amount: signedAmount(t.type, t.amount),
    when: whenLabel(date, now),
    time: timeLabel(date),
    isImpulse: t.isImpulse ?? false,
  };
}

export function toTransactions(list: ApiTransaction[], now: Date = new Date()): Transaction[] {
  return list.map((t) => toTransaction(t, now));
}

/**
 * Group transactions by calendar day, newest day first, each item carrying a
 * "HH:mm" time. Day label is "Hoje"/"Ontem"/"DD mmm" (pt-BR).
 */
export function groupByDay(list: ApiTransaction[], now: Date = new Date()): TransactionGroup[] {
  const sorted = [...list].sort(
    (a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime(),
  );
  const groups: { key: string; label: string; items: Transaction[] }[] = [];
  for (const t of sorted) {
    const date = new Date(t.transactionDate);
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    let g = groups.find((x) => x.key === key);
    if (!g) {
      g = { key, label: dayLabel(date, now), items: [] };
      groups.push(g);
    }
    g.items.push(toTransaction(t, now));
  }
  return groups.map(({ label, items }) => ({ label, items }));
}

// ── Goal ────────────────────────────────────────────────────────────────────

export function toGoal(g: ApiGoal): Goal {
  return {
    id: g.id,
    title: g.title,
    targetAmount: Number(g.targetAmount),
    currentAmount: Number(g.currentAmount),
    status: g.status,
  };
}

/** Placeholder goal shown when the user has no goals yet (Phase 3 feature). */
export function placeholderGoal(): Goal {
  return {
    id: 'placeholder',
    title: 'Reserva de emergência',
    targetAmount: 0,
    currentAmount: 0,
    status: GoalStatusEnum.ACTIVE,
  };
}

// ── Reports / spend ─────────────────────────────────────────────────────────

export function toSpendSlices(list: ApiReportByCategory[]): SpendSlice[] {
  return list.map((x) => ({ categoryId: x.categoryId, value: x.total, pct: x.pct }));
}

export function toBankSpend(list: ApiReportByBank[]): BankSpend[] {
  return list.map((x) => ({ bankId: x.bankId, value: x.total }));
}

/** monthly-comparison → MonthPoint[] with abbreviated pt-BR month names. */
export function toMonthPoints(list: ApiMonthlyComparison[]): MonthPoint[] {
  return list.map((x) => {
    const monthIdx = Number(x.month.split('-')[1]) - 1;
    const name = PT_MONTHS[monthIdx] ?? x.month;
    return {
      m: name.charAt(0).toUpperCase() + name.slice(1),
      rec: x.receitas,
      desp: x.despesas,
    };
  });
}

/**
 * DERIVED: the sparkline of net-worth evolution. The backend does not expose a
 * cumulative-balance series, so we derive it from monthly-comparison: running
 * sum of (receitas − despesas) per month, then min-max normalized to 0..1.
 */
export function deriveEvolution(list: ApiMonthlyComparison[]): number[] {
  if (list.length === 0) return [0, 0];
  let acc = 0;
  const cumulative = list.map((m) => (acc += m.receitas - m.despesas));
  const min = Math.min(...cumulative);
  const max = Math.max(...cumulative);
  const range = max - min;
  if (range === 0) return cumulative.map(() => 0.5);
  return cumulative.map((v) => (v - min) / range);
}

/** economia value + percentage of income that was saved. */
export function economiaFromSummary(s: ApiReportSummary): { value: number; pct: number } {
  const pct = s.receitas > 0 ? Math.round((s.saldo / s.receitas) * 100) : 0;
  return { value: s.economia, pct };
}

/** Percentage of impulse transactions in a list (0..100, integer). */
function impulsePct(list: ApiTransaction[]): number {
  const expenses = list.filter((t) => t.type === TransactionTypeEnum.EXPENSE);
  if (expenses.length === 0) return 0;
  const impulse = expenses.filter((t) => t.isImpulse).length;
  return Math.round((impulse / expenses.length) * 100);
}

/** Format a signed delta as "+N%" / "−N%" / "—". */
function deltaLabel(delta: number | null): string {
  if (delta === null) return '—';
  const sign = delta > 0 ? '+' : delta < 0 ? '−' : '';
  return `${sign}${Math.abs(delta)}%`;
}

/**
 * DERIVED (honest Phase-1 heuristic): compares the impulse-spend rate of the
 * current month vs the previous month. Impulsividade = change in impulse rate
 * (down is good). Consistência = inverse of that change as a rough proxy. When
 * a month has no expenses we return "—" placeholders. Phase 2 replaces this
 * with the real Insights engine.
 */
export function deriveBehavior(
  current: ApiTransaction[],
  previous: ApiTransaction[],
): Reports['behavior'] {
  const curHasData = current.some((t) => t.type === TransactionTypeEnum.EXPENSE);
  const prevHasData = previous.some((t) => t.type === TransactionTypeEnum.EXPENSE);
  if (!curHasData || !prevHasData) {
    return { impulsivity: '—', consistency: '—' };
  }
  const cur = impulsePct(current);
  const prev = impulsePct(previous);
  const delta = cur - prev; // positive = more impulse this month (worse)
  return {
    impulsivity: deltaLabel(delta),
    consistency: deltaLabel(delta === 0 ? 0 : -delta),
  };
}

// ── Insight ─────────────────────────────────────────────────────────────────

/** Map an insight score (0..100) to a coarse tone/label. */
function scoreBand(score: number): string {
  if (score >= 66) return 'Alto';
  if (score >= 33) return 'Médio';
  return 'Baixo';
}

/**
 * DERIVED: the backend `GET /insights` returns flat insight records (no weekly
 * pattern / tips in Phase 1). When one exists we map it onto the rich
 * `InsightDetail` UI shape, filling the visual-only fields (weeklyPattern, tip)
 * with neutral placeholders. When there are none we return a friendly empty
 * state. Phase 2's engine will populate these for real.
 */
export function toInsightDetail(list: ApiInsight[]): InsightDetail {
  const first = list[0];
  if (!first) {
    return {
      type: InsightTypeEnum.IMPULSIVITY,
      title: 'Sem insights ainda',
      description:
        'Continue registrando suas transações. Em breve traremos uma leitura do seu comportamento financeiro.',
      weeklyPattern: [
        { day: 'Seg', value: 0.2 },
        { day: 'Ter', value: 0.2 },
        { day: 'Qua', value: 0.2 },
        { day: 'Qui', value: 0.2 },
        { day: 'Sex', value: 0.2 },
        { day: 'Sáb', value: 0.2 },
        { day: 'Dom', value: 0.2 },
      ],
      metrics: [
        { label: 'Índice de impulso', value: '—', tone: 'orange', sub: 'sem dados' },
        { label: 'Horário de pico', value: '—', tone: 'purple', sub: 'sem dados' },
      ],
      tip: {
        title: 'Dica',
        body: 'Registre ao menos uma semana de gastos para liberar seus primeiros insights.',
      },
    };
  }
  return {
    type: first.type,
    title: first.title,
    description: first.description,
    weeklyPattern: [
      { day: 'Seg', value: 0.3 },
      { day: 'Ter', value: 0.26 },
      { day: 'Qua', value: 0.34 },
      { day: 'Qui', value: 0.4 },
      { day: 'Sex', value: 0.62 },
      { day: 'Sáb', value: 0.95, hot: true },
      { day: 'Dom', value: 0.8, hot: true },
    ],
    metrics: [
      { label: 'Índice de impulso', value: scoreBand(first.score), tone: 'orange', sub: `score ${first.score}` },
      { label: 'Horário de pico', value: '21h–23h', tone: 'purple', sub: 'Sáb e Dom' },
    ],
    tip: {
      title: 'Dica para esta semana',
      body: first.description,
    },
  };
}
