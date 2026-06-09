import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bank } from './entities/bank.entity';
import { CreateBankDto } from './dto/create-bank.dto';
import { UpdateBankDto } from './dto/update-bank.dto';

@Injectable()
export class BanksService {
  constructor(
    @InjectRepository(Bank)
    private readonly banksRepo: Repository<Bank>,
  ) {}

  create(userId: string, dto: CreateBankDto): Promise<Bank> {
    const bank = this.banksRepo.create({
      userId,
      name: dto.name,
      short: dto.short ?? null,
      color: dto.color ?? null,
      initialBalance: dto.initialBalance ?? 0,
      currentBalance: dto.initialBalance ?? 0,
    });
    return this.banksRepo.save(bank);
  }

  findAll(userId: string): Promise<Bank[]> {
    return this.banksRepo.find({ where: { userId } });
  }

  async findOne(id: string, userId: string): Promise<Bank> {
    const bank = await this.banksRepo.findOne({ where: { id, userId } });
    if (!bank) throw new NotFoundException(`Bank ${id} not found`);
    return bank;
  }

  async update(id: string, userId: string, dto: UpdateBankDto): Promise<Bank> {
    const bank = await this.findOne(id, userId);
    Object.assign(bank, dto);
    return this.banksRepo.save(bank);
  }

  async remove(id: string, userId: string): Promise<void> {
    const bank = await this.findOne(id, userId);
    await this.banksRepo.remove(bank);
  }
}
