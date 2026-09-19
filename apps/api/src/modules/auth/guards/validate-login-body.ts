import { BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LoginDto } from '../dto/login.dto';

/**
 * Validates a raw login request body against `LoginDto` and throws
 * `BadRequestException` on failure. Pulled out of `LocalAuthGuard` so it can
 * be unit-tested without going through passport's `AuthGuard('local')`
 * machinery.
 */
export async function validateLoginBody(body: unknown): Promise<void> {
  // class-validator's validate() assumes an object to inspect — a `null` (or
  // otherwise non-object) body would throw a raw TypeError here instead of a
  // clean 400, so reject it up front.
  if (typeof body !== 'object' || body === null) {
    throw new BadRequestException('Invalid request body');
  }
  const dto = plainToInstance(LoginDto, body);
  const errors = await validate(dto, { whitelist: true });
  if (errors.length > 0) {
    throw new BadRequestException(
      errors.flatMap((e) => Object.values(e.constraints ?? {})),
    );
  }
}
