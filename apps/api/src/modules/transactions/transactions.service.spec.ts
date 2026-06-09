import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { Transaction, TransactionType } from './entities/transaction.entity';
import { Bank } from '../banks/entities/bank.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import {
  createMockRepo,
  makeBank,
  makeTransaction,
  MockRepo,
} from '../../test-utils/mock-repo';

// Local-time ISO strings (no trailing Z) so getHours()/getDay() are
// deterministic regardless of the machine timezone.
const SATURDAY_NIGHT = '2026-01-17T22:00:00'; // Sat, 22h -> night & weekend
const WEDNESDAY_DAY = '2026-01-14T10:00:00'; // Wed, 10h -> not night, not weekend

describe('TransactionsService', () => {
  let service: TransactionsService;
  let txRepo: MockRepo<Transaction>;
  let banksRepo: MockRepo<Bank>;

  beforeEach(async () => {
    txRepo = createMockRepo<Transaction>();
    banksRepo = createMockRepo<Bank>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: getRepositoryToken(Transaction), useValue: txRepo },
        { provide: getRepositoryToken(Bank), useValue: banksRepo },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
  });

  const baseDto = (
    overrides: Partial<CreateTransactionDto> = {},
  ): CreateTransactionDto => ({
    bankId: 'bank-1',
    categoryId: 'category-1',
    amount: 50,
    type: TransactionType.EXPENSE,
    description: 'desc',
    transactionDate: WEDNESDAY_DAY,
    ...overrides,
  });

  describe('create', () => {
    it('throws NotFoundException when the bank does not exist', async () => {
      banksRepo.findOne!.mockResolvedValue(null);

      await expect(service.create('user-1', baseDto())).rejects.toThrow(
        NotFoundException,
      );
      expect(txRepo.save).not.toHaveBeenCalled();
    });

    it('creates an expense and subtracts it from the bank balance', async () => {
      const bank = makeBank({ id: 'bank-1', currentBalance: 1000 });
      banksRepo.findOne!.mockResolvedValue(bank);
      txRepo.find!.mockResolvedValue([]); // no 7-day history
      txRepo.create!.mockImplementation((v: Partial<Transaction>) => v);
      txRepo.save!.mockImplementation((v: Transaction) => Promise.resolve(v));

      const dto = baseDto({ amount: 200, type: TransactionType.EXPENSE });
      await service.create('user-1', dto);

      expect(bank.currentBalance).toBe(800);
      expect(banksRepo.save).toHaveBeenCalledWith(bank);
    });

    it('creates an income and adds it to the bank balance', async () => {
      const bank = makeBank({ id: 'bank-1', currentBalance: 1000 });
      banksRepo.findOne!.mockResolvedValue(bank);
      txRepo.create!.mockImplementation((v: Partial<Transaction>) => v);
      txRepo.save!.mockImplementation((v: Transaction) => Promise.resolve(v));

      const dto = baseDto({ amount: 300, type: TransactionType.INCOME });
      await service.create('user-1', dto);

      expect(bank.currentBalance).toBe(1300);
    });

    it('handles string/decimal balances from TypeORM correctly', async () => {
      const bank = makeBank({
        id: 'bank-1',
        currentBalance: '1000.00' as unknown as number,
      });
      banksRepo.findOne!.mockResolvedValue(bank);
      txRepo.find!.mockResolvedValue([]);
      txRepo.create!.mockImplementation((v: Partial<Transaction>) => v);
      txRepo.save!.mockImplementation((v: Transaction) => Promise.resolve(v));

      await service.create(
        'user-1',
        baseDto({ amount: 50, type: TransactionType.EXPENSE }),
      );

      expect(bank.currentBalance).toBe(950);
    });

    it('respects an explicit isImpulse=true from the dto without auto-detecting', async () => {
      const bank = makeBank({ id: 'bank-1', currentBalance: 1000 });
      banksRepo.findOne!.mockResolvedValue(bank);
      txRepo.create!.mockImplementation((v: Partial<Transaction>) => v);
      txRepo.save!.mockImplementation((v: Transaction) => Promise.resolve(v));

      // Daytime weekday + small amount would normally be non-impulse.
      const saved = await service.create(
        'user-1',
        baseDto({
          amount: 10,
          isImpulse: true,
          transactionDate: WEDNESDAY_DAY,
        }),
      );

      expect(saved.isImpulse).toBe(true);
      // detectImpulse short-circuits, so no recent-history lookup happens.
      expect(txRepo.find).not.toHaveBeenCalled();
    });

    it('respects an explicit isImpulse=false even on a night weekend high amount', async () => {
      const bank = makeBank({ id: 'bank-1', currentBalance: 1000 });
      banksRepo.findOne!.mockResolvedValue(bank);
      txRepo.create!.mockImplementation((v: Partial<Transaction>) => v);
      txRepo.save!.mockImplementation((v: Transaction) => Promise.resolve(v));

      const saved = await service.create(
        'user-1',
        baseDto({
          amount: 9999,
          isImpulse: false,
          transactionDate: SATURDAY_NIGHT,
        }),
      );

      expect(saved.isImpulse).toBe(false);
      expect(txRepo.find).not.toHaveBeenCalled();
    });
  });

  describe('detectImpulse (via create)', () => {
    const setupBank = () => {
      const bank = makeBank({ id: 'bank-1', currentBalance: 1000 });
      banksRepo.findOne!.mockResolvedValue(bank);
      txRepo.create!.mockImplementation((v: Partial<Transaction>) => v);
      txRepo.save!.mockImplementation((v: Transaction) => Promise.resolve(v));
      return bank;
    };

    it('returns false for INCOME regardless of time/amount', async () => {
      setupBank();
      const saved = await service.create(
        'user-1',
        baseDto({
          amount: 5000,
          type: TransactionType.INCOME,
          transactionDate: SATURDAY_NIGHT,
        }),
      );
      expect(saved.isImpulse).toBe(false);
      expect(txRepo.find).not.toHaveBeenCalled();
    });

    it('returns false when not night and not weekend', async () => {
      setupBank();
      const saved = await service.create(
        'user-1',
        baseDto({ amount: 5000, transactionDate: WEDNESDAY_DAY }),
      );
      expect(saved.isImpulse).toBe(false);
      expect(txRepo.find).not.toHaveBeenCalled();
    });

    it('night/weekend, no history, amount > 100 fallback -> impulse', async () => {
      setupBank();
      txRepo.find!.mockResolvedValue([]);
      const saved = await service.create(
        'user-1',
        baseDto({ amount: 150, transactionDate: SATURDAY_NIGHT }),
      );
      expect(saved.isImpulse).toBe(true);
    });

    it('night/weekend, no history, amount <= 100 fallback -> not impulse', async () => {
      setupBank();
      txRepo.find!.mockResolvedValue([]);
      const saved = await service.create(
        'user-1',
        baseDto({ amount: 100, transactionDate: SATURDAY_NIGHT }),
      );
      expect(saved.isImpulse).toBe(false);
    });

    it('night/weekend with history, amount > recent average -> impulse', async () => {
      setupBank();
      // Recent expenses average = (20 + 40) / 2 = 30.
      txRepo.find!.mockResolvedValue([
        makeTransaction({ amount: 20, type: TransactionType.EXPENSE }),
        makeTransaction({ amount: 40, type: TransactionType.EXPENSE }),
      ]);
      const saved = await service.create(
        'user-1',
        baseDto({ amount: 50, transactionDate: SATURDAY_NIGHT }),
      );
      expect(saved.isImpulse).toBe(true);
    });

    it('night/weekend with history, amount <= recent average -> not impulse', async () => {
      setupBank();
      // Recent expenses average = (200 + 400) / 2 = 300.
      txRepo.find!.mockResolvedValue([
        makeTransaction({ amount: 200, type: TransactionType.EXPENSE }),
        makeTransaction({ amount: 400, type: TransactionType.EXPENSE }),
      ]);
      const saved = await service.create(
        'user-1',
        baseDto({ amount: 300, transactionDate: SATURDAY_NIGHT }),
      );
      expect(saved.isImpulse).toBe(false);
    });

    it('queries recent EXPENSE history within a 7-day window', async () => {
      setupBank();
      txRepo.find!.mockResolvedValue([]);
      await service.create(
        'user-1',
        baseDto({ amount: 150, transactionDate: SATURDAY_NIGHT }),
      );

      expect(txRepo.find).toHaveBeenCalledTimes(1);
      const arg = txRepo.find!.mock.calls[0][0];
      expect(arg.where.userId).toBe('user-1');
      expect(arg.where.type).toBe(TransactionType.EXPENSE);
      // transactionDate filter is a Between(...) range.
      expect(arg.where.transactionDate).toBeDefined();
    });
  });

  describe('findAll', () => {
    beforeEach(() => {
      txRepo.find!.mockResolvedValue([]);
    });

    it('filters only by userId when no filters supplied', async () => {
      await service.findAll('user-1');
      const arg = txRepo.find!.mock.calls[0][0];
      expect(arg.where).toEqual({ userId: 'user-1' });
      expect(arg.order).toEqual({ transactionDate: 'DESC' });
    });

    it('applies type, categoryId, bankId and onlyImpulse filters', async () => {
      await service.findAll('user-1', {
        type: TransactionType.EXPENSE,
        categoryId: 'cat-9',
        bankId: 'bank-9',
        onlyImpulse: true,
      });
      const arg = txRepo.find!.mock.calls[0][0];
      expect(arg.where).toMatchObject({
        userId: 'user-1',
        type: TransactionType.EXPENSE,
        categoryId: 'cat-9',
        bankId: 'bank-9',
        isImpulse: true,
      });
    });

    it('does not set isImpulse when onlyImpulse is falsy', async () => {
      await service.findAll('user-1', { onlyImpulse: false });
      const arg = txRepo.find!.mock.calls[0][0];
      expect(arg.where.isImpulse).toBeUndefined();
    });

    it('uses Between when both startDate and endDate are given', async () => {
      await service.findAll('user-1', {
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      });
      const arg = txRepo.find!.mock.calls[0][0];
      expect(arg.where.transactionDate).toEqual(
        Between(new Date('2026-01-01'), new Date('2026-01-31')),
      );
    });

    it('uses MoreThanOrEqual when only startDate is given', async () => {
      await service.findAll('user-1', { startDate: '2026-01-01' });
      const arg = txRepo.find!.mock.calls[0][0];
      expect(arg.where.transactionDate).toEqual(
        MoreThanOrEqual(new Date('2026-01-01')),
      );
    });

    it('uses LessThanOrEqual when only endDate is given', async () => {
      await service.findAll('user-1', { endDate: '2026-01-31' });
      const arg = txRepo.find!.mock.calls[0][0];
      expect(arg.where.transactionDate).toEqual(
        LessThanOrEqual(new Date('2026-01-31')),
      );
    });
  });

  describe('findOne', () => {
    it('returns the transaction when found', async () => {
      const tx = makeTransaction({ id: 'tx-1' });
      txRepo.findOne!.mockResolvedValue(tx);
      await expect(service.findOne('tx-1', 'user-1')).resolves.toBe(tx);
    });

    it('throws NotFoundException when missing', async () => {
      txRepo.findOne!.mockResolvedValue(null);
      await expect(service.findOne('tx-x', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update (rebalance)', () => {
    it('same bank: expense 100 -> expense 150 lowers the balance by an extra 50', async () => {
      const existing = makeTransaction({
        id: 'tx-1',
        bankId: 'bank-1',
        amount: 100,
        type: TransactionType.EXPENSE,
      });
      const bank = makeBank({ id: 'bank-1', currentBalance: 900 });

      txRepo.findOne!.mockResolvedValue(existing);
      banksRepo.findOne!.mockResolvedValue(bank);
      txRepo.save!.mockImplementation((v: Transaction) => Promise.resolve(v));
      banksRepo.save!.mockImplementation((v: Bank) => Promise.resolve(v));

      await service.update('tx-1', 'user-1', { amount: 150 });

      // revert old expense (+100 -> 1000), apply new expense (-150 -> 850).
      expect(bank.currentBalance).toBe(850);
      // Same-bank path persists the bank exactly once.
      expect(banksRepo.save).toHaveBeenCalledTimes(1);
    });

    it('same bank: switching expense -> income flips the balance effect', async () => {
      const existing = makeTransaction({
        id: 'tx-1',
        bankId: 'bank-1',
        amount: 100,
        type: TransactionType.EXPENSE,
      });
      const bank = makeBank({ id: 'bank-1', currentBalance: 900 });

      txRepo.findOne!.mockResolvedValue(existing);
      banksRepo.findOne!.mockResolvedValue(bank);
      txRepo.save!.mockImplementation((v: Transaction) => Promise.resolve(v));
      banksRepo.save!.mockImplementation((v: Bank) => Promise.resolve(v));

      await service.update('tx-1', 'user-1', { type: TransactionType.INCOME });

      // revert old expense (+100 -> 1000), apply new income (+100 -> 1100).
      expect(bank.currentBalance).toBe(1100);
    });

    it('changing bank moves the effect from old bank to new bank', async () => {
      const existing = makeTransaction({
        id: 'tx-1',
        bankId: 'bank-old',
        amount: 100,
        type: TransactionType.EXPENSE,
      });
      const oldBank = makeBank({ id: 'bank-old', currentBalance: 900 });
      const newBank = makeBank({ id: 'bank-new', currentBalance: 500 });

      txRepo.findOne!.mockResolvedValue(existing);
      // First findOne -> new bank (validation), second findOne -> old bank.
      banksRepo
        .findOne!.mockResolvedValueOnce(newBank)
        .mockResolvedValueOnce(oldBank);
      txRepo.save!.mockImplementation((v: Transaction) => Promise.resolve(v));
      banksRepo.save!.mockImplementation((v: Bank) => Promise.resolve(v));

      await service.update('tx-1', 'user-1', { bankId: 'bank-new' });

      // old bank: revert expense (+100 -> 1000).
      expect(oldBank.currentBalance).toBe(1000);
      // new bank: apply expense (-100 -> 400).
      expect(newBank.currentBalance).toBe(400);
      // Both banks persisted.
      expect(banksRepo.save).toHaveBeenCalledTimes(2);
    });

    it('throws NotFoundException and does not persist when the new bank is not owned', async () => {
      const existing = makeTransaction({
        id: 'tx-1',
        bankId: 'bank-1',
        amount: 100,
        type: TransactionType.EXPENSE,
      });
      txRepo.findOne!.mockResolvedValue(existing);
      banksRepo.findOne!.mockResolvedValue(null); // new bank not found/owned

      await expect(
        service.update('tx-1', 'user-1', { bankId: 'bank-x' }),
      ).rejects.toThrow(NotFoundException);

      expect(txRepo.save).not.toHaveBeenCalled();
      expect(banksRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('reverts the balance effect and removes the transaction', async () => {
      const existing = makeTransaction({
        id: 'tx-1',
        bankId: 'bank-1',
        amount: 100,
        type: TransactionType.EXPENSE,
      });
      const bank = makeBank({ id: 'bank-1', currentBalance: 900 });

      txRepo.findOne!.mockResolvedValue(existing);
      banksRepo.findOne!.mockResolvedValue(bank);
      banksRepo.save!.mockImplementation((v: Bank) => Promise.resolve(v));
      txRepo.remove!.mockResolvedValue(existing);

      await service.remove('tx-1', 'user-1');

      // revert expense -> balance goes back up by 100.
      expect(bank.currentBalance).toBe(1000);
      expect(txRepo.remove).toHaveBeenCalledWith(existing);
    });

    it('removes the transaction even when the bank no longer exists', async () => {
      const existing = makeTransaction({ id: 'tx-1', bankId: 'bank-gone' });
      txRepo.findOne!.mockResolvedValue(existing);
      banksRepo.findOne!.mockResolvedValue(null);
      txRepo.remove!.mockResolvedValue(existing);

      await service.remove('tx-1', 'user-1');

      expect(banksRepo.save).not.toHaveBeenCalled();
      expect(txRepo.remove).toHaveBeenCalledWith(existing);
    });
  });
});
