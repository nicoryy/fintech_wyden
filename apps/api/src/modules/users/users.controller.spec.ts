import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import type { JwtPayload } from '../../common/types/jwt-payload.type';

describe('UsersController', () => {
  let controller: UsersController;
  let service: { create: jest.Mock; update: jest.Mock; remove: jest.Mock };

  beforeEach(async () => {
    service = { create: jest.fn(), update: jest.fn(), remove: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: service }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  describe('create', () => {
    it('delegates registration straight to the service', async () => {
      const dto = { name: 'A', email: 'a@b.com', password: 'secret' };
      service.create.mockResolvedValue({ id: 'user-1', ...dto });

      await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  // Regression coverage for the IDOR fix: these routes used to take an
  // arbitrary `:id` from the URL with nothing checking it against the
  // caller. Now there is no `:id` param at all — the target user can only
  // ever be the one carried in the JWT, so it is structurally impossible to
  // read/edit/delete another account through this controller.
  describe('update (PATCH /users/me)', () => {
    it('always targets the id from the token, never a client-supplied id', async () => {
      const caller: JwtPayload = { id: 'user-1', email: 'a@b.com' };
      const dto = { name: 'Renamed' };
      service.update.mockResolvedValue({ id: 'user-1', ...dto });

      await controller.update(caller, dto);

      expect(service.update).toHaveBeenCalledWith('user-1', dto);
      expect(service.update).not.toHaveBeenCalledWith(
        expect.not.stringMatching('user-1'),
        expect.anything(),
      );
    });
  });

  describe('remove (DELETE /users/me)', () => {
    it('always targets the id from the token, never a client-supplied id', async () => {
      const caller: JwtPayload = { id: 'user-2', email: 'b@b.com' };
      service.remove.mockResolvedValue(undefined);

      await controller.remove(caller);

      expect(service.remove).toHaveBeenCalledWith('user-2');
    });
  });
});
