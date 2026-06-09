import { Transform } from 'class-transformer';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { TransactionType } from '../entities/transaction.entity';

export class QueryTransactionDto {
  @IsEnum(TransactionType)
  @IsOptional()
  type?: TransactionType;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  bankId?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  // Query params arrive as strings; coerce common truthy values to a boolean.
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  @IsOptional()
  onlyImpulse?: boolean;
}
