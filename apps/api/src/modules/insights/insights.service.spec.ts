import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { InsightsService } from './insights.service';
import { Insight } from './entities/insight.entity';
import {
  createMockRepo,
  makeInsight,
  MockRepo,
} from '../../test-utils/mock-repo';

describe('InsightsService', () => {
  let service: InsightsService;
  let repo: MockRepo<Insight>;

  beforeEach(async () => {
    repo = createMockRepo<Insight>();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InsightsService,
        { provide: getRepositoryToken(Insight), useValue: repo },
      ],
    }).compile();

    service = module.get<InsightsService>(InsightsService);
  });

  describe('findAll', () => {
    it('lists insights scoped to the user, newest first', async () => {
      const insights = [makeInsight()];
      repo.find!.mockResolvedValue(insights);
      await expect(service.findAll('user-1')).resolves.toBe(insights);
      expect(repo.find).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        order: { generatedAt: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('returns the insight when found', async () => {
      const insight = makeInsight({ id: 'insight-1' });
      repo.findOne!.mockResolvedValue(insight);
      await expect(service.findOne('insight-1', 'user-1')).resolves.toBe(
        insight,
      );
    });

    it('throws NotFoundException when missing', async () => {
      repo.findOne!.mockResolvedValue(null);
      await expect(service.findOne('insight-x', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
