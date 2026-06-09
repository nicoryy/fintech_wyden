import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import {
  Transaction,
  TransactionType,
} from '../transactions/entities/transaction.entity';

export interface SummaryReport {
  receitas: number;
  despesas: number;
  saldo: number;
  economia: number;
}

export interface CategoryReportItem {
  categoryId: string;
  name: string;
  icon: string | null;
  color: string | null;
  total: number;
  pct: number;
}

export interface BankReportItem {
  bankId: string;
  name: string;
  total: number;
}

export interface MonthlyComparisonItem {
  month: string;
  receitas: number;
  despesas: number;
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly txRepo: Repository<Transaction>,
  ) {}

  /** Income, expense, net balance and savings for the given month. */
  async summary(userId: string, month?: string): Promise<SummaryReport> {
    const { start, end } = this.monthRange(month);
    const txs = await this.findInRange(userId, start, end);

    let receitas = 0;
    let despesas = 0;
    for (const tx of txs) {
      const amount = Number(tx.amount);
      if (tx.type === TransactionType.INCOME) receitas += amount;
      else despesas += amount;
    }

    const saldo = receitas - despesas;
    // "economia" mirrors the net result for the month (what was saved/lost).
    return { receitas, despesas, saldo, economia: saldo };
  }

  /**
   * Totals grouped by category for a given type (default expense), ordered by
   * total descending, with each category's share (pct) of the grand total.
   */
  async byCategory(
    userId: string,
    month?: string,
    type?: string,
  ): Promise<CategoryReportItem[]> {
    const { start, end } = this.monthRange(month);
    const txType =
      (type ?? 'expense').toLowerCase() === 'income'
        ? TransactionType.INCOME
        : TransactionType.EXPENSE;

    const txs = await this.findInRange(userId, start, end, { category: true });

    const groups = new Map<string, CategoryReportItem>();
    let grandTotal = 0;

    for (const tx of txs) {
      if (tx.type !== txType) continue;
      const amount = Number(tx.amount);
      grandTotal += amount;

      const existing = groups.get(tx.categoryId);
      if (existing) {
        existing.total += amount;
      } else {
        groups.set(tx.categoryId, {
          categoryId: tx.categoryId,
          name: tx.category?.name ?? 'Unknown',
          icon: tx.category?.icon ?? null,
          color: tx.category?.color ?? null,
          total: amount,
          pct: 0,
        });
      }
    }

    return Array.from(groups.values())
      .map((item) => ({
        ...item,
        pct: grandTotal > 0 ? (item.total / grandTotal) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }

  /** Total expense movement grouped by bank for the given month. */
  async byBank(userId: string, month?: string): Promise<BankReportItem[]> {
    const { start, end } = this.monthRange(month);
    const txs = await this.findInRange(userId, start, end, { bank: true });

    const groups = new Map<string, BankReportItem>();
    for (const tx of txs) {
      if (tx.type !== TransactionType.EXPENSE) continue;
      const amount = Number(tx.amount);
      const existing = groups.get(tx.bankId);
      if (existing) {
        existing.total += amount;
      } else {
        groups.set(tx.bankId, {
          bankId: tx.bankId,
          name: tx.bank?.name ?? 'Unknown',
          total: amount,
        });
      }
    }

    return Array.from(groups.values()).sort((a, b) => b.total - a.total);
  }

  /**
   * Income vs expense totals for the last N months (default 6), oldest first.
   */
  async monthlyComparison(
    userId: string,
    months = 6,
  ): Promise<MonthlyComparisonItem[]> {
    const now = new Date();
    const oldest = new Date(
      now.getFullYear(),
      now.getMonth() - (months - 1),
      1,
    );
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const txs = await this.findInRange(userId, oldest, end);

    // Pre-seed every month in the window so gaps render as zeros.
    const buckets = new Map<string, MonthlyComparisonItem>();
    for (let i = 0; i < months; i++) {
      const d = new Date(
        now.getFullYear(),
        now.getMonth() - (months - 1) + i,
        1,
      );
      const key = this.monthKey(d);
      buckets.set(key, { month: key, receitas: 0, despesas: 0 });
    }

    for (const tx of txs) {
      const key = this.monthKey(new Date(tx.transactionDate));
      const bucket = buckets.get(key);
      if (!bucket) continue;
      const amount = Number(tx.amount);
      if (tx.type === TransactionType.INCOME) bucket.receitas += amount;
      else bucket.despesas += amount;
    }

    return Array.from(buckets.values());
  }

  // --- helpers -------------------------------------------------------------

  private findInRange(
    userId: string,
    start: Date,
    end: Date,
    relations?: { category?: boolean; bank?: boolean },
  ): Promise<Transaction[]> {
    return this.txRepo.find({
      where: { userId, transactionDate: Between(start, end) },
      relations,
    });
  }

  /**
   * Returns [start, end] for a `YYYY-MM` month (inclusive of the whole month).
   * `end` is the last instant of the month so date-only columns are covered.
   */
  private monthRange(month?: string): { start: Date; end: Date } {
    const now = new Date();
    let year = now.getFullYear();
    let monthIndex = now.getMonth();

    if (month) {
      const [y, m] = month.split('-').map(Number);
      year = y;
      monthIndex = m - 1;
    }

    const start = new Date(year, monthIndex, 1, 0, 0, 0, 0);
    const end = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
    return { start, end };
  }

  private monthKey(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }
}
