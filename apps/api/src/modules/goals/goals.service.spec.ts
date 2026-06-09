import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { GoalsService } from './goals.service';
import { Goal } from './entities/goal.entity';
import { createMockRepo, makeGoal, MockRepo } from '../../test-utils/mock-repo';

describe('GoalsService', () => {
  let service: GoalsService;
  let repo: MockRepo<Goal>;

  beforeEach(async () => {
    repo = createMockRepo<Goal>();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoalsService,
        { provide: getRepositoryToken(Goal), useValue: repo },
      ],
    }).compile();

    service = module.get<GoalsService>(GoalsService);
  });

  describe('create', () => {
    it('parses the deadline into a Date when supplied', async () => {
      repo.create!.mockImplementation((v: Partial<Goal>) => v);
      repo.save!.mockImplementation((v: Goal) => Promise.resolve(v));

      await service.create('user-1', {
        title: 'Trip',
        targetAmount: 5000,
        deadline: '2026-12-31',
      });

      const arg = repo.create!.mock.calls[0][0] as Partial<Goal>;
      expect(arg.userId).toBe('user-1');
      expect(arg.title).toBe('Trip');
      expect(arg.targetAmount).toBe(5000);
      expect(arg.deadline).toEqual(new Date('2026-12-31'));
    });

    it('leaves deadline undefined when omitted', async () => {
      repo.create!.mockImplementation((v: Partial<Goal>) => v);
      repo.save!.mockImplementation((v: Goal) => Promise.resolve(v));

      await service.create('user-1', { title: 'Fund', targetAmount: 1000 });

      const arg = repo.create!.mock.calls[0][0] as Partial<Goal>;
      expect(arg.deadline).toBeUndefined();
    });
  });

  describe('findAll', () => {
    it('lists goals scoped to the user, newest first', async () => {
      const goals = [makeGoal()];
      repo.find!.mockResolvedValue(goals);
      await expect(service.findAll('user-1')).resolves.toBe(goals);
      expect(repo.find).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('returns the goal when found', async () => {
      const goal = makeGoal({ id: 'goal-1' });
      repo.findOne!.mockResolvedValue(goal);
      await expect(service.findOne('goal-1', 'user-1')).resolves.toBe(goal);
    });

    it('throws NotFoundException when missing', async () => {
      repo.findOne!.mockResolvedValue(null);
      await expect(service.findOne('goal-x', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('merges the dto and persists', async () => {
      const goal = makeGoal({ id: 'goal-1', currentAmount: 0 });
      repo.findOne!.mockResolvedValue(goal);
      repo.save!.mockImplementation((v: Goal) => Promise.resolve(v));

      await service.update('goal-1', 'user-1', { currentAmount: 250 });
      expect(goal.currentAmount).toBe(250);
      expect(repo.save).toHaveBeenCalledWith(goal);
    });

    it('throws NotFoundException when missing', async () => {
      repo.findOne!.mockResolvedValue(null);
      await expect(
        service.update('goal-x', 'user-1', { currentAmount: 1 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('loads and removes the goal', async () => {
      const goal = makeGoal({ id: 'goal-1' });
      repo.findOne!.mockResolvedValue(goal);
      repo.remove!.mockResolvedValue(goal);
      await service.remove('goal-1', 'user-1');
      expect(repo.remove).toHaveBeenCalledWith(goal);
    });

    it('throws NotFoundException when missing', async () => {
      repo.findOne!.mockResolvedValue(null);
      await expect(service.remove('goal-x', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
