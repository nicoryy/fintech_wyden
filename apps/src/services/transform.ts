/**
 * Pure transforms: local SQLite records (and their in-memory aggregations
 * from `src/data/reports.ts`) → UI domain types. Everything here is a pure
 * function (no IO, no React) so it is trivially unit-tested. `hooks.ts` reads
 * from `src/data/*` and runs the results through these. Notable rules:
 *  - Records store money in *integer cents*; UI amounts are in reais.
 *  - UI `Transaction.amount` is signed by type (expense → negative).
 *  - Bank `ink` is derived from background luminance (dark ink on light tiles).
 */
import type { IconName } from '../components/Icon';
import type { BankTotal, CategoryTotal, MonthTotal } from '../data/reports';
import type { BankRecord, CategoryRecord, GoalRecord, TransactionRecord } from '../data/records';
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
  'nav-user', 'plus', 'pencil', 'trend', 'logout', 'shield', 'target',
  'download', 'help',
]);

/** Coerce a stored icon string to a valid IconName, defaulting to 'dots'. */
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

export function toCategory(c: CategoryRecord): Category {
  return {
    id: c.id,
    label: c.name,
    icon: toIconName(c.icon),
    color: c.color ?? '#AEB4BB',
    type: c.type,
  };
}

export function toCategories(list: CategoryRecord[]): Category[] {
  return list.map(toCategory);
}

/** Split a category list into expense / income catalogs (for the Add screen). */
export function splitCategories(list: CategoryRecord[]): {
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

export function toBank(b: BankRecord): Bank {
  const color = b.color ?? '#AEB4BB';
  const short = b.short ?? shortFromName(b.name);
  return {
    id: b.id,
    label: b.name,
    color,
    short,
    ink: inkForBackground(color),
    cash: b.name === 'Dinheiro',
    balance: b.balanceCents / 100,
  };
}

export function toBanks(list: BankRecord[]): Bank[] {
  return list.map(toBank);
}

// ── Transaction ─────────────────────────────────────────────────────────────

/** Signed UI amount (reais): expenses are negative, income positive. */
export function signedAmount(type: TransactionTypeEnum, amount: number): number {
  return type === TransactionTypeEnum.EXPENSE ? -Math.abs(amount) : Math.abs(amount);
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

/** Transform a stored transaction into the compact UI shape (with `when`+`time`). */
export function toTransaction(t: TransactionRecord, now: Date = new Date()): Transaction {
  const date = new Date(t.occurredAt);
  return {
    id: t.id,
    categoryId: t.categoryId,
    bankId: t.bankId,
    description: t.description ?? t.categoryName ?? 'Transação',
    amount: signedAmount(t.type, t.amountCents / 100),
    when: whenLabel(date, now),
    time: timeLabel(date),
    isImpulse: t.isImpulse,
  };
}

export function toTransactions(list: TransactionRecord[], now: Date = new Date()): Transaction[] {
  return list.map((t) => toTransaction(t, now));
}

/**
 * Group transactions by calendar day, newest day first, each item carrying a
 * "HH:mm" time. Day label is "Hoje"/"Ontem"/"DD mmm" (pt-BR).
 */
export function groupByDay(list: TransactionRecord[], now: Date = new Date()): TransactionGroup[] {
  const sorted = [...list].sort((a, b) => b.occurredAt - a.occurredAt);
  const groups: { key: string; label: string; items: Transaction[] }[] = [];
  for (const t of sorted) {
    const date = new Date(t.occurredAt);
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

export function toGoal(g: GoalRecord): Goal {
  return {
    id: g.id,
    title: g.title,
    targetAmount: g.targetCents / 100,
    currentAmount: g.currentCents / 100,
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

export function toSpendSlices(list: CategoryTotal[]): SpendSlice[] {
  return list.map((x) => ({ categoryId: x.categoryId, value: x.totalCents / 100, pct: x.pct }));
}

export function toBankSpend(list: BankTotal[]): BankSpend[] {
  return list.map((x) => ({ bankId: x.bankId, value: x.totalCents / 100 }));
}

/** monthly totals → MonthPoint[] with abbreviated pt-BR month names. */
export function toMonthPoints(list: MonthTotal[]): MonthPoint[] {
  return list.map((x) => {
    const monthIdx = Number(x.month.split('-')[1]) - 1;
    const name = PT_MONTHS[monthIdx] ?? x.month;
    return {
      m: name.charAt(0).toUpperCase() + name.slice(1),
      rec: x.receitasCents / 100,
      desp: x.despesasCents / 100,
    };
  });
}

/**
 * DERIVED: the sparkline of net-worth evolution. There's no cumulative-balance
 * series stored, so we derive it from the monthly totals: running sum of
 * (receitas − despesas) per month, then min-max normalized to 0..1.
 */
export function deriveEvolution(list: MonthTotal[]): number[] {
  if (list.length === 0) return [0, 0];
  let acc = 0;
  const cumulative = list.map((m) => (acc += m.receitasCents - m.despesasCents));
  const min = Math.min(...cumulative);
  const max = Math.max(...cumulative);
  const range = max - min;
  if (range === 0) return cumulative.map(() => 0.5);
  return cumulative.map((v) => (v - min) / range);
}

/**
 * DERIVED: change in the monthly net (receitas − despesas) of the latest month
 * vs the one before it, in reais. Returns null when there isn't enough
 * activity to make a meaningful comparison (fewer than two months, or both
 * months empty) so the UI can hide the "vs. mês anterior" line for new
 * accounts instead of showing a fabricated number.
 */
export function deriveSaldoDelta(list: MonthTotal[]): number | null {
  if (list.length < 2) return null;
  const cur = list[list.length - 1];
  const prev = list[list.length - 2];
  const hasActivity = [cur, prev].some((m) => m.receitasCents !== 0 || m.despesasCents !== 0);
  if (!hasActivity) return null;
  const curNetCents = cur.receitasCents - cur.despesasCents;
  const prevNetCents = prev.receitasCents - prev.despesasCents;
  return (curNetCents - prevNetCents) / 100;
}

const MONTHS_FULL = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

/** "YYYY-MM" → "Junho 2026" (full pt-BR month + year). */
export function monthLabelPt(month: string): string {
  const [y, m] = month.split('-').map(Number);
  const name = MONTHS_FULL[m - 1] ?? month;
  return `${name} ${y}`;
}

/** "YYYY-MM" → just the full month name, e.g. "junho" (lowercase). */
export function monthNamePt(month: string): string {
  const m = Number(month.split('-')[1]);
  return (MONTHS_FULL[m - 1] ?? month).toLowerCase();
}

/** Shift a "YYYY-MM" month by `delta` months (can be negative). */
export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * economia (saved = receitas − despesas) aggregated over the last `monthsBack`
 * buckets of monthly totals, plus the % of income saved, in reais. Backs the
 * period filter (Mês = 1, Trimestre = 3, Ano = 12).
 */
export function economiaForPeriod(
  list: MonthTotal[],
  monthsBack: number,
): { value: number; pct: number } {
  const window = monthsBack >= list.length ? list : list.slice(-monthsBack);
  const receitasCents = window.reduce((s, m) => s + m.receitasCents, 0);
  const despesasCents = window.reduce((s, m) => s + m.despesasCents, 0);
  const valueCents = receitasCents - despesasCents;
  const pct = receitasCents > 0 ? Math.round((valueCents / receitasCents) * 100) : 0;
  return { value: valueCents / 100, pct };
}

/** Percentage of impulse transactions in a list (0..100, integer). */
function impulsePct(list: TransactionRecord[]): number {
  const expenses = list.filter((t) => t.type === TransactionTypeEnum.EXPENSE);
  if (expenses.length === 0) return 0;
  const impulse = expenses.filter((t) => t.isImpulse).length;
  return Math.round((impulse / expenses.length) * 100);
}

/** Format a signed delta as "+N%" / "-N%" / "—" (ASCII '-', see brl). */
function deltaLabel(delta: number | null): string {
  if (delta === null) return '—';
  const sign = delta > 0 ? '+' : delta < 0 ? '-' : '';
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
  current: TransactionRecord[],
  previous: TransactionRecord[],
): { impulsivity: string; consistency: string } {
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

/** Shape a locally-computed insight would have (Phase 2 — see hooks.ts). */
export interface LocalInsight {
  type: InsightTypeEnum;
  score: number;
  title: string;
  description: string;
}

/** Map an insight score (0..100) to a coarse tone/label. */
function scoreBand(score: number): string {
  if (score >= 66) return 'Alto';
  if (score >= 33) return 'Médio';
  return 'Baixo';
}

/**
 * The old backend never actually generated insights (`GET /insights` always
 * returned `[]`); the local Phase-1 port keeps that honest behavior — `hooks.ts`
 * always calls this with an empty list today. Once the Fase 2 engine computes
 * real per-user insights locally, it can hand its output straight to this same
 * mapping (only the score-derived metric below has ever had real data behind
 * it — no fabricated `weeklyPattern` or peak-hour metric).
 */
export function toInsightDetail(list: LocalInsight[]): InsightDetail {
  const first = list[0];
  if (!first) {
    return {
      type: InsightTypeEnum.IMPULSIVITY,
      title: 'Sem insights ainda',
      description:
        'Continue registrando suas transações. Em breve traremos uma leitura do seu comportamento financeiro.',
    };
  }
  return {
    type: first.type,
    title: first.title,
    description: first.description,
    metrics: [
      { label: 'Índice de impulso', value: scoreBand(first.score), tone: 'orange', sub: `score ${first.score}` },
    ],
    tip: {
      title: 'Dica para esta semana',
      body: first.description,
    },
  };
}
