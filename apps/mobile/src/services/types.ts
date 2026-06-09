/**
 * Frontend domain types. These mirror the backend entities (the per-module
 * entity files under apps/api) and the enums in `@wyden/shared`, while also
 * carrying the UI-only presentation fields the design needs (category
 * icon/color, bank short/color tiles, grouped-by-day labels).
 */
import {
  TransactionTypeEnum,
  CategoryTypeEnum,
  GoalStatusEnum,
  InsightTypeEnum,
} from '@wyden/shared';
import type { IconName } from '../components/Icon';

export {
  TransactionTypeEnum,
  CategoryTypeEnum,
  GoalStatusEnum,
  InsightTypeEnum,
};

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
  weeklyPattern: { day: string; value: number; hot?: boolean }[];
  metrics: { label: string; value: string; tone: 'orange' | 'purple'; sub: string }[];
  tip: { title: string; body: string };
}
