/**
 * Impulse-purchase detection — ported from the old API's
 * `TransactionsService.detectImpulse`, using the device's local time instead
 * of a fixed America/Sao_Paulo (UTC-3) offset: there's no separate server
 * anymore, so "local" is unambiguous — it's the phone the transaction was
 * entered on.
 *
 * An EXPENSE is flagged as impulse when it happens at night (>= 20:00) or on
 * a weekend, AND its amount is above the average of the user's own expenses
 * in the 7 days before it. With no expense history in that window, the
 * fallback threshold is R$ 100 (10000 cents) — same as the old API.
 */
import { TransactionTypeEnum } from '../services/types';

const NIGHT_HOUR = 20;
const FALLBACK_AMOUNT_CENTS = 10_000; // R$ 100
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export interface ImpulseInput {
  type: TransactionTypeEnum;
  amountCents: number;
  /** epoch ms */
  occurredAt: number;
}

/**
 * `recentExpenseCents` are the user's EXPENSE amounts from the 7 days
 * strictly before `input.occurredAt` (see {@link sevenDaysBefore}).
 */
export function detectImpulse(input: ImpulseInput, recentExpenseCents: number[]): boolean {
  if (input.type !== TransactionTypeEnum.EXPENSE) return false;

  const date = new Date(input.occurredAt);
  const hour = date.getHours();
  const weekday = date.getDay(); // 0 = Sunday, 6 = Saturday
  const isNight = hour >= NIGHT_HOUR;
  const isWeekend = weekday === 0 || weekday === 6;
  if (!isNight && !isWeekend) return false;

  if (recentExpenseCents.length === 0) return input.amountCents > FALLBACK_AMOUNT_CENTS;

  const total = recentExpenseCents.reduce((sum, c) => sum + c, 0);
  const average = total / recentExpenseCents.length;
  return input.amountCents > average;
}

/** Start of the 7-day lookback window ending at (but excluding) `occurredAt`. */
export function sevenDaysBefore(occurredAt: number): number {
  return occurredAt - SEVEN_DAYS_MS;
}
