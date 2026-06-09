import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import {
  Transaction,
  TransactionType,
} from '../transactions/entities/transaction.entity';
import {
  createMockRepo,
  makeTransaction,
  makeCategory,
  makeBank,
  MockRepo,
} from '../../test-utils/mock-repo';

describe('ReportsService', () => {
  let service: ReportsService;
  let repo: MockRepo<Transaction>;

  beforeEach(async () => {
    repo = createMockRepo<Transaction>();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: getRepositoryToken(Transaction), useValue: repo },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  describe('summary', () => {
    it('sums income and expenses and computes saldo/economia', async () => {
      repo.find!.mockResolvedValue([
        makeTransaction({ amount: 1000, type: TransactionType.INCOME }),
        makeTransaction({ amount: 500, type: TransactionType.INCOME }),
        makeTransaction({ amount: 300, type: TransactionType.EXPENSE }),
        makeTransaction({ amount: 200, type: TransactionType.EXPENSE }),
      ]);

      const result = await service.summary('user-1', '2026-01');

      expect(result).toEqual({
        receitas: 1500,
        despesas: 500,
        saldo: 1000,
        economia: 1000,
      });
    });

    it('handles string/decimal amounts from TypeORM', async () => {
      repo.find!.mockResolvedValue([
        makeTransaction({
          amount: '100.50' as unknown as number,
          type: TransactionType.INCOME,
        }),
        makeTransaction({
          amount: '40.25' as unknown as number,
          type: TransactionType.EXPENSE,
        }),
      ]);

      const result = await service.summary('user-1', '2026-01');
      expect(result.receitas).toBeCloseTo(100.5);
      expect(result.despesas).toBeCloseTo(40.25);
      expect(result.saldo).toBeCloseTo(60.25);
    });

    it('returns zeros when there are no transactions', async () => {
      repo.find!.mockResolvedValue([]);
      const result = await service.summary('user-1', '2026-01');
      expect(result).toEqual({
        receitas: 0,
        despesas: 0,
        saldo: 0,
        economia: 0,
      });
    });

    it('scopes the query to the user and the month range', async () => {
      repo.find!.mockResolvedValue([]);
      await service.summary('user-1', '2026-03');
      const arg = repo.find!.mock.calls[0][0];
      expect(arg.where.userId).toBe('user-1');
      expect(arg.where.transactionDate).toBeDefined();
    });
  });

  describe('byCategory', () => {
    it('groups expenses by category, sums totals, sorts desc and computes pct', async () => {
      const food = makeCategory({
        id: 'cat-food',
        name: 'Food',
        icon: 'food',
        color: '#111',
      });
      const transport = makeCategory({
        id: 'cat-trans',
        name: 'Transport',
        icon: 'car',
        color: '#222',
      });

      repo.find!.mockResolvedValue([
        makeTransaction({
          categoryId: 'cat-food',
          category: food,
          amount: 100,
          type: TransactionType.EXPENSE,
        }),
        makeTransaction({
          categoryId: 'cat-food',
          category: food,
          amount: 200,
          type: TransactionType.EXPENSE,
        }),
        makeTransaction({
          categoryId: 'cat-trans',
          category: transport,
          amount: 100,
          type: TransactionType.EXPENSE,
        }),
        // income should be ignored for expense report.
        makeTransaction({ amount: 9999, type: TransactionType.INCOME }),
      ]);

      const result = await service.byCategory('user-1', '2026-01', 'expense');

      expect(result).toHaveLength(2);
      // Food (300) before Transport (100).
      expect(result[0]).toMatchObject({
        categoryId: 'cat-food',
        name: 'Food',
        icon: 'food',
        color: '#111',
        total: 300,
      });
      expect(result[0].pct).toBeCloseTo(75); // 300 / 400
      expect(result[1]).toMatchObject({ categoryId: 'cat-trans', total: 100 });
      expect(result[1].pct).toBeCloseTo(25);
    });

    it('filters by income when type=income', async () => {
      const salary = makeCategory({ id: 'cat-sal', name: 'Salary' });
      repo.find!.mockResolvedValue([
        makeTransaction({
          categoryId: 'cat-sal',
          category: salary,
          amount: 5000,
          type: TransactionType.INCOME,
        }),
        makeTransaction({ amount: 300, type: TransactionType.EXPENSE }),
      ]);

      const result = await service.byCategory('user-1', '2026-01', 'income');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        categoryId: 'cat-sal',
        total: 5000,
        pct: 100,
      });
    });

    it('falls back to Unknown name when category relation is missing', async () => {
      repo.find!.mockResolvedValue([
        makeTransaction({
          categoryId: 'orphan',
          category: undefined,
          amount: 50,
          type: TransactionType.EXPENSE,
        }),
      ]);

      const result = await service.byCategory('user-1', '2026-01');
      expect(result[0]).toMatchObject({
        categoryId: 'orphan',
        name: 'Unknown',
        icon: null,
        color: null,
      });
    });

    it('returns an empty array when there are no matching transactions', async () => {
      repo.find!.mockResolvedValue([]);
      await expect(service.byCategory('user-1', '2026-01')).resolves.toEqual(
        [],
      );
    });
  });

  describe('byBank', () => {
    it('groups expenses by bank and sorts desc', async () => {
      const nubank = makeBank({ id: 'bank-nu', name: 'Nubank' });
      const itau = makeBank({ id: 'bank-itau', name: 'Itau' });

      repo.find!.mockResolvedValue([
        makeTransaction({
          bankId: 'bank-nu',
          bank: nubank,
          amount: 100,
          type: TransactionType.EXPENSE,
        }),
        makeTransaction({
          bankId: 'bank-itau',
          bank: itau,
          amount: 400,
          type: TransactionType.EXPENSE,
        }),
        makeTransaction({
          bankId: 'bank-nu',
          bank: nubank,
          amount: 50,
          type: TransactionType.EXPENSE,
        }),
        // income ignored.
        makeTransaction({
          bankId: 'bank-nu',
          bank: nubank,
          amount: 9999,
          type: TransactionType.INCOME,
        }),
      ]);

      const result = await service.byBank('user-1', '2026-01');
      expect(result).toEqual([
        { bankId: 'bank-itau', name: 'Itau', total: 400 },
        { bankId: 'bank-nu', name: 'Nubank', total: 150 },
      ]);
    });

    it('falls back to Unknown when the bank relation is missing', async () => {
      repo.find!.mockResolvedValue([
        makeTransaction({
          bankId: 'orphan',
          bank: undefined,
          amount: 10,
          type: TransactionType.EXPENSE,
        }),
      ]);
      const result = await service.byBank('user-1', '2026-01');
      expect(result[0]).toEqual({
        bankId: 'orphan',
        name: 'Unknown',
        total: 10,
      });
    });
  });

  describe('monthlyComparison', () => {
    it('returns N buckets, all zeroed, when there is no data', async () => {
      repo.find!.mockResolvedValue([]);
      const result = await service.monthlyComparison('user-1', 4);

      expect(result).toHaveLength(4);
      for (const bucket of result) {
        expect(bucket.receitas).toBe(0);
        expect(bucket.despesas).toBe(0);
        expect(bucket.month).toMatch(/^\d{4}-(0[1-9]|1[0-2])$/);
      }
    });

    it('defaults to 6 months', async () => {
      repo.find!.mockResolvedValue([]);
      const result = await service.monthlyComparison('user-1');
      expect(result).toHaveLength(6);
    });

    it('returns buckets oldest-first and the last bucket is the current month', async () => {
      repo.find!.mockResolvedValue([]);
      const result = await service.monthlyComparison('user-1', 3);

      const now = new Date();
      const currentKey = `${now.getFullYear()}-${String(
        now.getMonth() + 1,
      ).padStart(2, '0')}`;
      expect(result[result.length - 1].month).toBe(currentKey);
    });

    it('aggregates income/expense into the matching month bucket', async () => {
      const now = new Date();
      // A transaction dated in the current month should land in the last bucket.
      const inCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 15);

      repo.find!.mockResolvedValue([
        makeTransaction({
          amount: 1000,
          type: TransactionType.INCOME,
          transactionDate: inCurrentMonth,
        }),
        makeTransaction({
          amount: 250,
          type: TransactionType.EXPENSE,
          transactionDate: inCurrentMonth,
        }),
      ]);

      const result = await service.monthlyComparison('user-1', 3);
      const last = result[result.length - 1];
      expect(last.receitas).toBe(1000);
      expect(last.despesas).toBe(250);
    });
  });
});
