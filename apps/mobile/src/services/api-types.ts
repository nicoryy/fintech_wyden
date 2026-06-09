/**
 * Raw API response shapes (as returned by the NestJS backend under /api/v1).
 *
 * These mirror the wire format 1:1 — notably `amount` arrives as a *positive
 * decimal string* and the sign is carried by `type`. The pure functions in
 * `transform.ts` turn these into the UI domain types in `types.ts`.
 */
import type { CategoryTypeEnum, TransactionTypeEnum, GoalStatusEnum, InsightTypeEnum } from './types';

/** Authenticated user (GET /auth/me, login payload). */
export interface ApiUser {
  id: string;
  name: string;
  email: string;
}

/** POST /auth/login response. */
export interface ApiLoginResponse {
  access_token: string;
  refresh_token: string;
  user: ApiUser;
}

/** POST /auth/refresh response. */
export interface ApiRefreshResponse {
  access_token: string;
}

/** GET /categories item. */
export interface ApiCategory {
  id: string;
  name: string;
  type: CategoryTypeEnum;
  icon: string;
  color: string;
  created_at?: string;
}

/** GET /banks item. */
export interface ApiBank {
  id: string;
  name: string;
  short: string | null;
  color: string | null;
  initialBalance: string | number;
  currentBalance: string | number;
  createdAt?: string;
}

/** GET /transactions item. `amount` is a positive decimal string. */
export interface ApiTransaction {
  id: string;
  userId: string;
  bankId: string;
  categoryId: string;
  amount: string;
  type: TransactionTypeEnum;
  description?: string | null;
  transactionDate: string;
  isImpulse?: boolean;
  createdAt?: string;
  bank?: ApiBank;
  category?: ApiCategory;
}

/** POST /transactions body. */
export interface ApiCreateTransaction {
  bankId: string;
  categoryId: string;
  amount: number;
  type: TransactionTypeEnum;
  description?: string;
  transactionDate: string;
  isImpulse?: boolean;
}

/** GET /reports/summary response. */
export interface ApiReportSummary {
  receitas: number;
  despesas: number;
  saldo: number;
  economia: number;
}

/** GET /reports/by-category item. */
export interface ApiReportByCategory {
  categoryId: string;
  name: string;
  icon: string;
  color: string;
  total: number;
  pct: number;
}

/** GET /reports/by-bank item. */
export interface ApiReportByBank {
  bankId: string;
  name: string;
  total: number;
}

/** GET /reports/monthly-comparison item. */
export interface ApiMonthlyComparison {
  month: string; // 'YYYY-MM'
  receitas: number;
  despesas: number;
}

/** GET /goals item. */
export interface ApiGoal {
  id: string;
  title: string;
  targetAmount: string | number;
  currentAmount: string | number;
  deadline?: string | null;
  status: GoalStatusEnum;
}

/** GET /insights item. */
export interface ApiInsight {
  id: string;
  type: InsightTypeEnum;
  score: number;
  title: string;
  description: string;
  generatedAt?: string;
}
