import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  DataSource,
  FindOptionsWhere,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { Transaction, TransactionType } from './entities/transaction.entity';
import { Bank } from '../banks/entities/bank.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';

const IMPULSE_NIGHT_HOUR = 20; // 20h onwards is considered "late night"
const IMPULSE_FALLBACK_AMOUNT = 100; // used when there is no 7-day history
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
// The heuristic below cares about the user's LOCAL wall-clock hour/weekday,
// but the mobile app always sends `transactionDate` as a UTC instant
// (`new Date().toISOString()`). Reading that instant with
// Date.prototype.getHours()/getDay() answers "what hour/weekday is it in the
// API PROCESS's timezone", not the user's — so the exact same purchase could
// be flagged differently depending only on whether the API happens to run in
// a UTC container (Docker's default) or on a Brazil-timezone dev machine.
// Shifting by a fixed offset and reading the UTC components back gives a
// deterministic Brazil-local hour/weekday no matter where the process runs.
// Brazil has had no DST since 2019, so a fixed offset is accurate.
const BRAZIL_UTC_OFFSET_HOURS = -3;

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly txRepo: Repository<Transaction>,
    @InjectRepository(Bank)
    private readonly banksRepo: Repository<Bank>,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    userId: string,
    dto: CreateTransactionDto,
  ): Promise<Transaction> {
    const bank = await this.banksRepo.findOne({
      where: { id: dto.bankId, userId },
    });
    if (!bank) throw new NotFoundException(`Bank ${dto.bankId} not found`);

    // Respect an explicit isImpulse from the client; otherwise auto-detect.
    const isImpulse =
      dto.isImpulse !== undefined
        ? dto.isImpulse
        : await this.detectImpulse(userId, dto);

    // The transaction insert and the balance update must land together —
    // a failure between two separate save() round-trips used to leave
    // Bank.currentBalance permanently out of sync with the ledger.
    return this.dataSource.transaction(async (manager) => {
      const txRepo = manager.getRepository(Transaction);
      const banksRepo = manager.getRepository(Bank);

      const tx = txRepo.create({
        ...dto,
        userId,
        isImpulse,
        transactionDate: new Date(dto.transactionDate),
      });
      const saved = await txRepo.save(tx);

      this.applyToBalance(bank, dto.type, Number(dto.amount));
      await banksRepo.save(bank);

      return saved;
    });
  }

  /**
   * Behavioral heuristic for impulse purchases.
   *
   * A transaction is flagged as impulsive when ALL of the following hold:
   *  1. it is an EXPENSE;
   *  2. it happens at night (hour >= 20) OR on a weekend (Sat/Sun), based on
   *     transactionDate;
   *  3. its amount is above the user's average daily EXPENSE over the last
   *     7 days. When there is no 7-day history yet, we fall back to a fixed
   *     threshold (amount > 100) so the night/weekend signal still counts.
   */
  private async detectImpulse(
    userId: string,
    dto: Pick<CreateTransactionDto, 'type' | 'amount' | 'transactionDate'>,
  ): Promise<boolean> {
    if (dto.type !== TransactionType.EXPENSE) return false;

    const date = new Date(dto.transactionDate);
    const brazilLocal = new Date(
      date.getTime() + BRAZIL_UTC_OFFSET_HOURS * 60 * 60 * 1000,
    );
    const hour = brazilLocal.getUTCHours();
    const weekday = brazilLocal.getUTCDay(); // 0 = Sunday, 6 = Saturday
    const isNight = hour >= IMPULSE_NIGHT_HOUR;
    const isWeekend = weekday === 0 || weekday === 6;
    if (!isNight && !isWeekend) return false;

    const amount = Number(dto.amount);
    const since = new Date(date.getTime() - SEVEN_DAYS_MS);

    const recentExpenses = await this.txRepo.find({
      where: {
        userId,
        type: TransactionType.EXPENSE,
        transactionDate: Between(since, date),
      },
    });

    if (recentExpenses.length === 0) {
      // No history to compare against — use the fixed fallback threshold.
      return amount > IMPULSE_FALLBACK_AMOUNT;
    }

    const total = recentExpenses.reduce((sum, t) => sum + Number(t.amount), 0);
    const average = total / recentExpenses.length;
    return amount > average;
  }

  findAll(
    userId: string,
    filters: QueryTransactionDto = {},
  ): Promise<Transaction[]> {
    const where: FindOptionsWhere<Transaction> = { userId };

    if (filters.type) where.type = filters.type;
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.bankId) where.bankId = filters.bankId;
    if (filters.onlyImpulse) where.isImpulse = true;

    const start = filters.startDate ? new Date(filters.startDate) : undefined;
    const end = filters.endDate ? new Date(filters.endDate) : undefined;
    if (start && end) {
      where.transactionDate = Between(start, end);
    } else if (start) {
      where.transactionDate = MoreThanOrEqual(start);
    } else if (end) {
      where.transactionDate = LessThanOrEqual(end);
    }

    return this.txRepo.find({
      where,
      relations: { bank: true, category: true },
      order: { transactionDate: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Transaction> {
    const tx = await this.txRepo.findOne({
      where: { id, userId },
      relations: { bank: true, category: true },
    });
    if (!tx) throw new NotFoundException(`Transaction ${id} not found`);
    return tx;
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateTransactionDto,
  ): Promise<Transaction> {
    const tx = await this.findOne(id, userId);

    // Snapshot the old effect before mutating the entity.
    const oldType = tx.type;
    const oldAmount = Number(tx.amount);
    const oldBankId = tx.bankId;
    // transactionDate/amount/type all feed detectImpulse — if any of them is
    // part of this update, the previously-stored isImpulse flag may now be
    // stale and needs recomputing (unless the client overrides it directly).
    const impulseInputsChanged =
      dto.type !== undefined ||
      dto.amount !== undefined ||
      dto.transactionDate !== undefined;

    Object.assign(tx, dto);
    if (dto.transactionDate) {
      tx.transactionDate = new Date(dto.transactionDate);
    }

    const newType = tx.type;
    const newAmount = Number(tx.amount);
    const newBankId = tx.bankId;

    if (dto.isImpulse === undefined && impulseInputsChanged) {
      // `transaction_date` is a date-only column, so once a transaction is
      // persisted its original time-of-day is gone — reusing the stored
      // value here means the "night" signal can only ever be known from a
      // transactionDate resent on THIS update; the "weekend" signal still
      // works either way since it only needs the calendar date.
      tx.isImpulse = await this.detectImpulse(userId, {
        type: newType,
        amount: newAmount,
        transactionDate: dto.transactionDate ?? String(tx.transactionDate),
      });
    }

    // Validate (and load) the new bank up-front so we never persist the
    // transaction if it points at a bank the user does not own.
    const newBank = await this.banksRepo.findOne({
      where: { id: newBankId, userId },
    });
    if (!newBank) throw new NotFoundException(`Bank ${newBankId} not found`);

    // The transaction update and the balance rebalance must land together —
    // see the comment in create() for why this can no longer be two
    // separate save() round-trips.
    return this.dataSource.transaction(async (manager) => {
      const txRepo = manager.getRepository(Transaction);
      const banksRepo = manager.getRepository(Bank);

      const saved = await txRepo.save(tx);

      // Rebalance: revert the old transaction's effect, then apply the new one.
      if (oldBankId === newBankId) {
        // Same bank — adjust in a single load/save to avoid double persistence.
        this.revertFromBalance(newBank, oldType, oldAmount);
        this.applyToBalance(newBank, newType, newAmount);
        await banksRepo.save(newBank);
      } else {
        const oldBank = await banksRepo.findOne({
          where: { id: oldBankId, userId },
        });
        if (oldBank) {
          this.revertFromBalance(oldBank, oldType, oldAmount);
          await banksRepo.save(oldBank);
        }
        this.applyToBalance(newBank, newType, newAmount);
        await banksRepo.save(newBank);
      }

      return saved;
    });
  }

  async remove(id: string, userId: string): Promise<void> {
    const tx = await this.findOne(id, userId);
    const bank = await this.banksRepo.findOne({ where: { id: tx.bankId } });

    await this.dataSource.transaction(async (manager) => {
      const txRepo = manager.getRepository(Transaction);
      const banksRepo = manager.getRepository(Bank);

      if (bank) {
        this.revertFromBalance(bank, tx.type, Number(tx.amount));
        await banksRepo.save(bank);
      }

      await txRepo.remove(tx);
    });
  }

  /** Applies a transaction's effect to a bank balance (income +, expense -). */
  private applyToBalance(
    bank: Bank,
    type: TransactionType,
    amount: number,
  ): void {
    if (type === TransactionType.INCOME) {
      bank.currentBalance = Number(bank.currentBalance) + amount;
    } else {
      bank.currentBalance = Number(bank.currentBalance) - amount;
    }
  }

  /** Reverts a transaction's effect from a bank balance (the inverse op). */
  private revertFromBalance(
    bank: Bank,
    type: TransactionType,
    amount: number,
  ): void {
    if (type === TransactionType.INCOME) {
      bank.currentBalance = Number(bank.currentBalance) - amount;
    } else {
      bank.currentBalance = Number(bank.currentBalance) + amount;
    }
  }
}
