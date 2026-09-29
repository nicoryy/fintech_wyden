/**
 * Frontend domain types. These mirror the local SQLite schema (`src/data`),
 * while also carrying the UI-only presentation fields the design needs
 * (category icon/color, bank short/color tiles, grouped-by-day labels).
 *
 * The four enums below used to live in the `@wyden/shared` workspace package,
 * shared with the (now removed) NestJS API — with no API left to share them
 * with, they're inlined here instead.
 */
import type { IconName } from '../components/Icon';

export enum TransactionTypeEnum {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export enum CategoryTypeEnum {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export enum GoalStatusEnum {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  PAUSED = 'paused',
}

export enum InsightTypeEnum {
  IMPULSIVITY = 'impulsivity',
  CONSISTENCY = 'consistency',
  PLANNING = 'planning',
  EMOTIONAL = 'emotional',
}

/** Category as consumed by the UI (icon + color come from the seed/design). */
export interface Category {
  id: string;
  label: string;
  icon: IconName;
  color: string;
  type: CategoryTypeEnum;
}

/** Bank tile (generic colored tile, not a brand logo). */
export interface Bank {
  id: string;
  label: string;
  color: string;
  short: string;
  /** ink color for short label when the tile background is light */
  ink?: string;
  cash?: boolean;
  /** current balance in reais, computed from local transactions at read time */
  balance?: number;
}

/** The single local "identity" — just the name collected by onboarding. */
export interface Profile {
  name: string | null;
}

/** Compact transaction shape used across dashboard / lists. */
export interface Transaction {
  id: string;
  categoryId: string;
  bankId: string;
  description: string;
  /** signed amount: negative = expense, positive = income */
  amount: number;
  /** human label like "Hoje, 13:20" (dashboard) */
  when?: string;
  /** time label like "13:20" (grouped list) */
  time?: string;
  isImpulse?: boolean;
}

/** A day-group of transactions for the Transações screen. */
export interface TransactionGroup {
  label: string;
  items: Transaction[];
}

/** Dashboard financial summary. */
export interface FinancialSummary {
  receitas: number;
  despesas: number;
  saldo: number;
}

/** Spend slice (category breakdown). */
export interface SpendSlice {
  categoryId: string;
  value: number;
  pct: number;
}

/** Monthly comparison datapoint. */
export interface MonthPoint {
  m: string;
  rec: number;
  desp: number;
}

/** Spend grouped by bank. */
export interface BankSpend {
  bankId: string;
  value: number;
}

/** Goal as consumed by the Sua meta card. */
export interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  status: GoalStatusEnum;
}

/** Full dashboard payload (one query for the Início screen). */
export interface Dashboard {
  summary: FinancialSummary;
  evolution: number[];
  /** DERIVED change in monthly net vs the previous month; null when there is
   *  not enough activity to compare (e.g. a brand-new account). */
  deltaSaldo: number | null;
  spend: SpendSlice[];
  goal: Goal;
  recent: Transaction[];
}

/** Reports screen payload. */
export interface Reports {
  economia: { value: number; pct: number };
  months: MonthPoint[];
  spend: SpendSlice[];
  byBank: BankSpend[];
  behavior: { impulsivity: string; consistency: string };
}

/** Behavioral insight detail (the differentiator). */
export interface InsightDetail {
  type: InsightTypeEnum;
  title: string;
  description: string;
  /**
   * Absent until the behavioral engine (Phase 2) can compute a real
   * per-weekday breakdown locally — there is nothing genuine to chart yet.
   * The UI should say that instead of rendering invented numbers as if they
   * were measurements.
   */
  weeklyPattern?: { day: string; value: number; hot?: boolean }[];
  metrics?: { label: string; value: string; tone: 'orange' | 'purple'; sub: string }[];
  tip?: { title: string; body: string };
}
