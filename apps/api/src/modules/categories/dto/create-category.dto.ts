import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { CategoryType } from '../entities/category.entity';

export class CreateCategoryDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsEnum(CategoryType)
  type: CategoryType;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  icon?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  color?: string;
}
