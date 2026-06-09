import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { BanksService } from './banks.service';
import { Bank } from './entities/bank.entity';
import { createMockRepo, makeBank, MockRepo } from '../../test-utils/mock-repo';

describe('BanksService', () => {
  let service: BanksService;
  let repo: MockRepo<Bank>;

  beforeEach(async () => {
    repo = createMockRepo<Bank>();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BanksService,
        { provide: getRepositoryToken(Bank), useValue: repo },
      ],
    }).compile();

    service = module.get<BanksService>(BanksService);
  });

  describe('create', () => {
    it('seeds currentBalance from initialBalance and keeps short/color', async () => {
      repo.create!.mockImplementation((v: Partial<Bank>) => v);
      repo.save!.mockImplementation((v: Bank) => Promise.resolve(v));

      await service.create('user-1', {
        name: 'Nubank',
        short: 'Nu',
        color: '#8A05BE',
        initialBalance: 500,
      });

      expect(repo.create).toHaveBeenCalledWith({
        userId: 'user-1',
        name: 'Nubank',
        short: 'Nu',
        color: '#8A05BE',
        initialBalance: 500,
        currentBalance: 500,
      });
    });

    it('defaults balances to 0 and short/color to null when omitted', async () => {
      repo.create!.mockImplementation((v: Partial<Bank>) => v);
      repo.save!.mockImplementation((v: Bank) => Promise.resolve(v));

      await service.create('user-1', { name: 'Wallet' });

      expect(repo.create).toHaveBeenCalledWith({
        userId: 'user-1',
        name: 'Wallet',
        short: null,
        color: null,
        initialBalance: 0,
        currentBalance: 0,
      });
    });
  });

  describe('findAll', () => {
    it('lists banks scoped to the user', async () => {
      const banks = [makeBank()];
      repo.find!.mockResolvedValue(banks);
      await expect(service.findAll('user-1')).resolves.toBe(banks);
      expect(repo.find).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
    });
  });

  describe('findOne', () => {
    it('returns the bank when found', async () => {
      const bank = makeBank({ id: 'bank-1' });
      repo.findOne!.mockResolvedValue(bank);
      await expect(service.findOne('bank-1', 'user-1')).resolves.toBe(bank);
    });

    it('throws NotFoundException when missing', async () => {
      repo.findOne!.mockResolvedValue(null);
      await expect(service.findOne('bank-x', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('merges the dto and persists', async () => {
      const bank = makeBank({ id: 'bank-1', name: 'Old' });
      repo.findOne!.mockResolvedValue(bank);
      repo.save!.mockImplementation((v: Bank) => Promise.resolve(v));

      await service.update('bank-1', 'user-1', { name: 'New' });
      expect(bank.name).toBe('New');
      expect(repo.save).toHaveBeenCalledWith(bank);
    });

    it('throws NotFoundException when the bank does not exist', async () => {
      repo.findOne!.mockResolvedValue(null);
      await expect(
        service.update('bank-x', 'user-1', { name: 'New' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('loads and removes the bank', async () => {
      const bank = makeBank({ id: 'bank-1' });
      repo.findOne!.mockResolvedValue(bank);
      repo.remove!.mockResolvedValue(bank);

      await service.remove('bank-1', 'user-1');
      expect(repo.remove).toHaveBeenCalledWith(bank);
    });

    it('throws NotFoundException when the bank does not exist', async () => {
      repo.findOne!.mockResolvedValue(null);
      await expect(service.remove('bank-x', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
