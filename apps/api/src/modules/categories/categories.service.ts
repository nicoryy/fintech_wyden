import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category, CategoryType } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';

/**
 * Default categories shipped with the app. The icon/color values are aligned
 * with the frontend design system so a freshly-seeded database renders
 * correctly without any manual setup.
 */
const DEFAULT_CATEGORIES: ReadonlyArray<{
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
}> = [
  // Expenses
  {
    name: 'Compras',
    type: CategoryType.EXPENSE,
    icon: 'bag',
    color: '#22B07D',
  },
  {
    name: 'Alimentação',
    type: CategoryType.EXPENSE,
    icon: 'food',
    color: '#F4762B',
  },
  {
    name: 'Delivery',
    type: CategoryType.EXPENSE,
    icon: 'repeat',
    color: '#FB6F92',
  },
  {
    name: 'Transporte',
    type: CategoryType.EXPENSE,
    icon: 'car',
    color: '#8B5CF6',
  },
  { name: 'Casa', type: CategoryType.EXPENSE, icon: 'home', color: '#3B82F6' },
  {
    name: 'Saúde',
    type: CategoryType.EXPENSE,
    icon: 'health',
    color: '#EF5DA8',
  },
  {
    name: 'Educação',
    type: CategoryType.EXPENSE,
    icon: 'book',
    color: '#0EA5A0',
  },
  {
    name: 'Lazer',
    type: CategoryType.EXPENSE,
    icon: 'ticket',
    color: '#F5BE3F',
  },
  {
    name: 'Assinaturas',
    type: CategoryType.EXPENSE,
    icon: 'repeat',
    color: '#6366F1',
  },
  {
    name: 'Outros',
    type: CategoryType.EXPENSE,
    icon: 'dots',
    color: '#AEB4BB',
  },
  // Income
  {
    name: 'Salário',
    type: CategoryType.INCOME,
    icon: 'wallet',
    color: '#17A06A',
  },
  {
    name: 'Freelance',
    type: CategoryType.INCOME,
    icon: 'pencil',
    color: '#0EA5A0',
  },
  {
    name: 'Rendimentos',
    type: CategoryType.INCOME,
    icon: 'trend',
    color: '#3B82F6',
  },
  {
    name: 'Reembolso',
    type: CategoryType.INCOME,
    icon: 'repeat',
    color: '#8B5CF6',
  },
  { name: 'Outros', type: CategoryType.INCOME, icon: 'dots', color: '#AEB4BB' },
];

@Injectable()
export class CategoriesService implements OnModuleInit {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepo: Repository<Category>,
  ) {}

  /**
   * Runs at bootstrap. Seeding is best-effort: if the database is unavailable
   * (e.g. local dev without Docker) we log a warning instead of crashing the
   * whole application.
   */
  async onModuleInit(): Promise<void> {
    try {
      await this.seedDefaults();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Skipping category seed (database not ready?): ${message}`,
      );
    }
  }

  create(dto: CreateCategoryDto): Promise<Category> {
    const category = this.categoriesRepo.create(dto);
    return this.categoriesRepo.save(category);
  }

  findAll(): Promise<Category[]> {
    return this.categoriesRepo.find();
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoriesRepo.findOne({ where: { id } });
    if (!category) throw new NotFoundException(`Category ${id} not found`);
    return category;
  }

  async remove(id: string): Promise<void> {
    const category = await this.findOne(id);
    await this.categoriesRepo.remove(category);
  }

  /**
   * Idempotently creates the default app categories. A category is considered
   * to already exist when a row with the same (name, type) pair is present, so
   * calling this repeatedly never produces duplicates.
   *
   * @returns the number of categories actually inserted on this call.
   */
  async seedDefaults(): Promise<{ created: number }> {
    const existing = await this.categoriesRepo.find();
    const existingKeys = new Set(
      existing.map((c) => `${c.type}:${c.name.toLowerCase()}`),
    );

    const toCreate = DEFAULT_CATEGORIES.filter(
      (c) => !existingKeys.has(`${c.type}:${c.name.toLowerCase()}`),
    );

    if (toCreate.length === 0) {
      return { created: 0 };
    }

    const entities = this.categoriesRepo.create(toCreate);
    await this.categoriesRepo.save(entities);
    this.logger.log(`Seeded ${entities.length} default categories`);
    return { created: entities.length };
  }
}
