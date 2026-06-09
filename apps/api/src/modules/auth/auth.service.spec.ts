import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { makeUser } from '../../test-utils/mock-repo';

jest.mock('bcrypt');

// bcrypt's hash/compare are overloaded, which makes jest.Mocked infer their
// argument types as `never`. Typing the mocked members as plain jest.Mock lets
// us drive resolved values without per-call casts.
const mockedBcrypt = bcrypt as unknown as {
  compare: jest.Mock;
  hash: jest.Mock;
};

describe('AuthService', () => {
  let service: AuthService;
  let usersService: { findByEmail: jest.Mock; findOne: jest.Mock };
  let jwtService: { sign: jest.Mock; verify: jest.Mock };
  let config: { get: jest.Mock };

  beforeEach(async () => {
    usersService = { findByEmail: jest.fn(), findOne: jest.fn() };
    jwtService = { sign: jest.fn(), verify: jest.fn() };
    config = { get: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('returns the user when the password matches', async () => {
      const user = makeUser({ email: 'a@b.com', passwordHash: 'hash' });
      usersService.findByEmail.mockResolvedValue(user);
      mockedBcrypt.compare.mockResolvedValue(true);

      await expect(service.validateUser('a@b.com', 'secret')).resolves.toBe(
        user,
      );
      expect(mockedBcrypt.compare).toHaveBeenCalledWith('secret', 'hash');
    });

    it('returns null when the password does not match', async () => {
      const user = makeUser({ email: 'a@b.com', passwordHash: 'hash' });
      usersService.findByEmail.mockResolvedValue(user);
      mockedBcrypt.compare.mockResolvedValue(false);

      await expect(
        service.validateUser('a@b.com', 'wrong'),
      ).resolves.toBeNull();
    });

    it('returns null when the user does not exist', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.validateUser('missing@b.com', 'secret'),
      ).resolves.toBeNull();
      expect(mockedBcrypt.compare).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('returns access_token, refresh_token and a sanitized user', () => {
      const user = makeUser({
        id: 'user-7',
        name: 'Joe',
        email: 'joe@b.com',
        passwordHash: 'secret-hash',
      });
      jwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');
      config.get.mockReturnValue('30d');

      const result = service.login(user);

      expect(result.access_token).toBe('access-token');
      expect(result.refresh_token).toBe('refresh-token');
      expect(result.user).toEqual({
        id: 'user-7',
        name: 'Joe',
        email: 'joe@b.com',
      });
      // Never leak the password hash.
      expect(result.user).not.toHaveProperty('passwordHash');
    });
  });

  describe('refresh', () => {
    it('issues a new access token when the refresh token is valid', async () => {
      const user = makeUser({ id: 'user-1', email: 'a@b.com' });
      jwtService.verify.mockReturnValue({ sub: 'user-1', email: 'a@b.com' });
      usersService.findByEmail.mockResolvedValue(user);
      config.get.mockReturnValue('refresh-secret');
      jwtService.sign.mockReturnValue('new-access-token');

      await expect(service.refresh('valid-token')).resolves.toEqual({
        access_token: 'new-access-token',
      });
    });

    it('throws UnauthorizedException when the token signature is invalid', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('invalid signature');
      });
      config.get.mockReturnValue('refresh-secret');

      await expect(service.refresh('bad-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when the user no longer exists', async () => {
      jwtService.verify.mockReturnValue({ sub: 'user-1', email: 'a@b.com' });
      usersService.findByEmail.mockResolvedValue(null);
      config.get.mockReturnValue('refresh-secret');

      await expect(service.refresh('valid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when the token sub mismatches the user', async () => {
      const user = makeUser({ id: 'user-1', email: 'a@b.com' });
      jwtService.verify.mockReturnValue({
        sub: 'user-OTHER',
        email: 'a@b.com',
      });
      usersService.findByEmail.mockResolvedValue(user);
      config.get.mockReturnValue('refresh-secret');

      await expect(service.refresh('valid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('me', () => {
    it('returns the sanitized profile of the current user', async () => {
      const user = makeUser({
        id: 'user-9',
        name: 'Ana',
        email: 'ana@b.com',
        passwordHash: 'secret-hash',
      });
      usersService.findOne.mockResolvedValue(user);

      const result = await service.me('user-9');

      expect(usersService.findOne).toHaveBeenCalledWith('user-9');
      expect(result).toEqual({ id: 'user-9', name: 'Ana', email: 'ana@b.com' });
      expect(result).not.toHaveProperty('passwordHash');
    });
  });
});
