import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction, TransactionType } from './entities/transaction.entity';
import { Bank } from '../banks/entities/bank.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly txRepo: Repository<Transaction>,
    @InjectRepository(Bank)
    private readonly banksRepo: Repository<Bank>,
  ) {}

  async create(userId: string, dto: CreateTransactionDto): Promise<Transaction> {
    const bank = await this.banksRepo.findOne({ where: { id: dto.bankId, userId } });
    if (!bank) throw new NotFoundException(`Bank ${dto.bankId} not found`);

    const tx = this.txRepo.create({ ...dto, userId, transactionDate: new Date(dto.transactionDate) });
    const saved = await this.txRepo.save(tx);

    // Update bank balance
    if (dto.type === TransactionType.INCOME) {
      bank.currentBalance = Number(bank.currentBalance) + Number(dto.amount);
    } else {
      bank.currentBalance = Number(bank.currentBalance) - Number(dto.amount);
    }
    await this.banksRepo.save(bank);

    return saved;
  }

  findAll(userId: string): Promise<Transaction[]> {
    return this.txRepo.find({
      where: { userId },
      relations: { bank: true, category: true },
      order: { transactionDate: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Transaction> {
    const tx = await this.txRepo.findOne({ where: { id, userId }, relations: { bank: true, category: true } });
    if (!tx) throw new NotFoundException(`Transaction ${id} not found`);
    return tx;
  }

  async update(id: string, userId: string, dto: UpdateTransactionDto): Promise<Transaction> {
    const tx = await this.findOne(id, userId);
    Object.assign(tx, dto);
    return this.txRepo.save(tx);
  }

  async remove(id: string, userId: string): Promise<void> {
    const tx = await this.findOne(id, userId);
    const bank = await this.banksRepo.findOne({ where: { id: tx.bankId } });

    if (bank) {
      if (tx.type === TransactionType.INCOME) {
        bank.currentBalance = Number(bank.currentBalance) - Number(tx.amount);
      } else {
        bank.currentBalance = Number(bank.currentBalance) + Number(tx.amount);
      }
      await this.banksRepo.save(bank);
    }

    await this.txRepo.remove(tx);
  }
}
