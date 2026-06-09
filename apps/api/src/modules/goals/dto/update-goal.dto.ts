import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { CreateGoalDto } from './create-goal.dto';
import { GoalStatus } from '../entities/goal.entity';

export class UpdateGoalDto extends PartialType(CreateGoalDto) {
  @IsNumber()
  @IsOptional()
  @Min(0)
  currentAmount?: number;

  @IsEnum(GoalStatus)
  @IsOptional()
  status?: GoalStatus;
}
