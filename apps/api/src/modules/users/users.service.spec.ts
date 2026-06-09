import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { createMockRepo, makeUser, MockRepo } from '../../test-utils/mock-repo';

jest.mock('bcrypt');
// bcrypt.hash is overloaded, so jest.Mocked infers its args as `never`. Typing
// the mocked member as a plain jest.Mock avoids per-call casts.
const mockedBcrypt = bcrypt as unknown as { hash: jest.Mock };

describe('UsersService', () => {
  let service: UsersService;
  let repo: MockRepo<User>;

  beforeEach(async () => {
    repo = createMockRepo<User>();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: repo },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('throws ConflictException when the email already exists', async () => {
      repo.findOne!.mockResolvedValue(makeUser({ email: 'dup@b.com' }));

      await expect(
        service.create({ name: 'A', email: 'dup@b.com', password: 'secret' }),
      ).rejects.toThrow(ConflictException);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('hashes the password and saves the new user', async () => {
      repo.findOne!.mockResolvedValue(null);
      mockedBcrypt.hash.mockResolvedValue('hashed');
      repo.create!.mockImplementation((v: Partial<User>) => v);
      repo.save!.mockImplementation((v: User) => Promise.resolve(v));

      const result = await service.create({
        name: 'A',
        email: 'new@b.com',
        password: 'secret',
      });

      expect(mockedBcrypt.hash).toHaveBeenCalledWith('secret', 10);
      expect(repo.create).toHaveBeenCalledWith({
        name: 'A',
        email: 'new@b.com',
        passwordHash: 'hashed',
      });
      expect(result.passwordHash).toBe('hashed');
    });
  });

  describe('findOne', () => {
    it('returns the user when found', async () => {
      const user = makeUser({ id: 'user-1' });
      repo.findOne!.mockResolvedValue(user);
      await expect(service.findOne('user-1')).resolves.toBe(user);
    });

    it('throws NotFoundException when missing', async () => {
      repo.findOne!.mockResolvedValue(null);
      await expect(service.findOne('user-x')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByEmail', () => {
    it('delegates to the repository', async () => {
      const user = makeUser({ email: 'a@b.com' });
      repo.findOne!.mockResolvedValue(user);
      await expect(service.findByEmail('a@b.com')).resolves.toBe(user);
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { email: 'a@b.com' },
      });
    });
  });

  describe('update', () => {
    it('re-hashes the password and strips the raw password from the dto', async () => {
      const user = makeUser({ id: 'user-1', passwordHash: 'old' });
      repo.findOne!.mockResolvedValue(user);
      mockedBcrypt.hash.mockResolvedValue('new-hash');
      repo.save!.mockImplementation((v: User) => Promise.resolve(v));

      const dto = { name: 'Updated', password: 'newsecret' };
      await service.update('user-1', dto);

      expect(mockedBcrypt.hash).toHaveBeenCalledWith('newsecret', 10);
      expect(user.passwordHash).toBe('new-hash');
      expect(user.name).toBe('Updated');
      // password removed from the dto so Object.assign cannot overwrite hash.
      expect(dto).not.toHaveProperty('password');
    });

    it('does not hash when no password is provided', async () => {
      const user = makeUser({ id: 'user-1', passwordHash: 'old' });
      repo.findOne!.mockResolvedValue(user);
      repo.save!.mockImplementation((v: User) => Promise.resolve(v));

      await service.update('user-1', { name: 'Renamed' });

      expect(mockedBcrypt.hash).not.toHaveBeenCalled();
      expect(user.passwordHash).toBe('old');
      expect(user.name).toBe('Renamed');
    });

    it('throws NotFoundException when the user does not exist', async () => {
      repo.findOne!.mockResolvedValue(null);
      await expect(service.update('user-x', { name: 'X' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('loads and removes the user', async () => {
      const user = makeUser({ id: 'user-1' });
      repo.findOne!.mockResolvedValue(user);
      repo.remove!.mockResolvedValue(user);

      await service.remove('user-1');
      expect(repo.remove).toHaveBeenCalledWith(user);
    });

    it('throws NotFoundException when the user does not exist', async () => {
      repo.findOne!.mockResolvedValue(null);
      await expect(service.remove('user-x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('returns all users', async () => {
      const users = [makeUser(), makeUser()];
      repo.find!.mockResolvedValue(users);
      await expect(service.findAll()).resolves.toBe(users);
    });
  });
});
