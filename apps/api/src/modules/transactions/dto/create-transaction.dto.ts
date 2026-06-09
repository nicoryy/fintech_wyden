import { IsEnum, IsNumber, IsOptional, IsString, IsDateString, IsBoolean, MaxLength, Min } from 'class-validator';
import { TransactionType } from '../entities/transaction.entity';

export class CreateTransactionDto {
  @IsString()
  bankId: string;

  @IsString()
  categoryId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;

  @IsDateString()
  transactionDate: string;

  @IsBoolean()
  @IsOptional()
  isImpulse?: boolean;
}
