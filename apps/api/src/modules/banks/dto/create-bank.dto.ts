import {
  IsString,
  IsNumber,
  IsOptional,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateBankDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(8)
  short?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  color?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  initialBalance?: number;
}
