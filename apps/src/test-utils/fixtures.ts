/**
 * Deterministic fixtures for hook/screen tests — inserted via
 * `data/transactions.ts` so tests exercise the real write path on top of the
 * default categories/banks every fresh database seeds (see `data/seeds.ts`).
 *
 * Dates are relative to `now` (defaults to `Date.now()`) rather than fixed
 * calendar dates: the hooks under test always compute "this month" from the
 * real clock too, so anchoring fixtures to it (instead of a hardcoded date)
 * keeps the tests correct regardless of when they actually run.
 */
import { createTransaction } from '../data/transactions';
import { TransactionTypeEnum } from '../services/types';

export const FIXTURE_SALARY_CENTS = 625_000; // R$ 6.250,00
export const FIXTURE_IFOOD_CENTS = 4_290; // R$ 42,90

/** One income + one expense in the current month — enough for summary/spend/recent to have data. */
export async function seedCurrentMonthFixtures(now: number = Date.now()): Promise<void> {
  await createTransaction({
    bankId: 'bb',
    categoryId: 'salario',
    amountCents: FIXTURE_SALARY_CENTS,
    type: TransactionTypeEnum.INCOME,
    description: 'Salário',
    occurredAt: now - 60_000,
  });
  await createTransaction({
    bankId: 'nubank',
    categoryId: 'alimentacao',
    amountCents: FIXTURE_IFOOD_CENTS,
    type: TransactionTypeEnum.EXPENSE,
    description: 'iFood',
    occurredAt: now,
  });
}
