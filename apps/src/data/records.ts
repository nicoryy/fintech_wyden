/**
 * Local domain records — one per SQLite row shape, as read out of `src/data`.
 * Replaces the old `services/api-types.ts` (the raw NestJS wire shapes); the
 * pure transforms in `services/transform.ts` turn these into the UI-facing
 * types in `services/types.ts`.
 *
 * Money is stored and passed around here in **integer cents**; dates are
 * **epoch milliseconds** (`Date.now()` / `Date#getTime()`). Only the transform
 * layer converts cents → reais for the UI.
 */
import type { CategoryTypeEnum, GoalStatusEnum, TransactionTypeEnum } from '../services/types';

export interface CategoryRecord {
  id: string;
  name: string;
  type: CategoryTypeEnum;
  icon: string | null;
  color: string | null;
}

export interface BankRecord {
  id: string;
  name: string;
  short: string | null;
  color: string | null;
  initialBalanceCents: number;
  /** `initialBalanceCents + Σincome − Σexpense`, computed at read time. */
  balanceCents: number;
}

export interface TransactionRecord {
  id: string;
  bankId: string;
  categoryId: string;
  /** denormalized at read time so list screens don't need a separate lookup */
  categoryName: string;
  amountCents: number;
  type: TransactionTypeEnum;
  description: string | null;
  /** epoch ms */
  occurredAt: number;
  isImpulse: boolean;
}

export interface GoalRecord {
  id: string;
  title: string;
  targetCents: number;
  currentCents: number;
  /** epoch ms, or null when the goal has no deadline */
  deadline: number | null;
  status: GoalStatusEnum;
}

export interface ProfileRecord {
  /** null until onboarding (Welcome) has saved a name */
  name: string | null;
}
