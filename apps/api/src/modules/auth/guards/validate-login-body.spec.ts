import { BadRequestException } from '@nestjs/common';
import { validateLoginBody } from './validate-login-body';

describe('validateLoginBody', () => {
  it('resolves for a well-formed body', async () => {
    await expect(
      validateLoginBody({ email: 'a@b.com', password: 'secret' }),
    ).resolves.toBeUndefined();
  });

  it('rejects a missing email', async () => {
    await expect(validateLoginBody({ password: 'secret' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects a malformed email', async () => {
    await expect(
      validateLoginBody({ email: 'not-an-email', password: 'secret' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects a missing password', async () => {
    await expect(validateLoginBody({ email: 'a@b.com' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects a password shorter than 6 characters', async () => {
    await expect(
      validateLoginBody({ email: 'a@b.com', password: '123' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects a non-string password (e.g. an object, which would otherwise reach bcrypt.compare)', async () => {
    await expect(
      validateLoginBody({ email: 'a@b.com', password: { $ne: null } }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects an empty or non-object body', async () => {
    await expect(validateLoginBody({})).rejects.toThrow(BadRequestException);
    await expect(validateLoginBody(null)).rejects.toThrow(BadRequestException);
  });
});
