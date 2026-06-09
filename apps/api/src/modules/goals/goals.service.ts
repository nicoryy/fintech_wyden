import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Goal } from './entities/goal.entity';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';

@Injectable()
export class GoalsService {
  constructor(
    @InjectRepository(Goal)
    private readonly goalsRepo: Repository<Goal>,
  ) {}

  create(userId: string, dto: CreateGoalDto): Promise<Goal> {
    const goal = this.goalsRepo.create({
      userId,
      title: dto.title,
      targetAmount: dto.targetAmount,
      deadline: dto.deadline ? new Date(dto.deadline) : undefined,
    });
    return this.goalsRepo.save(goal);
  }

  findAll(userId: string): Promise<Goal[]> {
    return this.goalsRepo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string, userId: string): Promise<Goal> {
    const goal = await this.goalsRepo.findOne({ where: { id, userId } });
    if (!goal) throw new NotFoundException(`Goal ${id} not found`);
    return goal;
  }

  async update(id: string, userId: string, dto: UpdateGoalDto): Promise<Goal> {
    const goal = await this.findOne(id, userId);
    Object.assign(goal, dto);
    return this.goalsRepo.save(goal);
  }

  async remove(id: string, userId: string): Promise<void> {
    const goal = await this.findOne(id, userId);
    await this.goalsRepo.remove(goal);
  }
}
