import { Transform } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

/** Shared month filter: `YYYY-MM`. Defaults to the current month in services. */
export class MonthQueryDto {
  @IsString()
  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'month must be in YYYY-MM format',
  })
  month?: string;
}

export class ByCategoryQueryDto extends MonthQueryDto {
  // 'expense' | 'income' — kept as free string and lowercased in the service.
  @IsString()
  @IsOptional()
  type?: string;
}

export class MonthlyComparisonQueryDto {
  @Transform(({ value }) =>
    value === undefined || value === '' ? undefined : Number(value),
  )
  @IsInt()
  @Min(1)
  @Max(24)
  @IsOptional()
  months?: number;
}
