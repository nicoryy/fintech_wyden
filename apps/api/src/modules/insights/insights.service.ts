import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Insight } from './entities/insight.entity';

@Injectable()
export class InsightsService {
  constructor(
    @InjectRepository(Insight)
    private readonly insightsRepo: Repository<Insight>,
  ) {}

  findAll(userId: string): Promise<Insight[]> {
    return this.insightsRepo.find({
      where: { userId },
      order: { generatedAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Insight> {
    const insight = await this.insightsRepo.findOne({ where: { id, userId } });
    if (!insight) throw new NotFoundException(`Insight ${id} not found`);
    return insight;
  }
}
