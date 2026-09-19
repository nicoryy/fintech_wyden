import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { validateLoginBody } from './validate-login-body';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  /**
   * `passport-local` reads `email`/`password` straight off `req.body`, and
   * Nest runs Guards before Pipes — so a `@Body() dto: LoginDto` parameter on
   * the controller method would validate *after* the strategy already ran.
   * Validate the body here instead, before delegating to the passport
   * strategy, so a malformed login request gets a clean 400 instead of
   * reaching `AuthService.validateUser` with unchecked input.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ body: unknown }>();
    await validateLoginBody(request.body);
    return super.canActivate(context) as Promise<boolean>;
  }
}
