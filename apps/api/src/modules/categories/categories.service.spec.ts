import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { Category, CategoryType } from './entities/category.entity';
import {
  createMockRepo,
  makeCategory,
  MockRepo,
} from '../../test-utils/mock-repo';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let repo: MockRepo<Category>;

  beforeEach(async () => {
    repo = createMockRepo<Category>();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: getRepositoryToken(Category), useValue: repo },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  describe('create', () => {
    it('creates and saves a category', async () => {
      repo.create!.mockImplementation((v: Partial<Category>) => v);
      repo.save!.mockImplementation((v: Category) => Promise.resolve(v));

      const dto = { name: 'Custom', type: CategoryType.EXPENSE };
      await service.create(dto);
      expect(repo.create).toHaveBeenCalledWith(dto);
      expect(repo.save).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('returns all categories', async () => {
      const cats = [makeCategory()];
      repo.find!.mockResolvedValue(cats);
      await expect(service.findAll()).resolves.toBe(cats);
    });
  });

  describe('findOne', () => {
    it('returns the category when found', async () => {
      const cat = makeCategory({ id: 'cat-1' });
      repo.findOne!.mockResolvedValue(cat);
      await expect(service.findOne('cat-1')).resolves.toBe(cat);
    });

    it('throws NotFoundException when missing', async () => {
      repo.findOne!.mockResolvedValue(null);
      await expect(service.findOne('cat-x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('loads and removes the category', async () => {
      const cat = makeCategory({ id: 'cat-1' });
      repo.findOne!.mockResolvedValue(cat);
      repo.remove!.mockResolvedValue(cat);
      await service.remove('cat-1');
      expect(repo.remove).toHaveBeenCalledWith(cat);
    });

    it('throws NotFoundException when missing', async () => {
      repo.findOne!.mockResolvedValue(null);
      await expect(service.remove('cat-x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('seedDefaults (idempotency)', () => {
    it('creates all 15 defaults (10 expense + 5 income) when empty', async () => {
      repo.find!.mockResolvedValue([]);
      repo.create!.mockImplementation((v: unknown[]) => v);
      repo.save!.mockImplementation((v: unknown) => Promise.resolve(v));

      const result = await service.seedDefaults();

      expect(result).toEqual({ created: 15 });
      // Verify the split is 10 EXPENSE + 5 INCOME.
      const created = repo.create!.mock.calls[0][0] as Array<{
        type: CategoryType;
      }>;
      expect(created).toHaveLength(15);
      expect(
        created.filter((c) => c.type === CategoryType.EXPENSE),
      ).toHaveLength(10);
      expect(
        created.filter((c) => c.type === CategoryType.INCOME),
      ).toHaveLength(5);
    });

    it('creates nothing when every default already exists (idempotent)', async () => {
      // Pre-populate with all defaults already present (matching on type:name).
      const existing = [
        ...[
          'Compras',
          'Alimentação',
          'Delivery',
          'Transporte',
          'Casa',
          'Saúde',
          'Educação',
          'Lazer',
          'Assinaturas',
          'Outros',
        ].map((name) => makeCategory({ name, type: CategoryType.EXPENSE })),
        ...['Salário', 'Freelance', 'Rendimentos', 'Reembolso', 'Outros'].map(
          (name) => makeCategory({ name, type: CategoryType.INCOME }),
        ),
      ];
      repo.find!.mockResolvedValue(existing);

      const result = await service.seedDefaults();

      expect(result).toEqual({ created: 0 });
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('matches existing categories case-insensitively', async () => {
      const existing = [
        ...[
          'COMPRAS',
          'alimentação',
          'Delivery',
          'transporte',
          'CASA',
          'saúde',
          'educação',
          'LAZER',
          'assinaturas',
          'outros',
        ].map((name) => makeCategory({ name, type: CategoryType.EXPENSE })),
        ...['SALÁRIO', 'freelance', 'Rendimentos', 'reembolso', 'OUTROS'].map(
          (name) => makeCategory({ name, type: CategoryType.INCOME }),
        ),
      ];
      repo.find!.mockResolvedValue(existing);

      const result = await service.seedDefaults();
      expect(result).toEqual({ created: 0 });
    });

    it('only creates the missing subset when some already exist', async () => {
      // Only one expense already present -> 14 remain to create.
      repo.find!.mockResolvedValue([
        makeCategory({ name: 'Compras', type: CategoryType.EXPENSE }),
      ]);
      repo.create!.mockImplementation((v: unknown[]) => v);
      repo.save!.mockImplementation((v: unknown) => Promise.resolve(v));

      const result = await service.seedDefaults();
      expect(result).toEqual({ created: 14 });
    });
  });

  describe('onModuleInit', () => {
    it('swallows seeding errors (database not ready) without throwing', async () => {
      repo.find!.mockRejectedValue(new Error('connection refused'));
      await expect(service.onModuleInit()).resolves.toBeUndefined();
    });
  });
});
