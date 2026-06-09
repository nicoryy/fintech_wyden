import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateGoalDto {
  @IsString()
  @MaxLength(150)
  title: string;

  @IsNumber()
  @Min(0.01)
  targetAmount: number;

  @IsDateString()
  @IsOptional()
  deadline?: string;
}
