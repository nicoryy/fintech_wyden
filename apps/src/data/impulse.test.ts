import { detectImpulse, sevenDaysBefore } from './impulse';
import { TransactionTypeEnum } from '../services/types';

// Local-time equivalents of the old API's fixed test dates (that version used
// a hardcoded America/Sao_Paulo/UTC-3 shift; this one uses the device's own
// local time — see impulse.ts). Confirmed calendar weekdays: Jan 17 2026 is a
// Saturday, Jan 14 2026 is a Wednesday.
const SATURDAY_NIGHT = new Date(2026, 0, 17, 22, 0).getTime(); // night & weekend
const WEDNESDAY_MORNING = new Date(2026, 0, 14, 10, 0).getTime(); // neither
const WEDNESDAY_EVENING = new Date(2026, 0, 14, 18, 0).getTime(); // still daytime — regression

describe('detectImpulse', () => {
  it('income is never impulse, even at night on a weekend with a huge amount', () => {
    expect(
      detectImpulse({ type: TransactionTypeEnum.INCOME, amountCents: 999_999, occurredAt: SATURDAY_NIGHT }, []),
    ).toBe(false);
  });

  it('a weekday daytime expense is never impulse, regardless of amount or history', () => {
    expect(
      detectImpulse({ type: TransactionTypeEnum.EXPENSE, amountCents: 999_999, occurredAt: WEDNESDAY_MORNING }, []),
    ).toBe(false);
  });

  it('regression: 18h on a weekday is still daytime, not night', () => {
    expect(
      detectImpulse({ type: TransactionTypeEnum.EXPENSE, amountCents: 999_999, occurredAt: WEDNESDAY_EVENING }, []),
    ).toBe(false);
  });

  describe('night/weekend, no 7-day history — fallback threshold R$ 100', () => {
    it('flags an amount above the fallback', () => {
      expect(
        detectImpulse({ type: TransactionTypeEnum.EXPENSE, amountCents: 15_000, occurredAt: SATURDAY_NIGHT }, []),
      ).toBe(true);
    });
    it('does not flag an amount at or below the fallback', () => {
      expect(
        detectImpulse({ type: TransactionTypeEnum.EXPENSE, amountCents: 10_000, occurredAt: SATURDAY_NIGHT }, []),
      ).toBe(false);
    });
  });

  describe('night/weekend with 7-day history — average of recent expenses', () => {
    it('flags an amount above the average (history [R$20, R$40] -> avg R$30)', () => {
      expect(
        detectImpulse(
          { type: TransactionTypeEnum.EXPENSE, amountCents: 5_000, occurredAt: SATURDAY_NIGHT },
          [2_000, 4_000],
        ),
      ).toBe(true);
    });
    it('does not flag an amount at or below the average (history [R$200, R$400] -> avg R$300)', () => {
      expect(
        detectImpulse(
          { type: TransactionTypeEnum.EXPENSE, amountCents: 30_000, occurredAt: SATURDAY_NIGHT },
          [20_000, 40_000],
        ),
      ).toBe(false);
    });
  });
});

describe('sevenDaysBefore', () => {
  it('returns exactly 7 days earlier', () => {
    const now = Date.UTC(2026, 0, 17);
    expect(sevenDaysBefore(now)).toBe(now - 7 * 24 * 60 * 60 * 1000);
  });
});
