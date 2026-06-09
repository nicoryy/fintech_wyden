import { IsString, IsNumber, IsOptional, MaxLength, Min } from 'class-validator';

export class CreateBankDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  initialBalance?: number;
}
